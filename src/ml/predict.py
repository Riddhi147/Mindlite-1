import joblib
import numpy as np

model = joblib.load("src/ml/saved_model.pkl")

def predict_score(data):
    features = np.array([[
        data["age"],
        data["memory_score"],
        data["attention_score"],
        data["language_score"],
        data["sleep_hours"],
        data["activity_level"]
    ]])

    score = model.predict(features)[0]

    if score > 75:
        risk = "Low Risk"
    elif score > 50:
        risk = "Moderate Risk"
    else:
        risk = "High Risk"

    return {"score": round(score, 2), "risk": risk}