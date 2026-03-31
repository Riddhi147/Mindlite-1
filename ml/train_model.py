import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
import pickle

# Load dataset (keep CSV in same folder)
data = pd.read_csv("new_data.csv")

# Features and target
X = data.drop("cognitive_score", axis=1)
y = data["cognitive_score"]

# Split
x_train, x_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train model
model = RandomForestRegressor(n_estimators=200, random_state=42)
model.fit(x_train, y_train)

# Evaluate (R² score)
score = model.score(x_test, y_test)
print("R2 Score =", score)

# Test prediction
new_feature = [[50, 86, 70, 80, 800]]
predicted_score = model.predict(new_feature)
print("Predicted score =", predicted_score)

print(data.shape)
print(data.head())
# Save model
with open("model.pkl", "wb") as f:
   pickle.dump(model, f)

print("✅ model.pkl created")