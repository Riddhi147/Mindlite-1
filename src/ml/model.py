import pandas as pd
import os
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split

# Correct path handling
BASE_DIR = os.path.dirname(__file__)
DATA_PATH = os.path.join(BASE_DIR, "data.csv")
MODEL_PATH = os.path.join(BASE_DIR, "saved_model.pkl")

# Load dataset
df = pd.read_csv(DATA_PATH)

# Features and target
X = df.drop("cognitive_score", axis=1)
y = df["cognitive_score"]

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train model
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Save model
joblib.dump(model, MODEL_PATH)

print("Model trained and saved successfully!")