# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json* ./

RUN npm ci --include=dev

COPY frontend/ ./

RUN npm run build

# Stage 2: Production backend
FROM python:3.12-slim AS backend

WORKDIR /app

RUN groupadd -r appuser && useradd -r -g appuser appuser

COPY backend/requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./

COPY --from=frontend-builder /app/frontend/dist /app/static

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

EXPOSE 8000

USER appuser

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
