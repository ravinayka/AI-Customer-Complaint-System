import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/complaints_db")

# Automatically try to connect to PostgreSQL. If it fails, fallback to SQLite.
try:
    if DATABASE_URL.startswith("postgresql"):
        # We can add a connect timeout so it doesn't hang indefinitely if the server is off
        engine = create_engine(DATABASE_URL, connect_args={"connect_timeout": 3})
        # Test connection
        conn = engine.connect()
        conn.close()
        print("INFO: Successfully connected to PostgreSQL database.")
    else:
        raise ValueError("Non-PostgreSQL URL detected, falling back to SQLite.")
except Exception as e:
    print(f"WARNING: PostgreSQL connection failed ({str(e)}). Falling back to SQLite database.")
    SQLITE_URL = "sqlite:///./settings.db"
    engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
