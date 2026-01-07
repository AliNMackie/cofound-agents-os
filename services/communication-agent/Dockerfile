FROM python:3.11-slim

# Set the working directory for the application inside the container
WORKDIR /app

# Install dependencies with optimization flags for faster, cleaner builds
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt --retries 5 --timeout 60

# Copy the rest of the application code
COPY . .

# Cloud Run automatically injects the $PORT env variable, but we expose 8080 as a standard practice
EXPOSE 8080

# Run the FastAPI application using uvicorn. 
# It uses the $PORT environment variable provided by Cloud Run, or defaults to 8080.
CMD sh -c "exec uvicorn src.api.main:app --host 0.0.0.0 --port ${PORT:-8080}"