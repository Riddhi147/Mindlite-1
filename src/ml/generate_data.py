import pandas as pd
import numpy as np
import os

BASE_DIR = os.path.dirname(__file__)
DATA_PATH = os.path.join(BASE_DIR, "data.csv")

def generate_data(n=1000):
    np.random.seed(42)

    data = pd.DataFrame({
        "age": np.random.randint(50, 90, n),
        "memory_score": np.random.randint(0, 100, n),
        "attention_score": np.random.randint(0, 100, n),
        "language_score": np.random.randint(0, 100, n),
        "sleep_hours": np.random.uniform(4, 9, n),
        "activity_level": np.random.randint(0, 10, n),
    })

    data["cognitive_score"] = (
        0.3 * data["memory_score"] +
        0.2 * data["attention_score"] +
        0.2 * data["language_score"] +
        0.1 * data["sleep_hours"] * 10 +
        0.2 * data["activity_level"] * 10
    )

    return data


if __name__ == "__main__":
    df = generate_data()
    df.to_csv(DATA_PATH, index=False)
    print("Training data generated!")