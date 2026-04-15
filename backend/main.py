import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# FIXED IMPORTS: Added 'backend.' prefix so Vercel can find the modules
from backend.core.database import engine, Base
from backend.api.invoices import router as invoice_router

# Create tables in Neon
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmiloCAD Invoice API")

# Path logic for Vercel
BASE_DIR = Path(__file__).resolve().parent

# Mount Static Files (Ensure these folders exist inside backend/frontend/)
app.mount("/js", StaticFiles(directory=BASE_DIR / "frontend" / "js"), name="js")
app.mount("/css", StaticFiles(directory=BASE_DIR / "frontend" / "css"), name="css")
app.mount("/img", StaticFiles(directory=BASE_DIR / "frontend" / "img"), name="img")

# Serve the index.html
@app.get("/")
async def serve_index():
    return FileResponse(BASE_DIR / "frontend" / "index.html")

# Include the routes - the prefix '/api' is handled by vercel.json
app.include_router(invoice_router)