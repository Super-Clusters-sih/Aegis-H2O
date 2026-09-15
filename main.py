from pathlib import Path
from datetime import datetime, timezone

import joblib
import pandas as pd

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime
from sqlalchemy.orm import declarative_base


# ==================================================
# DATABASE
# ==================================================

import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not configured")

engine = create_engine(DATABASE_URL)

Base = declarative_base()


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)

    timestamp = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

    ph = Column(Float)
    tds_mgl = Column(Float)
    flow_lpm = Column(Float)
    turbidity_ntu = Column(Float)
    photodiode_mv = Column(Float)

    water_health = Column(String)
    filter_status = Column(String)


# Create table automatically if it doesn't exist
Base.metadata.create_all(bind=engine)


# ==================================================
# FASTAPI
# ==================================================

app = FastAPI(
    title="Aegis H2O API",
    description="Water health and filter status prediction API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================================================
# LOAD ML MODELS
# ==================================================

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"

water_model = joblib.load(
    MODEL_DIR / "water_health_model.pkl"
)

filter_model_1 = joblib.load(
    MODEL_DIR / "filter_status_ordinal_1.pkl"
)

filter_model_2 = joblib.load(
    MODEL_DIR / "filter_status_ordinal_2.pkl"
)

filter_model_3 = joblib.load(
    MODEL_DIR / "filter_status_ordinal_3.pkl"
)

print("Aegis H2O ML models loaded successfully.")


# ==================================================
# SENSOR INPUT
# ==================================================

class SensorData(BaseModel):
    ph: float
    tds_mgl: float
    flow_lpm: float
    turbidity_ntu: float
    photodiode_mv: float


# ==================================================
# HOME
# ==================================================

@app.get("/")
def home():

    return {
        "project": "Aegis H2O",
        "status": "API is running",
        "ml_models": "loaded",
        "database": "connected"
    }


# ==================================================
# PREDICTION
# ==================================================

@app.post("/predict")
def predict(data: SensorData):

    sensor_input = pd.DataFrame([{
        "ph": data.ph,
        "tds_mgl": data.tds_mgl,
        "flow_lpm": data.flow_lpm,
        "turbidity_ntu": data.turbidity_ntu,
        "photodiode_mv": data.photodiode_mv
    }])


    # ----------------------------------------------
    # Water Health
    # ----------------------------------------------

    health_prediction = water_model.predict(
        sensor_input
    )[0]

    health_labels = {
        0: "Unsafe",
        1: "Moderate",
        2: "Safe"
    }

    water_health = health_labels[
        int(health_prediction)
    ]


    # ----------------------------------------------
    # Filter Status
    # ----------------------------------------------

    p_ge_degraded = filter_model_1.predict_proba(
        sensor_input
    )[0, 1]

    p_ge_normal = filter_model_2.predict_proba(
        sensor_input
    )[0, 1]

    p_ge_good = filter_model_3.predict_proba(
        sensor_input
    )[0, 1]


    if p_ge_degraded < 0.50:

        filter_status_code = 0

    elif p_ge_normal < 0.50:

        filter_status_code = 1

    elif p_ge_good < 0.50:

        filter_status_code = 2

    else:

        filter_status_code = 3


    filter_labels = {
        0: "Replace",
        1: "Degraded",
        2: "Normal",
        3: "Good"
    }

    filter_status = filter_labels[
        filter_status_code
    ]


    # ----------------------------------------------
    # SAVE TO DATABASE
    # ----------------------------------------------

    reading = SensorReading(

        ph=data.ph,
        tds_mgl=data.tds_mgl,
        flow_lpm=data.flow_lpm,
        turbidity_ntu=data.turbidity_ntu,
        photodiode_mv=data.photodiode_mv,

        water_health=water_health,
        filter_status=filter_status
    )

    with engine.begin() as connection:

        connection.execute(
            SensorReading.__table__.insert(),
            {
                "ph": reading.ph,
                "tds_mgl": reading.tds_mgl,
                "flow_lpm": reading.flow_lpm,
                "turbidity_ntu": reading.turbidity_ntu,
                "photodiode_mv": reading.photodiode_mv,
                "water_health": reading.water_health,
                "filter_status": reading.filter_status
            }
        )


    # ----------------------------------------------
    # RESPONSE
    # ----------------------------------------------

    return {

        "sensor_data": {
            "ph": data.ph,
            "tds_mgl": data.tds_mgl,
            "flow_lpm": data.flow_lpm,
            "turbidity_ntu": data.turbidity_ntu,
            "photodiode_mv": data.photodiode_mv
        },

        "prediction": {
            "water_health": water_health,
            "filter_status": filter_status
        },

        "filter_probabilities": {
            "p_ge_degraded": round(
                float(p_ge_degraded), 4
            ),
            "p_ge_normal": round(
                float(p_ge_normal), 4
            ),
            "p_ge_good": round(
                float(p_ge_good), 4
            )
        },

        "database": "reading saved"
    }
    
@app.get("/latest")
def get_latest_reading():
    from sqlalchemy.orm import Session

    db = Session(engine)

    try:
        reading = (
            db.query(SensorReading)
            .order_by(SensorReading.id.desc())
            .first()
        )

        if reading is None:
            return {
                "status": "no_data",
                "message": "No sensor readings available"
            }

        return {
            "id": reading.id,
            "timestamp": reading.timestamp,
            "sensor_data": {
                "ph": reading.ph,
                "tds_mgl": reading.tds_mgl,
                "flow_lpm": reading.flow_lpm,
                "turbidity_ntu": reading.turbidity_ntu,
                "photodiode_mv": reading.photodiode_mv
            },
            "prediction": {
                "water_health": reading.water_health,
                "filter_status": reading.filter_status
            }
        }

    finally:
        db.close()
        
@app.get("/history")
def get_history():
    from sqlalchemy.orm import Session

    db = Session(engine)

    try:
        readings = (
            db.query(SensorReading)
            .order_by(SensorReading.id.desc())
            .limit(50)
            .all()
        )

        readings.reverse()

        return [
            {
                "id": reading.id,
                "timestamp": reading.timestamp,
                "ph": reading.ph,
                "tds_mgl": reading.tds_mgl,
                "flow_lpm": reading.flow_lpm,
                "turbidity_ntu": reading.turbidity_ntu,
                "photodiode_mv": reading.photodiode_mv,
                "water_health": reading.water_health,
                "filter_status": reading.filter_status
            }
            for reading in readings
        ]

    finally:
        db.close()