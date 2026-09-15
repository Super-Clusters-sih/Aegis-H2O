from pathlib import Path
from datetime import datetime, timezone
import os

import joblib
import numpy as np
import psycopg2
from psycopg2.extras import RealDictCursor

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


# ==================================================
# DATABASE
# ==================================================

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not configured")


def get_db_connection():
    return psycopg2.connect(DATABASE_URL)


def create_table():
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS sensor_readings (
                    id SERIAL PRIMARY KEY,
                    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    ph DOUBLE PRECISION,
                    tds_mgl DOUBLE PRECISION,
                    flow_lpm DOUBLE PRECISION,
                    turbidity_ntu DOUBLE PRECISION,
                    photodiode_mv DOUBLE PRECISION,
                    water_health VARCHAR,
                    filter_status VARCHAR
                )
            """)

        connection.commit()


create_table()


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

@app.get("/api")
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

@app.post("/api/predict")
def predict(data: SensorData):

    # ----------------------------------------------
    # SENSOR INPUT
    # ----------------------------------------------

    sensor_input = np.array([[
        data.ph,
        data.tds_mgl,
        data.flow_lpm,
        data.turbidity_ntu,
        data.photodiode_mv
    ]])


    # ----------------------------------------------
    # WATER HEALTH
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
    # FILTER STATUS
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

    with get_db_connection() as connection:

        with connection.cursor() as cursor:

            cursor.execute("""
                INSERT INTO sensor_readings (
                    ph,
                    tds_mgl,
                    flow_lpm,
                    turbidity_ntu,
                    photodiode_mv,
                    water_health,
                    filter_status
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                data.ph,
                data.tds_mgl,
                data.flow_lpm,
                data.turbidity_ntu,
                data.photodiode_mv,
                water_health,
                filter_status
            ))

        connection.commit()


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


# ==================================================
# LATEST READING
# ==================================================

@app.get("/api/latest")
def get_latest_reading():

    with get_db_connection() as connection:

        with connection.cursor(
            cursor_factory=RealDictCursor
        ) as cursor:

            cursor.execute("""
                SELECT
                    id,
                    timestamp,
                    ph,
                    tds_mgl,
                    flow_lpm,
                    turbidity_ntu,
                    photodiode_mv,
                    water_health,
                    filter_status
                FROM sensor_readings
                ORDER BY id DESC
                LIMIT 1
            """)

            reading = cursor.fetchone()


    if reading is None:

        return {
            "status": "no_data",
            "message": "No sensor readings available"
        }


    return {

        "id": reading["id"],

        "timestamp": reading["timestamp"],

        "sensor_data": {
            "ph": reading["ph"],
            "tds_mgl": reading["tds_mgl"],
            "flow_lpm": reading["flow_lpm"],
            "turbidity_ntu": reading["turbidity_ntu"],
            "photodiode_mv": reading["photodiode_mv"]
        },

        "prediction": {
            "water_health": reading["water_health"],
            "filter_status": reading["filter_status"]
        }
    }


# ==================================================
# HISTORY
# ==================================================

@app.get("/api/history")
def get_history():

    with get_db_connection() as connection:

        with connection.cursor(
            cursor_factory=RealDictCursor
        ) as cursor:

            cursor.execute("""
                SELECT
                    id,
                    timestamp,
                    ph,
                    tds_mgl,
                    flow_lpm,
                    turbidity_ntu,
                    photodiode_mv,
                    water_health,
                    filter_status
                FROM sensor_readings
                ORDER BY id DESC
                LIMIT 50
            """)

            readings = cursor.fetchall()


    readings.reverse()


    return [

        {
            "id": reading["id"],

            "timestamp": reading["timestamp"],

            "ph": reading["ph"],

            "tds_mgl": reading["tds_mgl"],

            "flow_lpm": reading["flow_lpm"],

            "turbidity_ntu": reading["turbidity_ntu"],

            "photodiode_mv": reading["photodiode_mv"],

            "water_health": reading["water_health"],

            "filter_status": reading["filter_status"]
        }

        for reading in readings
    ]


# ==================================================
# SENSOR DATA INPUT
# ==================================================

@app.post("/api/sensor-data")
def receive_sensor_data(data: SensorData):

    return predict(data)