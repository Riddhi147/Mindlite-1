from fastapi import APIRouter
from src.database.db import get_user_data
from src.ml.predict import predict_score

router = APIRouter()

@router.get("/predict/{user_id}")
def predict(user_id: int):
    user_data = get_user_data(user_id)

    if not user_data:
        return {"error": "User not found"}

    return predict_score(user_data)