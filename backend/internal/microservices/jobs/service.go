package jobs

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

// Service encapsulates the Jobs, Careers & Alumni Referrals Microservice (/api/jobs/*).
type Service struct {
	db      *sql.DB
	cfg     *config.Config
	handler *handlers.JobHandler
	reg     *registry.ServiceRegistry
}

func NewService(db *sql.DB, cfg *config.Config, emailSvc *services.EmailService, reg *registry.ServiceRegistry) *Service {
	return &Service{
		db:      db,
		cfg:     cfg,
		handler: handlers.NewJobHandler(db, emailSvc),
		reg:     reg,
	}
}

func (s *Service) ID() string       { return "jobs-service" }
func (s *Service) Name() string     { return "Jobs, Careers & Referrals Microservice" }
func (s *Service) Version() string  { return "v2.0.0" }
func (s *Service) BasePath() string { return "/api/jobs" }
func (s *Service) Description() string {
	return "Manages alumni job postings, career referrals, candidate resume applications, and hiring status workflows."
}

func (s *Service) Endpoints() []registry.EndpointSpec {
	return []registry.EndpointSpec{
		{Method: "GET", Path: "/api/jobs", Auth: "Public", Description: "List active job postings (?job_type=, ?search=)"},
		{Method: "GET", Path: "/api/jobs/health", Auth: "Public", Description: "Jobs Microservice health & referral application statistics"},
		{Method: "POST", Path: "/api/jobs", Auth: "Optional JWT", Description: "Create a new alumni job posting"},
		{Method: "DELETE", Path: "/api/jobs/{id}", Auth: "Optional JWT", Description: "Delete a job posting by owner"},
		{Method: "POST", Path: "/api/jobs/{id}/referral", Auth: "Optional JWT", Description: "Request a direct referral for a job opening"},
		{Method: "GET", Path: "/api/jobs/applications", Auth: "Optional JWT", Description: "List job referral applications (?role=applicant|poster, ?email=)"},
		{Method: "POST", Path: "/api/jobs/applications", Auth: "Optional JWT", Description: "Submit a candidate referral application with resume"},
		{Method: "PUT", Path: "/api/jobs/applications/{id}/status", Auth: "Optional JWT", Description: "Update application status (pending, under_review, referred, rejected)"},
		{Method: "DELETE", Path: "/api/jobs/applications/{id}", Auth: "Optional JWT", Description: "Withdraw or delete a referral application"},
	}
}

func (s *Service) HealthCheck() map[string]interface{} {
	var activeJobs, totalApps int
	_ = s.db.QueryRow("SELECT COUNT(*) FROM jobs WHERE status = 'active'").Scan(&activeJobs)
	_ = s.db.QueryRow("SELECT COUNT(*) FROM job_applications").Scan(&totalApps)

	return map[string]interface{}{
		"service":            s.ID(),
		"name":               s.Name(),
		"status":             "healthy",
		"active_jobs":        activeJobs,
		"total_applications": totalApps,
	}
}

func (s *Service) MountRoutes(api chi.Router) {
	api.Route("/jobs", func(r chi.Router) {
		r.Use(s.reg.Middleware(s.ID(), s.Version()))

		r.Get("/", s.handler.List)
		r.Get("/health", func(w http.ResponseWriter, req *http.Request) {
			res := s.HealthCheck()
			res["metrics"] = s.reg.GetMetrics(s.ID())
			writeJSON(w, http.StatusOK, res)
		})

		r.With(middleware.OptionalAuthMiddleware(s.cfg.JWTSecret)).Post("/", s.handler.Create)
		r.With(middleware.OptionalAuthMiddleware(s.cfg.JWTSecret)).Delete("/{id}", s.handler.Delete)
		r.With(middleware.OptionalAuthMiddleware(s.cfg.JWTSecret)).Post("/{id}/referral", s.handler.RequestReferral)

		// Referral Applications
		r.With(middleware.OptionalAuthMiddleware(s.cfg.JWTSecret)).Get("/applications", s.handler.GetApplications)
		r.With(middleware.OptionalAuthMiddleware(s.cfg.JWTSecret)).Post("/applications", s.handler.ApplyJob)
		r.With(middleware.OptionalAuthMiddleware(s.cfg.JWTSecret)).Put("/applications/{id}/status", s.handler.UpdateApplicationStatus)
		r.With(middleware.OptionalAuthMiddleware(s.cfg.JWTSecret)).Delete("/applications/{id}", s.handler.DeleteApplication)
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
