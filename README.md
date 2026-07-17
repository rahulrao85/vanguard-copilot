
  <div align="center">
    <h1>Vanguard Co-Pilot</h1>
    <p>
      <strong>GenAI-powered stadium volunteer assistant for FIFA World Cup 2026</strong>
    </p>
    <p>
      <a href="https://vanguard-copilot.run.place">Live Demo</a> ·
      <a href="#features">Features</a> ·
      <a href="#architecture">Architecture</a> ·
      <a href="#setup">Setup</a> ·
      <a href="#api">API Docs</a>
    </p>
    <p>
      <img src="https://img.shields.io/badge/python-3.11-blue" alt="Python 3.11">
      <img src="https://img.shields.io/badge/fastapi-0.115-green" alt="FastAPI">
      <img src="https://img.shields.io/badge/license-MIT-brightgreen" alt="License">
    </p>
  </div>

---

## Overview

Vanguard Co-Pilot helps FIFA World Cup 2026 stadium volunteers manage their shifts, track contributions, and get AI-powered guidance — all in one place.

Built for **PromptWars: Virtual** by Google for Developers and Hack2skill.

## Traceability

| Phase | Endpoint | Description |
|-------|----------|-------------|
| **Understand** | `POST /api/calculate` | Computes crowd density and gate status from raw sensor data |
| **Track** | `POST /api/entries` | Logs volunteer shift activity and incident reports |
| **Track** | `GET /api/entries/{device_id}` | Retrieves activity history per anonymous device |
| **Reduce** | `POST /api/insights` | Generates AI-powered megaphone scripts for crowd routing, translations, and alerts |
| **Operate** | `GET /health` | Health check for load balancers and monitoring |

## Features

- **Volunteer Dashboard** — Quick-entry forms to log hours and tasks
- **Smart Calculator** — Estimate time contributions across roles (wayfinding, ticket scanning, language support, etc.)
- **AI Coach** — Powered by Google Gemini — volunteers get personalized advice based on their real shift data
- **Insights Dashboard** — Visual breakdown of volunteer activity, top tasks, and contribution patterns
- **Health Check** — Monitoring endpoint for deployment validation
- **Rate Limiting** — Built-in rate limiting to prevent abuse
- **Persistence** — SQLite database for zero-infrastructure storage

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python 3.11, FastAPI, Uvicorn |
| **AI/GenAI** | Google Gemini (google-genai SDK) |
| **Database** | SQLite (aiosqlite) |
| **Frontend** | TypeScript, Vite, HTML/CSS |
| **Deployment** | Docker, Docker Compose |
| **Reverse Proxy** | Caddy (auto-SSL via Let's Encrypt) |
| **Hosting** | Oracle Cloud Infrastructure (ARM64, Ampere) |
| **CI/CD** | GitHub Actions |

## Architecture

```
User → Caddy (HTTPS) → Docker (FastAPI + SQLite) → Gemini API
```

- **Caddy** terminates SSL and reverse-proxies to the FastAPI container
- **FastAPI** serves the frontend static files and REST API
- **SQLite** persists volunteer entries and shift data
- **Gemini API** powers the AI Coach feature on the insights page
- All in one container for simplicity

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- Google Gemini API key

### Local Development

```bash
# Clone the repo
git clone https://github.com/rahulrao85/vanguard-copilot.git
cd vanguard-copilot

# Set up Gemini API key
echo "GEMINI_API_KEY=your_key_here" > .env

# Backend
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

### Docker

```bash
docker compose up --build
```

The app will be available at `http://localhost:8000`.

## API

### Health Check
```
GET /health
```
Returns 200 OK when the service is running.

### Entries
```
POST /entries        — Create a new volunteer entry
GET  /entries/{id}   — Get entry by device ID
```

### Calculation
```
POST /calculate      — Calculate volunteer time estimates
```

### Insights
```
GET  /insights/{device_id}  — Get volunteer insights
POST /insights/{device_id}/ask  — Ask AI Coach a question
```

Full API documentation is available at `/docs` when running locally.

## Deployment

The project uses GitHub Actions for CI/CD. Every push to `master`:

1. Runs lint (ruff), type check (mypy), and tests (pytest)
2. SSHes into the OCI VPS
3. Pulls latest code
4. Rebuilds and restarts the Docker container

### Manual Deploy

```bash
ssh -i ~/.ssh/oci.pem ubuntu@<vps-ip>
cd vanguard-copilot
git pull origin master
docker compose up -d --build
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `SQLITE_DB_PATH` | No | SQLite database path (default: `/app/data/vanguard.db`) |

## License

MIT
