# Makhanlal Chaturvedi National University (MCU) — Alumni Portal Backend
## Enterprise Single-Port Microservices Architecture in Go (Port `8000`)

A production-grade Go (`Golang`) backend where **5 independent domain microservices** (`auth-service`, `alumni-service`, `events-service`, `jobs-service`, and `engagement-service`) are isolated in dedicated packages (`internal/microservices/*`) and orchestrated through a single **Enterprise API Gateway & Service Registry (`internal/registry`)** running on **Port `8000`**.

---

## Key Engineering Highlights

- **Single-Port Microservices Engine (`:8000`)**: All 5 microservices run under one process and one port (`http://localhost:8000`), eliminating multi-terminal management and inter-process network overhead while maintaining strict domain boundaries.
- **Formal `Microservice` Contract (`internal/registry`)**: Every service implements a strict Go interface (`ID()`, `Name()`, `Version()`, `BasePath()`, `Endpoints()`, `HealthCheck()`, `MountRoutes()`) and registers with the central `ServiceRegistry`.
- **Per-Service Telemetry & Tracing Headers**: Every HTTP response automatically includes `X-API-Gateway`, `X-Microservice`, `X-Service-Version`, and `X-Response-Time` headers, with atomic request/error/latency tracking per microservice.
- **Individual Service Health & Manifests**: Every microservice exposes its own `/health` endpoint (`/api/auth/health`, `/api/alumni/health`, `/api/events/health`, `/api/jobs/health`, `/api/engagement/health`) alongside the aggregated `/api/health` and `/api/services` endpoints.

---

## Quick Start (Port `8000`)

### Option 1: One-Click Batch Script (From Project Root)
```bat
start-backend.bat
```

### Option 2: Build & Run via Go CLI
```powershell
cd d:\AlumniProject\backend
go build -o bin\microservices.exe .\cmd\microservices
.\bin\microservices.exe
```

### Live Gateway URLs
- **Gateway Dashboard**: `http://localhost:8000/`
- **Service Registry Catalog**: `http://localhost:8000/api/services`
- **Aggregated Health & Telemetry**: `http://localhost:8000/api/health`
- **Auth Microservice**: `http://localhost:8000/api/auth` & `http://localhost:8000/api/auth/profile`
- **Alumni Microservice**: `http://localhost:8000/api/alumni` & `http://localhost:8000/api/meta`
- **Events Microservice**: `http://localhost:8000/api/events`
- **Jobs Microservice**: `http://localhost:8000/api/jobs`
- **Engagement Microservice**: `http://localhost:8000/api/engagement`

See [`MICROSERVICES.md`](./MICROSERVICES.md) for the complete architecture diagram and full endpoint catalog.
