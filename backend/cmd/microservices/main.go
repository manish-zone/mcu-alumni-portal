package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"

	"mcu-alumni-backend/internal/config"
	"mcu-alumni-backend/internal/database"
	"mcu-alumni-backend/internal/microservices/alumni"
	"mcu-alumni-backend/internal/microservices/auth"
	"mcu-alumni-backend/internal/microservices/engagement"
	"mcu-alumni-backend/internal/microservices/events"
	"mcu-alumni-backend/internal/microservices/jobs"
	"mcu-alumni-backend/internal/middleware"
	"mcu-alumni-backend/internal/registry"
	"mcu-alumni-backend/internal/services"
)

func main() {
	log.Println("🚀 Starting MCU Alumni Portal — Enterprise Single-Port Microservices Engine...")

	// 1. Load Centralized Configuration
	cfg := config.Load()
	port := getEnv("PORT", "8000")
	if port == "8080" {
		port = getEnv("GATEWAY_PORT", "8000")
	}

	// 2. Initialize Shared MySQL Connection Pool
	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("❌ Database connection error: %v", err)
	}
	defer db.Close()

	// 3. Initialize Infrastructure & Service Registry
	emailSvc := services.NewEmailService(cfg)
	svcRegistry := registry.NewServiceRegistry(port)

	// 4. Register Independent Domain Microservices (All on Port 8000)
	svcRegistry.Register(auth.NewService(db, cfg, svcRegistry))
	svcRegistry.Register(alumni.NewService(db, svcRegistry))
	svcRegistry.Register(events.NewService(db, cfg, svcRegistry))
	svcRegistry.Register(jobs.NewService(db, cfg, emailSvc, svcRegistry))
	svcRegistry.Register(engagement.NewService(db, cfg, emailSvc, svcRegistry))

	for _, svc := range svcRegistry.Services() {
		log.Printf("   ✅ Registered Microservice: %-20s [%s] (%d APIs)", svc.ID(), svc.BasePath(), len(svc.Endpoints()))
	}

	// 5. Initialize Enterprise API Gateway Router
	r := chi.NewRouter()
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.Timeout(60 * time.Second))
	r.Use(middleware.CorsHandler(cfg.FrontendOrigin))

	// 6. Interactive Microservices API Gateway Dashboard (GET /)
	r.Get("/", func(w http.ResponseWriter, req *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Header().Set("X-API-Gateway", "MCU-Enterprise-Gateway/2.0")
		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, dashboardHTML, port, port, port)
	})

	// 7. Mount Gateway System Routes + All 5 Microservices under /api and /api/v1
	mountGateway := func(api chi.Router) {
		api.Get("/", func(w http.ResponseWriter, req *http.Request) {
			writeIndentedJSON(w, http.StatusOK, svcRegistry.BuildCatalogReport())
		})
		api.Get("/health", func(w http.ResponseWriter, req *http.Request) {
			writeIndentedJSON(w, http.StatusOK, svcRegistry.BuildHealthReport(db))
		})
		api.Get("/services", func(w http.ResponseWriter, req *http.Request) {
			writeIndentedJSON(w, http.StatusOK, svcRegistry.BuildCatalogReport())
		})

		// Mount each domain microservice's isolated router
		svcRegistry.MountAll(api)
	}

	r.Route("/api", mountGateway)
	r.Route("/api/v1", mountGateway)

	// 8. Structured JSON 404 Handler
	r.NotFound(func(w http.ResponseWriter, req *http.Request) {
		writeIndentedJSON(w, http.StatusNotFound, map[string]interface{}{
			"error":            "API endpoint not found on gateway",
			"requested_path":   req.URL.Path,
			"gateway_url":      fmt.Sprintf("http://localhost:%s", port),
			"service_catalog":  fmt.Sprintf("http://localhost:%s/api/services", port),
			"gateway_health":   fmt.Sprintf("http://localhost:%s/api/health", port),
			"active_services":  []string{"/api/auth", "/api/alumni", "/api/meta", "/api/events", "/api/jobs", "/api/engagement", "/api/mentorship", "/api/memories", "/api/giving"},
		})
	})

	// 9. Start Single-Port HTTP Server with Graceful Shutdown
	server := &http.Server{
		Addr:         ":" + port,
		Handler:      r,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	serverErrors := make(chan error, 1)
	go func() {
		log.Printf("✨ Enterprise API Gateway & 5 Microservices active on http://localhost:%s", port)
		log.Printf("📦 Service Catalog: http://localhost:%s/api/services", port)
		log.Printf("❤️  Health & Telemetry: http://localhost:%s/api/health", port)
		serverErrors <- server.ListenAndServe()
	}()

	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)

	select {
	case err := <-serverErrors:
		log.Fatalf("❌ Gateway server error: %v", err)
	case sig := <-shutdown:
		log.Printf("⚠️ Signal %v received. Shutting down microservices gracefully...", sig)
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := server.Shutdown(ctx); err != nil {
			_ = server.Close()
		}
	}
}

func writeIndentedJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if data, err := json.MarshalIndent(payload, "", "  "); err == nil {
		_, _ = w.Write(data)
		_, _ = w.Write([]byte("\n"))
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

const dashboardHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>MCU Alumni Portal — Enterprise Microservices Gateway</title>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;font-family:'Inter',sans-serif}
    body{background:linear-gradient(135deg,#04101e 0%%,#00264d 50%%,#140707 100%%);color:#f8fafc;min-height:100vh;padding:32px 16px}
    .container{max-width:1080px;margin:0 auto}
    h1{font-family:'Cinzel',serif;font-size:clamp(22px,4vw,32px);font-weight:800;color:#fbbf24;text-align:center;margin-bottom:6px}
    .subtitle{text-align:center;color:#94a3b8;font-size:14px;margin-bottom:24px}
    .badge{display:inline-flex;align-items:center;gap:8px;background:rgba(16,185,129,.15);border:1px solid rgba(16,185,129,.35);color:#34d399;padding:6px 14px;border-radius:9999px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em}
    .pulse{width:8px;height:8px;background:#10b981;border-radius:50%%;animation:pulse 1.5s infinite;box-shadow:0 0 10px #10b981}
    @keyframes pulse{0%%,100%%{opacity:1;transform:scale(1)}50%%{opacity:.6;transform:scale(1.2)}}
    .header-row{text-align:center;margin-bottom:24px}
    .links-row{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-bottom:24px}
    .link-btn{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.15);padding:8px 15px;border-radius:10px;font-size:12.5px;color:#e2e8f0;font-weight:600;text-decoration:none;transition:.2s}
    .link-btn:hover{background:rgba(251,191,36,.15);border-color:#fbbf24;color:#fbbf24}
    .arch-diagram{background:rgba(15,23,42,.65);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:20px;margin-bottom:24px;font-family:'JetBrains Mono',monospace;font-size:12px;color:#cbd5e1;line-height:1.75;overflow-x:auto;white-space:pre}
    .services-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px;margin-bottom:24px}
    .service-card{background:rgba(15,23,42,.6);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:18px;transition:.2s;display:flex;flex-direction:column;justify-content:space-between}
    .service-card:hover{background:rgba(15,23,42,.85);border-color:rgba(251,191,36,.45)}
    .svc-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
    .svc-name{font-weight:700;font-size:15px;color:#f8fafc}
    .svc-tag{font-size:10px;padding:3px 8px;border-radius:6px;background:rgba(16,185,129,0.2);color:#34d399;font-weight:700;font-family:'JetBrains Mono',monospace}
    .svc-port{font-family:'JetBrains Mono',monospace;font-size:11.5px;color:#fbbf24;margin-bottom:8px;display:flex;justify-content:space-between}
    .svc-desc{font-size:12px;color:#94a3b8;line-height:1.5;margin-bottom:12px}
    .routes-table{width:100%%;border-collapse:collapse;font-size:11.5px}
    .routes-table tr{border-top:1px solid rgba(255,255,255,.07)}
    .routes-table td{padding:5px 4px;color:#cbd5e1;font-family:'JetBrains Mono',monospace}
    .routes-table td:first-child{color:#38bdf8;font-weight:700;width:68px}
    .routes-table a{color:#cbd5e1;text-decoration:none}
    .routes-table a:hover{color:#fbbf24;text-decoration:underline}
    .note{background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.25);border-radius:12px;padding:16px;font-size:13px;color:#fde68a;line-height:1.6}
    .note strong{color:#fff}
  </style>
</head>
<body>
<div class="container">
  <div class="header-row">
    <div class="badge"><div class="pulse"></div> Enterprise Single-Port Microservices Active</div>
    <h1 style="margin-top:14px">Makhanlal Chaturvedi National University</h1>
    <p class="subtitle">API Gateway &amp; 5 Independent Domain Microservices unified on <strong>Port %s</strong></p>
  </div>

  <div class="links-row">
    <a class="link-btn" href="http://localhost:5173" target="_blank">🌐 React Portal (5173)</a>
    <a class="link-btn" href="/api/health" target="_blank">❤️ Gateway &amp; Service Health</a>
    <a class="link-btn" href="/api/services" target="_blank">📦 Service Registry Catalog</a>
    <a class="link-btn" href="/api/auth" target="_blank">🔐 Auth Service</a>
    <a class="link-btn" href="/api/auth/profile" target="_blank">👤 Registered Profiles</a>
    <a class="link-btn" href="/api/alumni" target="_blank">🎓 Alumni Service</a>
    <a class="link-btn" href="/api/meta" target="_blank">📊 University Meta</a>
    <a class="link-btn" href="/api/events" target="_blank">📅 Events Service</a>
    <a class="link-btn" href="/api/jobs" target="_blank">💼 Jobs Service</a>
    <a class="link-btn" href="/api/engagement" target="_blank">🤝 Engagement Service</a>
  </div>

  <div class="arch-diagram">  React Frontend (localhost:5173) / Browser Client
                         │
                         ▼  Single Entrypoint (Port %s)
  ┌──────────────────────────────────────────────────────────────────────────────┐
  │  🌐 ENTERPRISE API GATEWAY &amp; SERVICE REGISTRY (internal/registry)            │
  │  • Per-Service Telemetry   • JWT &amp; OAuth Guard   • X-Microservice Headers   │
  └──────┬────────────────┬─────────────────┬────────────────┬───────────────────┘
         │                │                 │                │                 │
         ▼                ▼                 ▼                ▼                 ▼
  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐
  │ auth-service│  │alumni-service│  │events-svc   │  │ jobs-service│  │engagement-svc│
  │ /api/auth/* │  │/api/alumni/* │  │/api/events/*│  │ /api/jobs/* │  │/api/mentor.. │
  └──────┬──────┘  └──────┬───────┘  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘
         └────────────────┴─────────────────┴────────────────┴────────────────┘
                                            │
                             MySQL Connection Pool (mcu_alumni_db)</div>

  <div class="services-grid">
    <div class="service-card">
      <div>
        <div class="svc-header"><span class="svc-name">🔐 1. Auth &amp; Identity Service</span><span class="svc-tag">v2.0.0</span></div>
        <div class="svc-port"><span>pkg: internal/microservices/auth</span><a href="/api/auth/health" style="color:#34d399;text-decoration:none">● /health</a></div>
        <div class="svc-desc">Registration, Alumni vs Student batch verification, JWT tokens, Google OAuth 2.0, and user profiles.</div>
      </div>
      <table class="routes-table">
        <tr><td>GET</td><td><a href="/api/auth">/api/auth</a></td></tr>
        <tr><td>GET</td><td><a href="/api/auth/profile">/api/auth/profile</a></td></tr>
        <tr><td>PUT</td><td>/api/auth/profile</td></tr>
        <tr><td>GET</td><td><a href="/api/auth/me">/api/auth/me</a></td></tr>
        <tr><td>POST</td><td><a href="/api/auth/register">/api/auth/register</a></td></tr>
        <tr><td>POST</td><td><a href="/api/auth/login">/api/auth/login</a></td></tr>
        <tr><td>POST</td><td>/api/auth/google</td></tr>
      </table>
    </div>

    <div class="service-card">
      <div>
        <div class="svc-header"><span class="svc-name">🎓 2. Alumni &amp; Meta Service</span><span class="svc-tag">v2.0.0</span></div>
        <div class="svc-port"><span>pkg: internal/microservices/alumni</span><a href="/api/alumni/health" style="color:#34d399;text-decoration:none">● /health</a></div>
        <div class="svc-desc">Verified alumni directory, search filters, MCU campuses, academic departments, and live statistics.</div>
      </div>
      <table class="routes-table">
        <tr><td>GET</td><td><a href="/api/alumni">/api/alumni</a></td></tr>
        <tr><td>GET</td><td><a href="/api/alumni/1">/api/alumni/{id}</a></td></tr>
        <tr><td>GET</td><td><a href="/api/meta">/api/meta</a></td></tr>
        <tr><td>GET</td><td><a href="/api/meta/campuses">/api/meta/campuses</a></td></tr>
        <tr><td>GET</td><td><a href="/api/meta/departments">/api/meta/departments</a></td></tr>
        <tr><td>GET</td><td><a href="/api/meta/stats">/api/meta/stats</a></td></tr>
      </table>
    </div>

    <div class="service-card">
      <div>
        <div class="svc-header"><span class="svc-name">📅 3. Events Service</span><span class="svc-tag">v2.0.0</span></div>
        <div class="svc-port"><span>pkg: internal/microservices/events</span><a href="/api/events/health" style="color:#34d399;text-decoration:none">● /health</a></div>
        <div class="svc-desc">University conferences, alumni reunions, Abhyuday 2026 schedule, seat tracking, and pass RSVPs.</div>
      </div>
      <table class="routes-table">
        <tr><td>GET</td><td><a href="/api/events">/api/events</a></td></tr>
        <tr><td>GET</td><td><a href="/api/events/1">/api/events/{id}</a></td></tr>
        <tr><td>GET</td><td><a href="/api/events/1/rsvp">/api/events/{id}/rsvp</a></td></tr>
        <tr><td>POST</td><td>/api/events/{id}/rsvp</td></tr>
        <tr><td>GET</td><td><a href="/api/events/health">/api/events/health</a></td></tr>
      </table>
    </div>

    <div class="service-card">
      <div>
        <div class="svc-header"><span class="svc-name">💼 4. Jobs &amp; Referrals Service</span><span class="svc-tag">v2.0.0</span></div>
        <div class="svc-port"><span>pkg: internal/microservices/jobs</span><a href="/api/jobs/health" style="color:#34d399;text-decoration:none">● /health</a></div>
        <div class="svc-desc">Career job board, alumni referral postings, resume applications, and hiring status workflows.</div>
      </div>
      <table class="routes-table">
        <tr><td>GET</td><td><a href="/api/jobs">/api/jobs</a></td></tr>
        <tr><td>POST</td><td>/api/jobs</td></tr>
        <tr><td>GET</td><td><a href="/api/jobs/applications">/api/jobs/applications</a></td></tr>
        <tr><td>POST</td><td>/api/jobs/applications</td></tr>
        <tr><td>PUT</td><td>/api/jobs/applications/{id}/status</td></tr>
        <tr><td>GET</td><td><a href="/api/jobs/health">/api/jobs/health</a></td></tr>
      </table>
    </div>

    <div class="service-card">
      <div>
        <div class="svc-header"><span class="svc-name">🤝 5. Engagement Service</span><span class="svc-tag">v2.0.0</span></div>
        <div class="svc-port"><span>pkg: internal/microservices/engagement</span><a href="/api/engagement/health" style="color:#34d399;text-decoration:none">● /health</a></div>
        <div class="svc-desc">1-on-1 alumni mentorship scheduling, historical campus memories gallery, and university giving.</div>
      </div>
      <table class="routes-table">
        <tr><td>GET</td><td><a href="/api/engagement">/api/engagement</a></td></tr>
        <tr><td>GET</td><td><a href="/api/mentorship">/api/mentorship</a></td></tr>
        <tr><td>POST</td><td>/api/mentorship/requests</td></tr>
        <tr><td>GET</td><td><a href="/api/memories">/api/memories</a></td></tr>
        <tr><td>GET</td><td><a href="/api/giving/initiatives">/api/giving/initiatives</a></td></tr>
        <tr><td>GET</td><td><a href="/api/giving/donate">/api/giving/donate</a></td></tr>
      </table>
    </div>
  </div>

  <div class="note">
    💡 <strong>Industry Single-Port Microservices Architecture:</strong> All 5 domain microservices (<code>auth-service</code>, <code>alumni-service</code>, <code>events-service</code>, <code>jobs-service</code>, <code>engagement-service</code>) are isolated in dedicated Go packages under <code>internal/microservices/*</code> and mounted onto the Enterprise API Gateway on <strong>Port %s</strong> with per-service health checks, atomic request telemetry, and <code>X-Microservice</code> response headers.
  </div>
</div>
</body>
</html>`
