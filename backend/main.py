import os
import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Add the current directory to sys.path
sys.path.append(str(Path(__file__).parent))

# --- SMART IMPORT LOGIC ---
try:
    from core.database import engine, Base
    from api.invoices import router as invoice_router
except ImportError:
    from backend.core.database import engine, Base
    from backend.api.invoices import router as invoice_router

# Initialize Database
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmiloCAD API")

# Add CORS so your frontend can talk to your backend without security blocks
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# NOTE: We removed @app.get("/") and app.mount
# Why? Because vercel.json rewrites handle the frontend files better than Python can.

# Include Router with /api prefix
app.include_router(invoice_router, prefix="/api")