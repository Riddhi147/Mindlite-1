from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from src.database.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True)
    password = Column(String(200))
    role = Column(String(50))

    scores = relationship("Score", back_populates="user")


class Score(Base):
    __tablename__ = "scores"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    game = Column(String(50))
    score = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="scores")


class FamilyMember(Base):
    __tablename__ = "family_members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String(100))
    relation = Column(String(100))
    image_path = Column(String(255))


class DoctorPatient(Base):
    __tablename__ = "doctor_patients"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id"))
    patient_id = Column(Integer, ForeignKey("users.id"))

    __table_args__ = (UniqueConstraint("doctor_id", "patient_id", name="uq_doctor_patient"),)