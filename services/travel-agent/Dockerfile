FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install dependencies first (for better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt --retries 5 --timeout 60

# Copy application code
COPY . .

# Set environment variable defaults
ENV PORT=8080
ENV PYTHONUNBUFFERED=1

# Expose port (for documentation purposes)
EXPOSE 8080

# Run the application using module syntax
CMD ["python", "-m", "src.main"]
