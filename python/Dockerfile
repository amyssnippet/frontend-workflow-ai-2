# Use official Python 3.10 slim base image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy only requirements file first (optional, speed up caching)
# Since requirements.txt not provided, install packages explicitly

# Install system dependencies needed for pdfplumber, etc.
RUN apt-get update && apt-get install -y \
    build-essential \
    libpoppler-cpp-dev \
    pkg-config \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy the entire folder content
COPY . .

# Install python dependencies
RUN pip install --no-cache-dir fastapi uvicorn pdfplumber python-docx python-pptx requests

# Expose FastAPI default port
EXPOSE 8000

# Command to run the app with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
