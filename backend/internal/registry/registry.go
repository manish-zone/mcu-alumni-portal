package registry

import (
	"database/sql"
	"fmt"
	"net/http"
	"sync"
	"sync/atomic"
	"time"

	"github.com/go-chi/chi/v5"
)

// EndpointSpec describes a single REST API endpoint exposed by a microservice.
type EndpointSpec struct {
	Method      string `json:"method"`
	Path        string `json:"path"`
	Auth        string `json:"auth"`
	Description string `json:"description"`
}

// Microservice defines the standard enterprise contract that every domain microservice implements.
type Microservice interface {
	ID() string
	Name() string
	Version() string
	BasePath() string
	Description() string
	Endpoints() []EndpointSpec
	HealthCheck() map[string]interface{}
	MountRoutes(api chi.Router)
}

// ServiceMetrics tracks live runtime telemetry per microservice.
type ServiceMetrics struct {
	totalRequests uint64
	errorCount    uint64
	totalLatency  uint64 // in microseconds
	mu            sync.RWMutex
	lastActiveAt  string
	startedAt     time.Time
}

// MetricsSnapshot is the JSON-serializable telemetry snapshot for a microservice.
type MetricsSnapshot struct {
	TotalRequests uint64  `json:"total_requests"`
	SuccessCount  uint64  `json:"success_count"`
	ErrorCount    uint64  `json:"error_count"`
	AvgLatencyMs  float64 `json:"avg_latency_ms"`
	Uptime        string  `json:"uptime"`
	LastActiveAt  string  `json:"last_active_at,omitempty"`
}

// ServiceRegistry manages all registered microservices on the single-port API Gateway.
type ServiceRegistry struct {
	port     string
	services []Microservice
	metrics  map[string]*ServiceMetrics
	started  time.Time
}

// NewServiceRegistry creates a new enterprise ServiceRegistry on the target gateway port.
func NewServiceRegistry(port string) *ServiceRegistry {
	return &ServiceRegistry{
		port:     port,
		services: make([]Microservice, 0, 5),
		metrics:  make(map[string]*ServiceMetrics),
		started:  time.Now(),
	}
}

// Register adds a domain microservice to the registry and initializes its telemetry tracker.
func (sr *ServiceRegistry) Register(svc Microservice) {
	sr.services = append(sr.services, svc)
	sr.metrics[svc.ID()] = &ServiceMetrics{
		startedAt: time.Now(),
	}
}

// Services returns all registered microservices in registration order.
func (sr *ServiceRegistry) Services() []Microservice {
	return sr.services
}

// statusRecorder wraps http.ResponseWriter to capture the HTTP status code for telemetry.
type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(code int) {
	r.status = code
	r.ResponseWriter.WriteHeader(code)
}

// Middleware returns an HTTP middleware that tags responses with microservice headers
// and records request count, error count, and latency for the given microservice.
func (sr *ServiceRegistry) Middleware(serviceID, version string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}

			w.Header().Set("X-API-Gateway", "MCU-Enterprise-Gateway/2.0")
			w.Header().Set("X-Microservice", serviceID)
			w.Header().Set("X-Service-Version", version)

			next.ServeHTTP(rec, r)

			elapsed := time.Since(start)
			w.Header().Set("X-Response-Time", fmt.Sprintf("%.2fms", float64(elapsed.Microseconds())/1000.0))

			if m, ok := sr.metrics[serviceID]; ok {
				atomic.AddUint64(&m.totalRequests, 1)
				atomic.AddUint64(&m.totalLatency, uint64(elapsed.Microseconds()))
				if rec.status >= 400 {
					atomic.AddUint64(&m.errorCount, 1)
				}
				m.mu.Lock()
				m.lastActiveAt = time.Now().Format(time.RFC3339)
				m.mu.Unlock()
			}
		})
	}
}

// GetMetrics returns a thread-safe telemetry snapshot for a specific microservice.
func (sr *ServiceRegistry) GetMetrics(serviceID string) MetricsSnapshot {
	m, ok := sr.metrics[serviceID]
	if !ok {
		return MetricsSnapshot{}
	}
	total := atomic.LoadUint64(&m.totalRequests)
	errs := atomic.LoadUint64(&m.errorCount)
	latMicros := atomic.LoadUint64(&m.totalLatency)

	var avgMs float64
	if total > 0 {
		avgMs = float64(latMicros) / float64(total) / 1000.0
	}

	m.mu.RLock()
	lastActive := m.lastActiveAt
	m.mu.RUnlock()

	success := uint64(0)
	if total >= errs {
		success = total - errs
	}

	return MetricsSnapshot{
		TotalRequests: total,
		SuccessCount:  success,
		ErrorCount:    errs,
		AvgLatencyMs:  avgMs,
		Uptime:        time.Since(m.startedAt).Round(time.Second).String(),
		LastActiveAt:  lastActive,
	}
}

// MountAll mounts every registered microservice onto the provided API router (/api or /api/v1).
func (sr *ServiceRegistry) MountAll(api chi.Router) {
	for _, svc := range sr.services {
		svc.MountRoutes(api)
	}
}

// BuildHealthReport aggregates gateway, database, and per-microservice health & telemetry.
func (sr *ServiceRegistry) BuildHealthReport(db *sql.DB) map[string]interface{} {
	dbStatus := "connected"
	if err := db.Ping(); err != nil {
		dbStatus = "degraded: " + err.Error()
	}
	dbStats := db.Stats()

	serviceReports := make(map[string]interface{}, len(sr.services))
	for _, svc := range sr.services {
		info := svc.HealthCheck()
		info["version"] = svc.Version()
		info["base_path"] = svc.BasePath()
		info["metrics"] = sr.GetMetrics(svc.ID())
		serviceReports[svc.ID()] = info
	}

	return map[string]interface{}{
		"status":         "healthy",
		"architecture":   "Single-Port Microservices Architecture (API Gateway + 5 Domain Microservices)",
		"gateway":        "MCU-Enterprise-Gateway/2.0",
		"port":           sr.port,
		"uptime":         time.Since(sr.started).Round(time.Second).String(),
		"university":     "Makhanlal Chaturvedi National University of Journalism and Communication (MCU)",
		"total_services": len(sr.services),
		"database": map[string]interface{}{
			"engine":           "MySQL (mcu_alumni_db)",
			"status":           dbStatus,
			"open_connections": dbStats.OpenConnections,
			"in_use":           dbStats.InUse,
			"idle":             dbStats.Idle,
		},
		"microservices": serviceReports,
		"timestamp":     time.Now().Format(time.RFC3339),
	}
}

// BuildCatalogReport returns the full Service Discovery Catalog with all endpoints per service.
func (sr *ServiceRegistry) BuildCatalogReport() map[string]interface{} {
	catalog := make([]map[string]interface{}, 0, len(sr.services))
	totalEndpoints := 0

	for _, svc := range sr.services {
		eps := svc.Endpoints()
		totalEndpoints += len(eps)
		catalog = append(catalog, map[string]interface{}{
			"id":              svc.ID(),
			"name":            svc.Name(),
			"version":         svc.Version(),
			"status":          "ACTIVE",
			"base_url":        fmt.Sprintf("http://localhost:%s%s", sr.port, svc.BasePath()),
			"health_endpoint": fmt.Sprintf("http://localhost:%s%s/health", sr.port, svc.BasePath()),
			"description":     svc.Description(),
			"total_apis":      len(eps),
			"metrics":         sr.GetMetrics(svc.ID()),
			"endpoints":       eps,
		})
	}

	return map[string]interface{}{
		"architecture":        "Single-Port Microservices Architecture",
		"gateway_url":         fmt.Sprintf("http://localhost:%s", sr.port),
		"api_base_url":        fmt.Sprintf("http://localhost:%s/api", sr.port),
		"port":                sr.port,
		"total_microservices": len(sr.services),
		"total_api_endpoints": totalEndpoints,
		"microservices":       catalog,
	}
}
