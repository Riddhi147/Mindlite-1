from src import models
from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from fastapi import UploadFile, File, Form
import shutil
import os
from src.api.ml_routes import router
from src.database import SessionLocal, engine, Base
from src import crud
from src import schemas

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = FastAPI()
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
Base.metadata.create_all(bind=engine)
app.include_router(router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "MindLite backend running"}


@app.post("/register")
def register(user: schemas.RegisterRequest, db: Session = Depends(get_db)):
    return crud.create_user(db, user.email, user.password, user.role)


@app.post("/login")
def login(user: schemas.LoginRequest, db: Session = Depends(get_db)):
    db_user = crud.login_user(db, user.email, user.password)
    if not db_user:
        return {"error": "Invalid credentials"}
    return {"user_id": db_user.id, "email": db_user.email, "role": db_user.role}


@app.post("/score")
def add_score(score: schemas.ScoreRequest, db: Session = Depends(get_db)):
    return crud.save_score(db, score.user_id, score.game, score.score)


@app.get("/scores/{user_id}")
def get_scores(user_id: int, db: Session = Depends(get_db)):
    return crud.get_scores(db, user_id)


@app.get("/family-members/{user_id}")
def get_family_members(user_id: int, db: Session = Depends(get_db)):
    members = crud.get_family_members(db, user_id)
    return [
        {"name": m.name, "relation": m.relation, "image": f"http://127.0.0.1:8000/{m.image_path}"}
        for m in members
    ]


@app.post("/upload-family-member")
def upload_family_member(
    user_id: int = Form(...),
    name: str = Form(...),
    relation: str = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    import uuid
    filename = f"{uuid.uuid4()}_{image.filename}"
    file_path = f"{UPLOAD_FOLDER}/{filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    crud.create_family_member(db=db, user_id=user_id, name=name, relation=relation, image_path=file_path)
    return {"message": "Family member uploaded successfully"}


# ── Doctor–Patient endpoints ──────────────────────────────────────────────────

@app.post("/doctor/add-patient")
def add_patient(payload: schemas.AddPatientRequest, db: Session = Depends(get_db)):
    patient = crud.login_user(db, payload.email, payload.password)
    if not patient:
        raise HTTPException(status_code=404, detail="No patient found with those credentials")
    if patient.role != "patient":
        raise HTTPException(status_code=400, detail="That account is not a patient account")
    link = crud.link_doctor_patient(db, doctor_id=payload.doctor_id, patient_id=patient.id)
    if link is None:
        raise HTTPException(status_code=409, detail="Patient already linked to this doctor")
    return {"patient_id": patient.id, "email": patient.email}


@app.get("/doctor/{doctor_id}/patients")
def get_patients(doctor_id: int, db: Session = Depends(get_db)):
    return crud.get_doctor_patients(db, doctor_id)


@app.delete("/doctor/{doctor_id}/patients/{patient_id}")
def remove_patient(doctor_id: int, patient_id: int, db: Session = Depends(get_db)):
    crud.unlink_doctor_patient(db, doctor_id, patient_id)
    return {"message": "Patient removed"}


# ── Patient → Caregivers reverse lookup ───────────────────────────────────────

@app.get("/patient/{patient_email}/caregivers")
def get_patient_caregivers(patient_email: str, db: Session = Depends(get_db)):
    caregivers = crud.get_patient_caregivers(db, patient_email)
    return caregivers


@app.post("/patient/{patient_email}/caregivers")
def add_patient_caregiver(patient_email: str, payload: schemas.CaregiverCreate, db: Session = Depends(get_db)):
    # Verify patient exists
    patient = crud.get_user_by_email(db, patient_email)
    if not patient or patient.role != "patient":
        raise HTTPException(status_code=404, detail="Patient not found")
    
    cg = crud.create_patient_caregiver(db, patient_id=patient.id, name=payload.name, email=payload.email)
    return cg


# ── Email sending ─────────────────────────────────────────────────────────────

@app.get("/email-config")
def check_email_config():
    """Check whether SMTP email is configured."""
    smtp_user = os.environ.get("SMTP_USER", "")
    return {"configured": bool(smtp_user)}


@app.post("/send-email")
def send_email(payload: schemas.SendEmailRequest, db: Session = Depends(get_db)):
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    # Validate inputs
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    if not payload.caregiver_emails:
        raise HTTPException(status_code=400, detail="Select at least one caregiver")

    # Verify patient exists
    patient = crud.get_user_by_email(db, payload.patient_email)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # SMTP configuration from environment variables
    smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    
    # Build the email
    subject = f"MindLite: Note regarding patient {payload.patient_email}"
    body = f"""
    <html>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); padding: 30px; border-radius: 16px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🧠 MindLite</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0;">Cognitive Health Monitoring System</p>
        </div>

        <div style="background: #f8f7ff; border: 1px solid #e5e3f1; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <h2 style="color: #1a1a2e; margin: 0 0 8px 0; font-size: 18px;">Doctor's Note</h2>
            <p style="color: #6b7280; font-size: 13px; margin: 0 0 16px 0;">From: <strong>{payload.doctor_email}</strong></p>
            <p style="color: #1a1a2e; font-size: 15px; line-height: 1.6; background: white; padding: 16px; border-radius: 8px; border-left: 4px solid #7c3aed;">
                {payload.message}
            </p>
        </div>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <p style="margin: 0; color: #166534; font-size: 14px;">
                <strong>Patient Reference:</strong> {payload.patient_email}
            </p>
        </div>

        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            This email was sent via MindLite Cognitive Health Platform.
        </p>
    </body>
    </html>
    """

    errors = []
    sent = []
    smtp_host = "smtp.gmail.com"
    smtp_port = 587
    smtp_user = "mindlite.doc@gmail.com"
    smtp_pass = "aldl qxii nhgf dqel"  
    for recipient in payload.caregiver_emails:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = "mindlite.doc@gmail.com"
            msg["To"] = recipient
            msg.attach(MIMEText(body, "html"))

            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail("mindlite.doc@gmail.com", recipient, msg.as_string())
            sent.append(recipient)
        except Exception as e:
            errors.append({"email": recipient, "error": str(e)})

    if errors and not sent:
        raise HTTPException(status_code=500, detail=f"Failed to send all emails: {errors}")

    return {
        "status": "sent" if not errors else "partial",
        "message": f"Email sent to {len(sent)} caregiver(s)" + (f", {len(errors)} failed" if errors else ""),
        "sent": sent,
        "errors": errors,
    }


# ── Patient Data Sync & Profile ───────────────────────────────────────────────

@app.post("/sync-patient-data")
def sync_patient_data_endpoint(payload: schemas.SyncPatientDataRequest, db: Session = Depends(get_db)):
    success = crud.sync_patient_data(
        db, 
        email=payload.email,
        scores=payload.scores, 
        predictions=payload.predictions, 
        alerts=payload.alerts
    )
    if not success:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"status": "synced"}


@app.get("/patient/{email}/data")
def get_patient_data(email: str, db: Session = Depends(get_db)):
    print(f"DEBUG: Doctor requested patient data for email: {email}") 
    profile = crud.get_patient_profile(db, email)
    if not profile:
        raise HTTPException(status_code=404, detail="Patient not found")
    print(f"DEBUG: Executed query and successfully aggregated backend profile.")
    return profile