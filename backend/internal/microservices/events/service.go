package events

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"mcu-alumni-backend/internal/config"
	"mcu-alumni-backend/internal/handlers"
	"mcu-alumni-backend/internal/middleware"
	"mcu-alumni-backend/internal/registry"
)

// Service encapsulates the University Events & Abhyuday 2026 Microservice (/api/events/*).
type Service struct {
	db      *sql.DB
	cfg     *config.Config
	handler *handlers.EventHandler
	reg     *registry.ServiceRegistry
}

func NewService(db *sql.DB, cfg *config.Config, reg *registry.ServiceRegistry) *Service {
	return &Service{
		db:      db,
		cfg:     cfg,
		handler: handlers.NewEventHandler(db),
		reg:     reg,
	}
}

func (s *Service) ID() string       { return "events-service" }
func (s *Service) Name() string     { return "Events & Abhyuday 2026 Microservice" }
func (s *Service) Version() string  { return "v2.0.0" }
func (s *Service) BasePath() string { return "/api/events" }
func (s *Service) Description() string {
	return "Manages MCU alumni reunions, workshops, Abhyuday 2026 sessions, seat capacity tracking, and ticket pass RSVPs."
}

func (s *Service) Endpoints() []registry.EndpointSpec {
	return []registry.EndpointSpec{
		{Method: "GET", Path: "/api/events", Auth: "Public", Description: "List all university events & Abhyuday 2026 schedule (?status=, ?category=)"},
		{Method: "GET", Path: "/api/events/health", Auth: "Public", Description: "Events Microservice health & RSVP statistics"},
		{Method: "GET", Path: "/api/events/{id}", Auth: "Public", Description: "Get single event details, tags, and seat availability"},
		{Method: "GET", Path: "/api/events/{id}/rsvp", Auth: "Public", Description: "View event RSVP registrations and remaining seats"},
		{Method: "POST", Path: "/api/events/{id}/rsvp", Auth: "Bearer JWT", Description: "Submit RSVP registration and generate digital pass code"},
	}
}

func (s *Service) HealthCheck() map[string]interface{} {
	var totalEvents, totalRSVPs int
	_ = s.db.QueryRow("SELECT COUNT(*) FROM events").Scan(&totalEvents)
	_ = s.db.QueryRow("SELECT COALESCE(SUM(rsvp_count), 0) FROM events").Scan(&totalRSVPs)

	return map[string]interface{}{
		"service":      s.ID(),
		"name":         s.Name(),
		"status":       "healthy",
		"total_events": totalEvents,
		"total_rsvps":  totalRSVPs,
	}
}

func (s *Service) MountRoutes(api chi.Router) {
	api.Route("/events", func(r chi.Router) {
		r.Use(s.reg.Middleware(s.ID(), s.Version()))

		r.Get("/", s.handler.List)
		r.Get("/health", func(w http.ResponseWriter, req *http.Request) {
			res := s.HealthCheck()
			res["metrics"] = s.reg.GetMetrics(s.ID())
			writeJSON(w, http.StatusOK, res)
		})
		r.Get("/{id}", s.handler.GetByID)
		r.Get("/{id}/rsvp", s.handler.GetRSVPs)
		r.With(middleware.AuthMiddleware(s.cfg.JWTSecret)).Post("/{id}/rsvp", s.handler.RSVP)
	})
}

func writeJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if data, err := json.MarshalIndent(payload, "", "  "); err == nil {
		_, _ = w.Write(data)
		_, _ = w.Write([]byte("\n"))
	}
}
