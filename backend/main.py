import os
import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text

sys.path.append(str(Path(__file__).parent))

try:
    from core.database import engine, Base
    from api.invoices import router as invoice_router
except ImportError:
    from backend.core.database import engine, Base
    from backend.api.invoices import router as invoice_router

Base.metadata.create_all(bind=engine)

def _ensure_schema():
    inspector = inspect(engine)

    migrations = {
        "invoices": {
            "patient_name": "VARCHAR",
            "shade": "VARCHAR",
        },
        "invoice_items": {
            "patient_name": "VARCHAR",
            "shade": "VARCHAR",
        },
    }

    with engine.begin() as conn:
        for table_name, columns in migrations.items():
            if not inspector.has_table(table_name):
                continue

            existing_columns = {col["name"] for col in inspector.get_columns(table_name)}
            for column_name, column_type in columns.items():
                if column_name in existing_columns:
                    continue
                conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"))

_ensure_schema()

app = FastAPI(title="SmiloCAD API", redirect_slashes=False)

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

app.mount("/css", StaticFiles(directory=FRONTEND_DIR / "css"), name="css")
app.mount("/js", StaticFiles(directory=FRONTEND_DIR / "js"), name="js")
app.mount("/img", StaticFiles(directory=FRONTEND_DIR / "img"), name="img")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://smilocard.vercel.app",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return FileResponse(FRONTEND_DIR / "index.html")

app.include_router(invoice_router, prefix="/api")
