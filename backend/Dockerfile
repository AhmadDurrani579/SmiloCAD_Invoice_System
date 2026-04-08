# Use a lightweight Python image
FROM python:3.10-slim

# 1. Setup User (UID 1000 is mandatory for Hugging Face)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# 2. Set working directory
WORKDIR $HOME/app

# 3. Install Requirements
# Copy requirements first to leverage Docker caching
COPY --chown=user:user requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# 4. Copy the Application Code
# Note: We copy the 'app' folder into the container
COPY --chown=user:user ./app ./app

# 5. Startup Command
# We use 'app.main:app' because the code is inside the 'app' folder
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]