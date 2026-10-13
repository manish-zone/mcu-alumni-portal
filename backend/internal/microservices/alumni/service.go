package alumni

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"mcu-alumni-backend/internal/handlers"
	"mcu-alumni-backend/internal/registry"
)

// Service encapsulates the Alumni Directory & University Metadata Microservice (/api/alumni/* & /api/meta/*).
type Service struct {
	db            *sql.DB
	alumniHandler *handlers.AlumniHandler
	metaHandler   *handlers.MetaHandler
	reg           *registry.ServiceRegistry
}

func NewService(db *sql.DB, reg *registry.ServiceRegistry) *Service {
	return &Service{
		db:            db,
		alumniHandler: handlers.NewAlumniHandler(db),
		metaHandler:   handlers.NewMetaHandler(db),
		reg:           reg,
	}
}

func (s *Service) ID() string       { return "alumni-service" }
func (s *Service) Name() string     { return "Alumni Directory & University Meta Microservice" }
func (s *Service) Version() string  { return "v2.0.0" }
func (s *Service) BasePath() string { return "/api/alumni" }
func (s *Service) Description() string {
	return "Manages verified MCU alumni directory profiles, skill filtering, campus/department catalogs, and real-time university statistics."
}

func (s *Service) Endpoints() []registry.EndpointSpec {
	return []registry.EndpointSpec{
		{Method: "GET", Path: "/api/alumni", Auth: "Public", Description: "List and search verified alumni profiles (?campus=, ?batch=, ?dept=, ?search=, ?mentor=)"},
		{Method: "GET", Path: "/api/alumni/health", Auth: "Public", Description: "Alumni Microservice health & directory metrics"},
		{Method: "GET", Path: "/api/alumni/{id}", Auth: "Public", Description: "Get full alumnus profile by ID with skills and mentorship status"},
		{Method: "GET", Path: "/api/meta", Auth: "Public", Description: "Get unified university metadata (campuses, departments, and stats)"},
		{Method: "GET", Path: "/api/meta/campuses", Auth: "Public", Description: "List all active MCU campuses (Bhopal, Rewa, Khandwa, Datia)"},
		{Method: "GET", Path: "/api/meta/departments", Auth: "Public", Description: "List all MCU academic departments & faculties"},
		{Method: "GET", Path: "/api/meta/stats", Auth: "Public", Description: "Get real-time university alumni, mentor, event, and job statistics"},
	}
}

func (s *Service) HealthCheck() map[string]interface{} {
	var totalProfiles, totalCampuses, totalDepts int
	_ = s.db.QueryRow("SELECT COUNT(*) FROM alumni_profiles").Scan(&totalProfiles)
	_ = s.db.QueryRow("SELECT COUNT(*) FROM campuses WHERE is_active = 1").Scan(&totalCampuses)
	_ = s.db.QueryRow("SELECT COUNT(*) FROM departments").Scan(&totalDepts)

	return map[string]interface{}{
		"service":           s.ID(),
		"name":              s.Name(),
		"status":            "healthy",
		"alumni_profiles":   totalProfiles,
		"active_campuses":   totalCampuses,
		"departments_count": totalDepts,
	}
}

func (s *Service) MountRoutes(api chi.Router) {
	// /api/alumni/*
	api.Route("/alumni", func(r chi.Router) {
		r.Use(s.reg.Middleware(s.ID(), s.Version()))

		r.Get("/", s.alumniHandler.ListAlumni)
		r.Get("/health", func(w http.ResponseWriter, req *http.Request) {
			res := s.HealthCheck()
			res["metrics"] = s.reg.GetMetrics(s.ID())
			writeJSON(w, http.StatusOK, res)
		})
		r.Get("/{id}", s.alumniHandler.GetAlumniByID)
	})

	// /api/meta/*
	api.Route("/meta", func(r chi.Router) {
		r.Use(s.reg.Middleware(s.ID(), s.Version()))

		r.Get("/", s.metaHandler.GetAllMeta)
		r.Get("/campuses", s.metaHandler.GetCampuses)
		r.Get("/departments", s.metaHandler.GetDepartments)
		r.Get("/stats", s.metaHandler.GetStats)
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
