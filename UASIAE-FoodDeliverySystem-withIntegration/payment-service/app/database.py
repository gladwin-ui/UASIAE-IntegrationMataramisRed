import os
import time
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def get_engine():
    while True:
        try:
            # pool_pre_ping=True mencegah error 'Lost connection to MySQL'
            engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=3600)
            connection = engine.connect()
            connection.close()
            print("✅ Database connection successful!")
            return engine
        except Exception as e:
            print(f"⏳ Database not ready, retrying in 3 seconds... ({e})")
            time.sleep(3)

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()