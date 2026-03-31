from pydantic import BaseModel


class RegisterRequest(BaseModel):
    email: str
    password: str
    role: str


class LoginRequest(BaseModel):
    email: str
    password: str


class ScoreRequest(BaseModel):
    user_id: int
    game: str
    score: float


class AddPatientRequest(BaseModel):
    doctor_id: int
    email: str
    password: str


class PredictGameRequest(BaseModel):
    memory_match: float
    word_recall: float
    pattern_recognition: float
    face_recognition: float
    reaction_time: float


class SendEmailRequest(BaseModel):
    patient_email: str
    caregiver_emails: list[str]
    message: str
    doctor_email: str


class CaregiverCreate(BaseModel):
    name: str
    email: str


class CaregiverResponse(BaseModel):
    id: int
    name: str
    email: str


class MLInputs(BaseModel):
    memory_match: float
    word_recall: float
    pattern_recognition: float
    face_recognition: float
    reaction_time: float


class MLPredictionSchema(BaseModel):
    cognitive_score: float
    risk: str
    timestamp: str
    inputs: MLInputs


class DeclineAlertSchema(BaseModel):
    id: str
    type: str
    message: str
    drop_amount: float
    current_score: float
    timestamp: str
    dismissed: bool


class GameScoreSchema(BaseModel):
    id: int
    game: str
    score: float
    created_at: str


class SyncPatientDataRequest(BaseModel):
    email: str
    scores: list[GameScoreSchema]
    predictions: list[MLPredictionSchema]
    alerts: list[DeclineAlertSchema]