import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from core.database import engine, Base
from api.invoices import router as invoice_router

# Create tables in Neon
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmiloCAD Invoice API")

# Always resolve static paths relative to this file (works regardless of CWD)
BASE_DIR = Path(__file__).resolve().parent
app.mount("/js", StaticFiles(directory=BASE_DIR / "frontend" / "js"), name="js")
app.mount("/css", StaticFiles(directory=BASE_DIR / "frontend" / "css"), name="css")
app.mount("/img", StaticFiles(directory=BASE_DIR / "frontend" / "img"), name="img")

# 1. Route to serve the index.html
@app.get("/")
async def serve_index():
    return FileResponse(BASE_DIR / "frontend" / "index.html")

    # 2. Mount the CSS and JS folders so the HTML can find them
# This matches your folder names: frontend/css and frontend/js

# Include the routes from the api folder
app.include_router(invoice_router)
