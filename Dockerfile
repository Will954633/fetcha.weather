# Use Python 3.10 slim image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy backend requirements
COPY backend/requirements.txt /app/backend/

# Install Python dependencies
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy entire project
COPY . /app/

# Expose port (Railway sets this via $PORT)
EXPOSE 5000

# Set working directory to backend
WORKDIR /app/backend

# Start with Gunicorn - use bash to properly expand PORT variable
CMD ["sh", "-c", "gunicorn app:app --bind 0.0.0.0:${PORT:-5000} --workers 2 --timeout 120"]
