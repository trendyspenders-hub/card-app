FROM python:3.11-slim

WORKDIR /app

# System deps for OpenCV + YOLOv8 + Detectron2
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download YOLOv8 base models so first request isn't slow (~12 MB each).
# The || true ensures the build succeeds even if the network is unavailable.
RUN python -c "from ultralytics import YOLO; YOLO('yolov8n.pt'); YOLO('yolov8n-seg.pt')" || true

COPY . .

# Create weights directory for optional Detectron2 / custom YOLOv8 weights.
# Actual weight files are excluded via .dockerignore / .gitignore.
RUN mkdir -p weights

EXPOSE 8000

# Health check — waits 60s for model downloads on first startup
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
