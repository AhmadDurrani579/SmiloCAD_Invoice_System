FROM python:3.10-slim

USER root
# Install system dependencies for Postgres and building extensions
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

# Setup user
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# We set the app root
WORKDIR $HOME/app

# 1. Copy requirements from the backend folder
COPY --chown=user:user requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# 2. Copy everything from the backend folder into the 'backend' subfolder
COPY --chown=user:user . ./backend

# 3. IMPORTANT: Hugging Face builds from the root of your repo.
# If 'frontend' is next to 'backend', we ensure both are accessible.
# If you are pushing from the root, use:
COPY --chown=user:user ../frontend ./frontend

# 4. Set the working directory to where main.py lives
WORKDIR $HOME/app/backend

# 5. Run the app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]