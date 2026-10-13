# MCU Alumni Portal — Enterprise Single-Port Microservices Architecture

## 🏗️ Architecture Overview

The backend follows an **Enterprise Single-Port Microservices Architecture** in Go (`Golang`). All 5 domain microservices are isolated in their own dedicated packages (`internal/microservices/*`), implement a formal `registry.Microservice` contract (`internal/registry`), and are orchestrated behind a unified **API Gateway on Port `8000`**.

```text
React Frontend (localhost:5173) / Browser Client
                     │
                     ▼  Single Public Port (localhost:8000)
┌──────────────────────────────────────────────────────────────────────────────┐
│  🌐 ENTERPRISE API GATEWAY & SERVICE REGISTRY (internal/registry)            │
│  • Per-Service Telemetry   • JWT & OAuth Guard   • X-Microservice Headers    │
│  • Dashboard: http://localhost:8000      • Catalog: /api/services            │
└──────┬────────────────┬─────────────────┬────────────────┬───────────────────┘
       │                │                 │                │                 │
       ▼                ▼                 ▼                ▼                 ▼
┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐
│ auth-service│  │alumni-service│  │events-svc   │  │ jobs-service│  │engagement-svc│
│ /api/auth/* │  │/api/alumni/* │  │/api/events/*│  │ /api/jobs/* │  │/api/mentor.. │
└──────┬──────┘  └──────┬───────┘  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘
       └────────────────┴─────────────────┴────────────────┴────────────────┘
                                          │
                           MySQL Connection Pool (mcu_alumni_db)
```

---

## 📦 Registered Domain Microservices (All on Port `8000`)

| # | Microservice ID | Package Path | Base Route | Health Check | Responsibility |
|---|-----------------|--------------|------------|--------------|----------------|
| 1 | `auth-service` | `internal/microservices/auth` | `/api/auth` | `/api/auth/health` | Registration, Alumni vs Student batch verification, JWT, Google OAuth 2.0, Profile |
| 2 | `alumni-service` | `internal/microservices/alumni` | `/api/alumni`, `/api/meta` | `/api/alumni/health` | Verified alumni directory, campuses, departments, and portal statistics |
| 3 | `events-service` | `internal/microservices/events` | `/api/events` | `/api/events/health` | Conferences, reunions, Abhyuday 2026 schedule, and digital pass RSVPs |
| 4 | `jobs-service` | `internal/microservices/jobs` | `/api/jobs` | `/api/jobs/health` | Career job postings, alumni referrals, resume applications, and hiring status |
| 5 | `engagement-service` | `internal/microservices/engagement` | `/api/engagement`, `/api/mentorship`, `/api/memories`, `/api/giving` | `/api/engagement/health` | 1-on-1 mentorship scheduling, historical campus memories, and university giving |

---

## 🔗 Complete API Catalog (Port `8000`)

### 🌐 API Gateway & Service Discovery
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Interactive HTML Microservices Gateway Dashboard |
| `GET` | `/api` | Full Service Discovery Catalog & API inventory |
| `GET` | `/api/health` | Gateway, MySQL connection pool, and per-microservice health & telemetry |
| `GET` | `/api/services` | Registered microservices manifest & live request metrics |

### 🔐 1. `auth-service` (`internal/microservices/auth`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/auth` | Public | Auth Microservice manifest, metrics, and endpoint catalog |
| `GET` | `/api/auth/health` | Public | Auth Microservice health & registered account counts |
| `POST` | `/api/auth/register` | Public | Register new Alumnus or Current Student account |
| `POST` | `/api/auth/login` | Public | Authenticate with email & password and issue JWT |
| `GET` | `/api/auth/me` | Bearer JWT | Get currently authenticated user profile |
| `GET` | `/api/auth/profile` | Optional JWT | List registered profiles or filter by `?email=` / `?id=` |
| `PUT` | `/api/auth/profile` | Bearer JWT | Update authenticated user profile, skills, and photo |
| `POST` | `/api/auth/google` | Public | Google OAuth 2.0 sign-in / registration |
| `GET` | `/api/auth/google/callback` | Public | Google OAuth 2.0 redirect callback |
| `POST` | `/api/auth/forgot-password` | Public | Send 6-digit password reset OTP |
| `POST` | `/api/auth/reset-password` | Public | Verify OTP and reset password |

### 🎓 2. `alumni-service` (`internal/microservices/alumni`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/alumni` | Public | List & filter verified alumni directory |
| `GET` | `/api/alumni/health` | Public | Alumni Microservice health & directory counts |
| `GET` | `/api/alumni/{id}` | Public | Single alumnus profile by ID |
| `GET` | `/api/meta` | Public | Unified university metadata (campuses, departments, stats) |
| `GET` | `/api/meta/campuses` | Public | List active MCU campuses |
| `GET` | `/api/meta/departments` | Public | List MCU academic departments |
| `GET` | `/api/meta/stats` | Public | Real-time portal statistics |

### 📅 3. `events-service` (`internal/microservices/events`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/events` | Public | List all university events & Abhyuday 2026 schedule |
| `GET` | `/api/events/health` | Public | Events Microservice health & RSVP metrics |
| `GET` | `/api/events/{id}` | Public | Event details by ID |
| `GET` | `/api/events/{id}/rsvp` | Public | View event RSVP registrations & remaining seats |
| `POST` | `/api/events/{id}/rsvp` | Bearer JWT | Submit event RSVP & generate ticket pass code |

### 💼 4. `jobs-service` (`internal/microservices/jobs`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/jobs` | Public | List active job postings |
| `GET` | `/api/jobs/health` | Public | Jobs Microservice health & application metrics |
| `POST` | `/api/jobs` | Optional JWT | Create a new job posting |
| `DELETE` | `/api/jobs/{id}` | Optional JWT | Delete job posting |
| `POST` | `/api/jobs/{id}/referral` | Optional JWT | Request alumni job referral |
| `GET` | `/api/jobs/applications` | Optional JWT | List referral applications |
| `POST` | `/api/jobs/applications` | Optional JWT | Submit candidate referral application |
| `PUT` | `/api/jobs/applications/{id}/status` | Optional JWT | Update referral application status |
| `DELETE` | `/api/jobs/applications/{id}` | Optional JWT | Delete/withdraw referral application |

### 🤝 5. `engagement-service` (`internal/microservices/engagement`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/engagement` | Public | Engagement Microservice manifest & unified summary |
| `GET` | `/api/engagement/health` | Public | Engagement Microservice health & metrics |
| `GET` | `/api/mentorship` | Public | List mentorship requests & available mentor count |
| `GET` | `/api/mentorship/requests` | Public | List all mentorship requests |
| `POST` | `/api/mentorship/requests` | Bearer JWT | Submit 1-on-1 mentorship session request |
| `GET` | `/api/mentorship/my-requests` | Bearer JWT | View logged-in user's mentorship requests |
| `GET` | `/api/memories` | Public | List historical campus photo & video memories |
| `GET` | `/api/giving` | Public | List active university giving initiatives |
| `GET` | `/api/giving/initiatives` | Public | List active university giving initiatives |
| `GET` | `/api/giving/donate` | Public | View recorded donations & total raised |
| `POST` | `/api/giving/donate` | Optional JWT | Process a new alumni donation |

---

## 📁 Clean Enterprise Directory Layout

```text
backend/
├── cmd/
│   └── microservices/           # Unified Single-Port API Gateway & Microservices Engine (:8000)
│       └── main.go
├── internal/
│   ├── config/                  # Centralized environment & DSN configuration
│   ├── database/                # MySQL connection pool & schema bootstrapper
│   ├── middleware/              # JWT authentication, Optional Auth, and CORS middleware
│   ├── models/                  # Domain structs & request/response DTOs
│   ├── registry/                # Microservice contract, Service Registry, and atomic telemetry
│   ├── microservices/           # 5 Isolated Domain Microservices (each owns all its APIs)
│   │   ├── auth/                # 1. Auth & Identity Microservice
│   │   ├── alumni/              # 2. Alumni & University Meta Microservice
│   │   ├── events/              # 3. Events & Abhyuday 2026 Microservice
│   │   ├── jobs/                # 4. Jobs, Careers & Referrals Microservice
│   │   └── engagement/          # 5. Mentorship, Memories & Giving Microservice
│   ├── handlers/                # Domain business logic & SQL repositories
│   └── services/                # Shared infrastructure services (SMTP Email)
├── bin/
│   └── microservices.exe        # Compiled production binary
├── Dockerfile                   # Multi-stage production container build
├── MICROSERVICES.md             # Architecture documentation
└── start-microservices.bat      # One-click build & launch script (Port 8000)
```
