FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose port 8000 (Internal Docker Network)
EXPOSE 8000

# Jalankan app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]