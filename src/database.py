from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import mysql.connector

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "Trishabh@1",
    "database": "mindlite"
}

def get_conn():
    return mysql.connector.connect(**DB_CONFIG)

DATABASE_URL = "mysql+pymysql://root:Trishabh%401@localhost/mindlite"

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()
