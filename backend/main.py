import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent))
# --- SMART IMPORT LOGIC ---
try:
    from core.database import engine, Base
    from api.invoices import router as invoice_router
except ImportError:
    # Fallback for different environments
    from backend.core.database import engine, Base
    from backend.api.invoices import router as invoice_router
    
# Initialize Database
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmiloCAD API")

# Setup Pathing
BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR / "frontend"

# Mount Statics (for Hugging Face directly serving)
app.mount("/js", StaticFiles(directory=FRONTEND_DIR / "js"), name="js")
app.mount("/css", StaticFiles(directory=FRONTEND_DIR / "css"), name="css")

@app.get("/")
async def serve_index():
    return FileResponse(FRONTEND_DIR / "index.html")

# Include Router with /api prefix so JS can find it on both platforms
app.include_router(invoice_router, prefix="/api")