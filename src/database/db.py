# src/database/db.py

import mysql.connector

def get_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="admin",
        database="mindlite"
    )

def get_user_data(user_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
    SELECT game, score 
    FROM scores
    WHERE user_id = %s
    """
    
    cursor.execute(query, (user_id,))
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    if not rows:
        return None

    # Convert rows into dictionary
    data = {
        "age": 65,  # temporary fixed value (since not in table)
        "memory_score": 0,
        "attention_score": 0,
        "language_score": 0,
        "sleep_hours": 6,
        "activity_level": 5
    }

    for row in rows:
        if row["game"] == "memory":
            data["memory_score"] = row["score"]
        elif row["game"] == "attention":
            data["attention_score"] = row["score"]
        elif row["game"] == "language":
            data["language_score"] = row["score"]

    return data