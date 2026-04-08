FROM python:3.10-slim

USER root
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# 1. Copy requirements and install
COPY --chown=user:user requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# 2. Copy everything (including the moved frontend folder)
COPY --chown=user:user . .

# 3. Run the app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]