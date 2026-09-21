from pathlib import Path
from datetime import datetime, timezone
import os

import joblib
import numpy as np
import psycopg2
from psycopg2.extras import RealDictCursor

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr


# ==================================================
# DATABASE
# ==================================================

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
AEGIS_ADMIN_API_KEY = os.getenv("AEGIS_ADMIN_API_KEY")
AEGIS_FRONTEND_URL = os.getenv("AEGIS_FRONTEND_URL", "")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not configured")


def get_db_connection():
    return psycopg2.connect(DATABASE_URL)


def create_table():
    with get_db_connection() as connection:
        with connection.cursor() as cursor:

            # ------------------------------------------
            # sensor_readings — unchanged
            # ------------------------------------------
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

            # ------------------------------------------
            # companies — base table (unchanged columns)
            # ------------------------------------------
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS companies (
                    id SERIAL PRIMARY KEY,
                    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
                    company_name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    status VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (
                            status IN (
                                'pending',
                                'approved',
                                'rejected',
                                'suspended'
                            )
                        ),
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    approved_at TIMESTAMPTZ,
                    approved_by VARCHAR(255)
                )
            """)

            # ------------------------------------------
            # companies — add new optional columns
            # (idempotent via DO block)
            # ------------------------------------------
            cursor.execute("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'companies'
                          AND column_name = 'full_name'
                    ) THEN
                        ALTER TABLE companies
                            ADD COLUMN full_name VARCHAR(255);
                    END IF;

                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'companies'
                          AND column_name = 'org_type'
                    ) THEN
                        ALTER TABLE companies
                            ADD COLUMN org_type VARCHAR(100);
                    END IF;

                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'companies'
                          AND column_name = 'reason_for_access'
                    ) THEN
                        ALTER TABLE companies
                            ADD COLUMN reason_for_access TEXT;
                    END IF;

                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'companies'
                          AND column_name = 'rejection_reason'
                    ) THEN
                        ALTER TABLE companies
                            ADD COLUMN rejection_reason TEXT;
                    END IF;
                END
                $$;
            """)

            # ------------------------------------------
            # contact_messages
            # ------------------------------------------
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS contact_messages (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(255),
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    subject VARCHAR(500) NOT NULL,
                    message TEXT NOT NULL,
                    status VARCHAR(20) NOT NULL DEFAULT 'unread'
                        CHECK (status IN ('unread', 'in_progress', 'resolved')),
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # ------------------------------------------
            # admin_audit_log
            # ------------------------------------------
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS admin_audit_log (
                    id SERIAL PRIMARY KEY,
                    admin_clerk_id VARCHAR(255) NOT NULL,
                    action VARCHAR(100) NOT NULL,
                    target_company_id INTEGER,
                    target_message_id INTEGER,
                    notes TEXT,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                )
            """)

        connection.commit()


create_table()


# ==================================================
# FASTAPI
# ==================================================

app = FastAPI(
    title="Aegis H2O API",
    description="Water health, filter status, company approval, and contact API",
    version="1.2.0"
)

# Build CORS origins list
_cors_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
if AEGIS_FRONTEND_URL:
    _cors_origins.append(AEGIS_FRONTEND_URL.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================================================
# LOAD ML MODELS
# ==================================================
# DO NOT MODIFY — trained model files are fixed

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
# REQUEST MODELS
# ==================================================

class SensorData(BaseModel):
    ph: float
    tds_mgl: float
    flow_lpm: float
    turbidity_ntu: float
    photodiode_mv: float


class CompanyRegistration(BaseModel):
    clerk_user_id: str
    company_name: str
    email: str
    full_name: str | None = None
    org_type: str | None = None
    reason_for_access: str | None = None


class CompanyStatusUpdate(BaseModel):
    status: str
    approved_by: str | None = None
    rejection_reason: str | None = None


class ContactMessage(BaseModel):
    user_id: str | None = None
    name: str
    email: str
    subject: str
    message: str


class ContactMessageStatusUpdate(BaseModel):
    status: str


class AuditLogEntry(BaseModel):
    admin_clerk_id: str
    action: str
    target_company_id: int | None = None
    target_message_id: int | None = None
    notes: str | None = None


# ==================================================
# ADMIN AUTHENTICATION
# ==================================================

def verify_admin(admin_key: str | None):
    if not AEGIS_ADMIN_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="AEGIS_ADMIN_API_KEY is not configured on the server"
        )

    if admin_key != AEGIS_ADMIN_API_KEY:
        raise HTTPException(
            status_code=403,
            detail="Invalid admin key"
        )


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
# COMPANY REGISTRATION
# ==================================================

_ALLOWED_ORG_TYPES = {
    "College",
    "School",
    "Business",
    "Research Organization",
    "Other",
}


@app.post("/api/companies/register")
def register_company(data: CompanyRegistration):
    company_name = data.company_name.strip()
    email = data.email.strip().lower()
    clerk_user_id = data.clerk_user_id.strip()
    full_name = data.full_name.strip() if data.full_name else None
    org_type = data.org_type.strip() if data.org_type else None
    reason_for_access = (
        data.reason_for_access.strip()
        if data.reason_for_access
        else None
    )

    if not company_name:
        raise HTTPException(
            status_code=400,
            detail="Organization name is required"
        )

    if not email:
        raise HTTPException(
            status_code=400,
            detail="Email is required"
        )

    if not clerk_user_id:
        raise HTTPException(
            status_code=400,
            detail="Clerk user ID is required"
        )

    if org_type and org_type not in _ALLOWED_ORG_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid organization type"
        )

    with get_db_connection() as connection:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                SELECT
                    id,
                    clerk_user_id,
                    company_name,
                    full_name,
                    email,
                    org_type,
                    reason_for_access,
                    status,
                    created_at,
                    approved_at,
                    approved_by
                FROM companies
                WHERE clerk_user_id = %s OR email = %s
                LIMIT 1
            """, (clerk_user_id, email))

            existing_company = cursor.fetchone()

            if existing_company:
                return {
                    "status": "already_registered",
                    "message": "This account is already registered",
                    "company": dict(existing_company)
                }

            cursor.execute("""
                INSERT INTO companies (
                    clerk_user_id,
                    company_name,
                    full_name,
                    email,
                    org_type,
                    reason_for_access,
                    status
                )
                VALUES (%s, %s, %s, %s, %s, %s, 'pending')
                RETURNING
                    id,
                    clerk_user_id,
                    company_name,
                    full_name,
                    email,
                    org_type,
                    reason_for_access,
                    status,
                    created_at,
                    approved_at,
                    approved_by
            """, (
                clerk_user_id,
                company_name,
                full_name,
                email,
                org_type,
                reason_for_access,
            ))

            company = cursor.fetchone()

        connection.commit()

    return {
        "status": "registered",
        "message": "Access request submitted. Awaiting administrator approval.",
        "company": dict(company)
    }


@app.get("/api/companies/status/{clerk_user_id}")
def get_company_status(clerk_user_id: str):
    with get_db_connection() as connection:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                SELECT
                    id,
                    clerk_user_id,
                    company_name,
                    full_name,
                    email,
                    org_type,
                    reason_for_access,
                    status,
                    rejection_reason,
                    created_at,
                    approved_at,
                    approved_by
                FROM companies
                WHERE clerk_user_id = %s
            """, (clerk_user_id,))

            company = cursor.fetchone()

    if company is None:
        raise HTTPException(
            status_code=404,
            detail="Registration not found"
        )

    return {
        "status": "success",
        "company": dict(company)
    }


# ==================================================
# ADMIN COMPANY MANAGEMENT
# ==================================================

@app.get("/api/admin/companies")
def get_all_companies(
    x_admin_key: str | None = Header(default=None)
):
    verify_admin(x_admin_key)

    with get_db_connection() as connection:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                SELECT
                    id,
                    clerk_user_id,
                    company_name,
                    full_name,
                    email,
                    org_type,
                    reason_for_access,
                    status,
                    rejection_reason,
                    created_at,
                    approved_at,
                    approved_by
                FROM companies
                ORDER BY created_at DESC
            """)

            companies = cursor.fetchall()

    return {
        "status": "success",
        "count": len(companies),
        "companies": [dict(company) for company in companies]
    }


@app.patch("/api/admin/companies/{company_id}")
def update_company_status(
    company_id: int,
    data: CompanyStatusUpdate,
    x_admin_key: str | None = Header(default=None)
):
    verify_admin(x_admin_key)

    allowed_statuses = {
        "pending",
        "approved",
        "rejected",
        "suspended"
    }

    if data.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid status. Use: pending, approved, "
                "rejected, or suspended"
            )
        )

    approved_at = (
        datetime.now(timezone.utc)
        if data.status == "approved"
        else None
    )

    with get_db_connection() as connection:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                UPDATE companies
                SET
                    status = %s,
                    approved_at = %s,
                    approved_by = %s,
                    rejection_reason = %s
                WHERE id = %s
                RETURNING
                    id,
                    clerk_user_id,
                    company_name,
                    full_name,
                    email,
                    org_type,
                    reason_for_access,
                    status,
                    rejection_reason,
                    created_at,
                    approved_at,
                    approved_by
            """, (
                data.status,
                approved_at,
                data.approved_by,
                data.rejection_reason,
                company_id
            ))

            company = cursor.fetchone()

            if company is None:
                raise HTTPException(
                    status_code=404,
                    detail="Registration not found"
                )

        connection.commit()

    return {
        "status": "updated",
        "message": f"Status changed to {data.status}",
        "company": dict(company)
    }


# ==================================================
# ADMIN AUDIT LOG
# ==================================================

@app.get("/api/admin/audit-log")
def get_audit_log(
    x_admin_key: str | None = Header(default=None)
):
    verify_admin(x_admin_key)

    with get_db_connection() as connection:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                SELECT
                    id,
                    admin_clerk_id,
                    action,
                    target_company_id,
                    target_message_id,
                    notes,
                    created_at
                FROM admin_audit_log
                ORDER BY created_at DESC
                LIMIT 100
            """)

            entries = cursor.fetchall()

    return {
        "status": "success",
        "count": len(entries),
        "entries": [dict(e) for e in entries]
    }


@app.post("/api/admin/audit-log")
def create_audit_log_entry(
    data: AuditLogEntry,
    x_admin_key: str | None = Header(default=None)
):
    verify_admin(x_admin_key)

    with get_db_connection() as connection:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                INSERT INTO admin_audit_log (
                    admin_clerk_id,
                    action,
                    target_company_id,
                    target_message_id,
                    notes
                )
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, created_at
            """, (
                data.admin_clerk_id,
                data.action,
                data.target_company_id,
                data.target_message_id,
                data.notes,
            ))

            entry = cursor.fetchone()

        connection.commit()

    return {
        "status": "logged",
        "entry": dict(entry)
    }


# ==================================================
# CONTACT MESSAGES
# ==================================================

@app.post("/api/contact")
def submit_contact_message(data: ContactMessage):
    name = data.name.strip()
    email = data.email.strip().lower()
    subject = data.subject.strip()
    message = data.message.strip()

    if not name or len(name) > 255:
        raise HTTPException(
            status_code=400,
            detail="Name is required (max 255 characters)"
        )

    if not email or "@" not in email or len(email) > 255:
        raise HTTPException(
            status_code=400,
            detail="A valid email address is required"
        )

    if not subject or len(subject) > 500:
        raise HTTPException(
            status_code=400,
            detail="Subject is required (max 500 characters)"
        )

    if not message or len(message) < 10:
        raise HTTPException(
            status_code=400,
            detail="Message must be at least 10 characters"
        )

    if len(message) > 5000:
        raise HTTPException(
            status_code=400,
            detail="Message must not exceed 5000 characters"
        )

    with get_db_connection() as connection:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                INSERT INTO contact_messages (
                    user_id,
                    name,
                    email,
                    subject,
                    message,
                    status
                )
                VALUES (%s, %s, %s, %s, %s, 'unread')
                RETURNING id, created_at
            """, (
                data.user_id,
                name,
                email,
                subject,
                message,
            ))

            result = cursor.fetchone()

        connection.commit()

    return {
        "status": "submitted",
        "message": "Your message has been received. We will respond as soon as possible.",
        "id": result["id"]
    }


@app.get("/api/admin/contact-messages")
def get_contact_messages(
    x_admin_key: str | None = Header(default=None)
):
    verify_admin(x_admin_key)

    with get_db_connection() as connection:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                SELECT
                    id,
                    user_id,
                    name,
                    email,
                    subject,
                    message,
                    status,
                    created_at,
                    updated_at
                FROM contact_messages
                ORDER BY created_at DESC
            """)

            messages = cursor.fetchall()

    return {
        "status": "success",
        "count": len(messages),
        "messages": [dict(m) for m in messages]
    }


@app.patch("/api/admin/contact-messages/{message_id}")
def update_contact_message_status(
    message_id: int,
    data: ContactMessageStatusUpdate,
    x_admin_key: str | None = Header(default=None)
):
    verify_admin(x_admin_key)

    allowed_statuses = {"unread", "in_progress", "resolved"}

    if data.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid status. Use: unread, in_progress, or resolved"
        )

    with get_db_connection() as connection:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                UPDATE contact_messages
                SET
                    status = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING id, status, updated_at
            """, (data.status, message_id))

            result = cursor.fetchone()

            if result is None:
                raise HTTPException(
                    status_code=404,
                    detail="Message not found"
                )

        connection.commit()

    return {
        "status": "updated",
        "message": dict(result)
    }


# ==================================================
# PREDICTION
# ==================================================
# DO NOT MODIFY — ML logic is fixed

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
def get_history(limit: int = 50, offset: int = 0):

    # Clamp to reasonable bounds
    limit = max(1, min(limit, 200))
    offset = max(0, offset)

    with get_db_connection() as connection:
        with connection.cursor(
            cursor_factory=RealDictCursor
        ) as cursor:
            cursor.execute("""
                SELECT COUNT(*) AS total
                FROM sensor_readings
            """)
            total = cursor.fetchone()["total"]

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
                LIMIT %s OFFSET %s
            """, (limit, offset))

            readings = cursor.fetchall()

    readings.reverse()

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "readings": [
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
    }


# ==================================================
# SENSOR DATA INPUT
# ==================================================

@app.post("/api/sensor-data")
def receive_sensor_data(data: SensorData):
    return predict(data)
