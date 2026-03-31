import joblib
import pickle
import numpy as np
import os

BASE_DIR = os.path.dirname(__file__)
PROJECT_ROOT = os.path.dirname(os.path.dirname(BASE_DIR))

# ── Model A: 6-feature model (src/ml/saved_model.pkl) ────────────────────────
model_a_path = os.path.join(BASE_DIR, "saved_model.pkl")
model_a = joblib.load(model_a_path)

def predict_score(data):
    """Original 6-feature prediction (age, memory_score, attention_score, language_score, sleep_hours, activity_level)."""
    features = np.array([[
        data["age"],
        data["memory_score"],
        data["attention_score"],
        data["language_score"],
        data["sleep_hours"],
        data["activity_level"]
    ]])

    score = model_a.predict(features)[0]

    if score > 75:
        risk = "Low Risk"
    elif score > 50:
        risk = "Moderate Risk"
    else:
        risk = "High Risk"

    return {"score": round(score, 2), "risk": risk}


# ── Model B: 5-feature model (ml/model.pkl) ──────────────────────────────────
model_b_path = os.path.join(PROJECT_ROOT, "ml", "model.pkl")
with open(model_b_path, "rb") as f:
    model_b = pickle.load(f)

def predict_from_games(data):
    """5-feature prediction using game scores: memory_match, word_recall, pattern_recognition, face_recognition, reaction_time."""
    features = np.array([[
        data["memory_match"],
        data["word_recall"],
        data["pattern_recognition"],
        data["face_recognition"],
        data["reaction_time"]
    ]])

    score = float(model_b.predict(features)[0])

    if score > 75:
        risk = "Low Risk"
    elif score > 50:
        risk = "Moderate Risk"
    else:
        risk = "High Risk"

    return {"cognitive_score": round(score, 2), "risk": risk}