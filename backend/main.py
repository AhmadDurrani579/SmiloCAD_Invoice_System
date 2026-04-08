import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from core.database import engine, Base
from api.invoices import router as invoice_router

# Create tables in Neon
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmiloCAD Invoice API")
app.mount("/css", StaticFiles(directory="../frontend/css"), name="css")
app.mount("/js", StaticFiles(directory="../frontend/js"), name="js")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Route to serve the index.html
@app.get("/")
async def serve_index():
    return FileResponse("../frontend/index.html")
# 2. Mount the CSS and JS folders so the HTML can find them
# This matches your folder names: frontend/css and frontend/js

# Include the routes from the api folder
app.include_router(invoice_router)

@app.get("/")
def home():
    return {"message": "Welcome to SmiloCAD API"}