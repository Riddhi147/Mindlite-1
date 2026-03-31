from fastapi import APIRouter
from src.database.db import get_user_data
from src.ml.predict import predict_score, predict_from_games
from src.schemas import PredictGameRequest

router = APIRouter()

@router.get("/predict/{user_id}")
def predict(user_id: int):
    user_data = get_user_data(user_id)

    if not user_data:
        return {"error": "User not found"}

    return predict_score(user_data)


@router.post("/predict/manual")
def predict_manual(payload: PredictGameRequest):
    """
    Predict cognitive score from game scores directly (no DB required).
    Uses Model B (ml/model.pkl) with 5 game-based features.
    """
    data = {
        "memory_match": payload.memory_match,
        "word_recall": payload.word_recall,
        "pattern_recognition": payload.pattern_recognition,
        "face_recognition": payload.face_recognition,
        "reaction_time": payload.reaction_time,
    }
    return predict_from_games(data)