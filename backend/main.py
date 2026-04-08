from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.database import engine, Base
from api.invoices import router as invoice_router

# Create tables in Neon
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmiloCAD Invoice API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the routes from the api folder
app.include_router(invoice_router)

@app.get("/")
def home():
    return {"message": "Welcome to SmiloCAD API"}