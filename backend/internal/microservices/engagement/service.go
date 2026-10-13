package engagement

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"mcu-alumni-backend/internal/config"
	"mcu-alumni-backend/internal/handlers"
	"mcu-alumni-backend/internal/middleware"
	"mcu-alumni-backend/internal/registry"
	"mcu-alumni-backend/internal/services"
)

// Service encapsulates the Alumni Engagement Microservice (/api/engagement, /api/mentorship, /api/memories, /api/giving).
type Service struct {
	db            *sql.DB
	cfg           *config.Config
	mentorHandler *handlers.MentorshipHandler
	memoryHandler *handlers.MemoryHandler
	givingHandler *handlers.GivingHandler
	reg           *registry.ServiceRegistry
}

func NewService(db *sql.DB, cfg *config.Config, emailSvc *services.EmailService, reg *registry.ServiceRegistry) *Service {
	return &Service{
		db:            db,
		cfg:           cfg,
		mentorHandler: handlers.NewMentorshipHandler(db, emailSvc),
		memoryHandler: handlers.NewMemoryHandler(db),
		givingHandler: handlers.NewGivingHandler(db),
		reg:           reg,
	}
}

func (s *Service) ID() string       { return "engagement-service" }
func (s *Service) Name() string     { return "Engagement, Mentorship, Memories & Giving Microservice" }
func (s *Service) Version() string  { return "v2.0.0" }
func (s *Service) BasePath() string { return "/api/engagement" }
func (s *Service) Description() string {
	return "Manages 1-on-1 alumni mentorship requests, historical campus memories gallery, and university philanthropy/giving initiatives."
}

func (s *Service) Endpoints() []registry.EndpointSpec {
	return []registry.EndpointSpec{
		{Method: "GET", Path: "/api/engagement", Auth: "Public", Description: "Engagement Microservice manifest & unified live summary"},
		{Method: "GET", Path: "/api/engagement/health", Auth: "Public", Description: "Engagement Microservice health check & metrics"},
		{Method: "GET", Path: "/api/mentorship", Auth: "Public", Description: "List mentorship requests and available mentor count"},
		{Method: "GET", Path: "/api/mentorship/requests", Auth: "Public", Description: "List all mentorship session requests"},
		{Method: "POST", Path: "/api/mentorship/requests", Auth: "Optional JWT", Description: "Submit a 1-on-1 mentorship session request & notify alumnus"},
		{Method: "GET", Path: "/api/mentorship/my-requests", Auth: "Optional JWT", Description: "List mentorship requests for the logged-in mentor or mentee"},
		{Method: "PUT", Path: "/api/mentorship/requests/{id}/status", Auth: "Optional JWT", Description: "Schedule mentorship session or update status & notify student"},
		{Method: "DELETE", Path: "/api/mentorship/requests/{id}", Auth: "Optional JWT", Description: "Delete or withdraw a mentorship request"},
		{Method: "GET", Path: "/api/memories", Auth: "Public", Description: "List historical campus photo & video memories (?category=)"},
		{Method: "GET", Path: "/api/giving", Auth: "Public", Description: "List active university giving & endowment initiatives"},
		{Method: "GET", Path: "/api/giving/initiatives", Auth: "Public", Description: "List active university giving & endowment initiatives"},
		{Method: "GET", Path: "/api/giving/donate", Auth: "Public", Description: "View recorded alumni donations and total funds raised"},
		{Method: "POST", Path: "/api/giving/donate", Auth: "Optional JWT", Description: "Process a new alumni donation to an initiative"},
	}
}

func (s *Service) HealthCheck() map[string]interface{} {
	var mentors, requests, memories, initiatives int
	var totalRaised float64
	_ = s.db.QueryRow("SELECT COUNT(*) FROM alumni_profiles WHERE open_to_mentor = 1").Scan(&mentors)
	_ = s.db.QueryRow("SELECT COUNT(*) FROM mentorship_requests").Scan(&requests)
	_ = s.db.QueryRow("SELECT COUNT(*) FROM campus_memories").Scan(&memories)
	_ = s.db.QueryRow("SELECT COUNT(*) FROM giving_initiatives WHERE status = 'active'").Scan(&initiatives)
	_ = s.db.QueryRow("SELECT COALESCE(SUM(raised_amount), 0) FROM giving_initiatives").Scan(&totalRaised)

	return map[string]interface{}{
		"service":             s.ID(),
		"name":                s.Name(),
		"status":              "healthy",
		"available_mentors":   mentors,
		"mentorship_requests": requests,
		"campus_memories":     memories,
		"giving_initiatives":  initiatives,
		"total_giving_raised": totalRaised,
	}
}

func (s *Service) MountRoutes(api chi.Router) {
	// /api/engagement/* (Service Root & Health)
	api.Route("/engagement", func(r chi.Router) {
		r.Use(s.reg.Middleware(s.ID(), s.Version()))

		r.Get("/", func(w http.ResponseWriter, req *http.Request) {
			writeJSON(w, http.StatusOK, map[string]interface{}{
				"microservice": s.ID(),
				"name":         s.Name(),
				"version":      s.Version(),
				"status":       "ACTIVE",
				"base_path":    s.BasePath(),
				"description":  s.Description(),
				"health":       s.HealthCheck(),
				"metrics":      s.reg.GetMetrics(s.ID()),
				"endpoints":    s.Endpoints(),
			})
		})
		r.Get("/health", func(w http.ResponseWriter, req *http.Request) {
			res := s.HealthCheck()
			res["metrics"] = s.reg.GetMetrics(s.ID())
			writeJSON(w, http.StatusOK, res)
		})
	})

	// /api/mentorship/*
	api.Route("/mentorship", func(r chi.Router) {
		r.Use(s.reg.Middleware(s.ID(), s.Version()))

		r.Get("/", s.mentorHandler.ListRequests)
		r.Get("/requests", s.mentorHandler.ListRequests)
		r.With(middleware.OptionalAuthMiddleware(s.cfg.JWTSecret)).Post("/requests", s.mentorHandler.CreateRequest)
		r.With(middleware.OptionalAuthMiddleware(s.cfg.JWTSecret)).Get("/my-requests", s.mentorHandler.GetMyRequests)
		r.With(middleware.OptionalAuthMiddleware(s.cfg.JWTSecret)).Put("/requests/{id}/status", s.mentorHandler.UpdateRequestStatus)
		r.With(middleware.OptionalAuthMiddleware(s.cfg.JWTSecret)).Delete("/requests/{id}", s.mentorHandler.DeleteRequest)
	})

	// /api/memories/*
	api.Route("/memories", func(r chi.Router) {
		r.Use(s.reg.Middleware(s.ID(), s.Version()))

		r.Get("/", s.memoryHandler.List)
	})

	// /api/giving/*
	api.Route("/giving", func(r chi.Router) {
		r.Use(s.reg.Middleware(s.ID(), s.Version()))

		r.Get("/", s.givingHandler.ListInitiatives)
		r.Get("/initiatives", s.givingHandler.ListInitiatives)
		r.Get("/donate", s.givingHandler.ListDonations)
		r.Get("/donations", s.givingHandler.ListDonations)
		r.With(middleware.OptionalAuthMiddleware(s.cfg.JWTSecret)).Post("/donate", s.givingHandler.CreateDonation)
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
