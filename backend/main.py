import os
from fastapi import FastAPI
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# This will pick up the secret you saved in Hugging Face
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Create the SQLAlchemy engine using the modern psycopg driver
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

app = FastAPI()

@app.get("/health")
def health_check():
    # This checks if the URL was loaded correctly from the secrets
    if DATABASE_URL:
        return {"status": "Database URL is loaded"}
    return {"status": "Error: DATABASE_URL not found"}