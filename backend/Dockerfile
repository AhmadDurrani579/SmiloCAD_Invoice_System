FROM python:3.10-slim

# System dependencies for database/psycopg
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# Copy requirements and install
COPY --chown=user:user requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy all files from backend/ into the container
COPY --chown=user:user . .

# IMPORTANT: Changed from app.main:app to main:app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]