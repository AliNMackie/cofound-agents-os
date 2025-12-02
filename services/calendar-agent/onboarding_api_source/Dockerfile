FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt --retries 5 --timeout 60
COPY main.py .
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 main:app
