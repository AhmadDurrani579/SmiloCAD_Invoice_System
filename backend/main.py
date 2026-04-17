import os
import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

sys.path.append(str(Path(__file__).parent))

try:
    from core.database import engine, Base
    from api.invoices import router as invoice_router
except ImportError:
    from backend.core.database import engine, Base
    from backend.api.invoices import router as invoice_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmiloCAD API", redirect_slashes=False)

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
    return {"status": "SmiloCAD API running"}

app.include_router(invoice_router, prefix="/api")