FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt --retries 5 --timeout 60

# Copy application
COPY . .

# Expose port
EXPOSE 8080

# Run FastAPI with uvicorn
CMD sh -c "exec uvicorn src.api.main:app --host 0.0.0.0 --port ${PORT:-8080}"
