# DIP Hub Application Dockerfile
# Multi-stage build for optimized image

# Build stage
FROM python:3.10-slim AS builder

WORKDIR /app

# Install dependencies (git needed for pip install from GitHub)
COPY requirements.txt .
RUN apt-get update && apt-get install -y --no-install-recommends git && \
    pip install --no-cache-dir --user -r requirements.txt && \
    apt-get purge -y --auto-remove git && rm -rf /var/lib/apt/lists/*

# Runtime stage
FROM python:3.10-slim

WORKDIR /app

# Copy dependencies from builder
COPY --from=builder /root/.local /root/.local

# Make sure scripts in .local are usable
ENV PATH=/root/.local/bin:$PATH

# Copy application code
COPY src/ ./src/

# Set environment variables
ENV DIP_HUB_HOST=0.0.0.0
ENV DIP_HUB_PORT=8000
ENV PYTHONPATH=/app

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD /usr/local/bin/python3 -c "import httpx; httpx.get('http://localhost:8000/api/dip-hub/v1/healthz').raise_for_status()"

# Run the application
CMD ["/usr/local/bin/python3", "-m", "src.main"]

