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