from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime
from datetime import datetime
from app.database import Base



class Settings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    
    # User Profile
    name = Column(String, default="Ravi M", nullable=False)
    email = Column(String, default="ravi.m@facility.org", nullable=False)
    role = Column(String, default="Administrator", nullable=False)
    profile_pic = Column(Text, nullable=True) # Base64 encoded or URL

    # AI Settings
    groq_api_key = Column(String, default="", nullable=True)
    model_selection = Column(String, default="llama-3.3-70b-versatile", nullable=False)
    temperature = Column(Float, default=0.1, nullable=False)
    max_tokens = Column(Integer, default=1024, nullable=False)

    # Theme
    theme_mode = Column(String, default="dark", nullable=False) # 'light' or 'dark'

    # Notifications
    email_notifications = Column(Boolean, default=True, nullable=False)
    desktop_notifications = Column(Boolean, default=True, nullable=False)
    critical_alerts = Column(Boolean, default=True, nullable=False)

    # Security
    two_factor_enabled = Column(Boolean, default=False, nullable=False)

    # Language
    language = Column(String, default="en", nullable=False)


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String, primary_key=True, index=True) # e.g. "CMP-0021"
    product = Column(String, nullable=False)
    batch = Column(String, nullable=True)
    customer = Column(String, nullable=False)
    risk = Column(String, nullable=False, default="Low") # Low, Medium, High, Critical
    status = Column(String, nullable=False, default="Open") # Open, In Review, Closed
    date = Column(String, nullable=False) # e.g. "2026-07-28" (creation date)
    mfg_date = Column(String, nullable=True)
    exp_date = Column(String, nullable=True)
    category = Column(String, nullable=False) # e.g. Quality Defect, Adverse Reaction
    description = Column(Text, nullable=False)
    reporter = Column(String, nullable=False)
    contact = Column(String, nullable=False)
    qty = Column(Integer, nullable=False, default=1)
    resolution_date = Column(String, nullable=True) # date marked Closed
    root_cause = Column(Text, nullable=True)
    capa_recommendation = Column(Text, nullable=True)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, nullable=False) # new_complaint, assigned, updated, closed, high_risk, critical
    priority = Column(String, nullable=False, default="Low") # Low, Medium, High, Critical
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    complaint_id = Column(String, nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    action = Column(String, nullable=False) # e.g. "Complaint Created", "Complaint Updated", "Notification Read"
    details = Column(Text, nullable=True)
    user_email = Column(String, nullable=False, default="ravi.m@facility.org")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    complaint_id = Column(String, nullable=True)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False) # plain text password for demo
    role = Column(String, nullable=False, default="User") # "Administrator" or "User"
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)



