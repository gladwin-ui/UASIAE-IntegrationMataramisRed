FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copy shared directory
COPY shared /app/../shared

# Copy wallet-service for transaction service dependency
COPY wallet-service /app/../wallet-service

# Copy user-service for transaction service dependency
COPY user-service /app/../user-service

# Copy notification-service for transaction service dependency
COPY notification-service /app/../notification-service

# Copy requirements
COPY transaction-service/requirements.txt requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY transaction-service/ .

# Expose port
EXPOSE 5003

# Run the application
CMD ["python", "app.py"]

