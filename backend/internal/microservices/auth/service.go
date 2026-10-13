package auth

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

// Service encapsulates the Auth & Identity Microservice (all /api/auth/* endpoints).
type Service struct {
	db      *sql.DB
	cfg     *config.Config
	handler *handlers.AuthHandler
	reg     *registry.ServiceRegistry
}

func NewService(db *sql.DB, cfg *config.Config, reg *registry.ServiceRegistry) *Service {
	return &Service{
		db:      db,
		cfg:     cfg,
		handler: handlers.NewAuthHandler(db, cfg),
		reg:     reg,
	}
}

func (s *Service) ID() string      { return "auth-service" }
func (s *Service) Name() string    { return "Auth & Identity Microservice" }
func (s *Service) Version() string { return "v2.0.0" }
func (s *Service) BasePath() string { return "/api/auth" }
func (s *Service) Description() string {
	return "Manages user registration, enrollment verification (Alumni vs Student), JWT authentication, Google OAuth 2.0, password recovery, and user profiles."
}

func (s *Service) Endpoints() []registry.EndpointSpec {
	return []registry.EndpointSpec{
		{Method: "GET", Path: "/api/auth", Auth: "Public", Description: "Auth Microservice manifest, metrics, and API catalog"},
		{Method: "GET", Path: "/api/auth/health", Auth: "Public", Description: "Auth Microservice health & registered account metrics"},
		{Method: "POST", Path: "/api/auth/register", Auth: "Public", Description: "Register new Alumnus or Current Student account"},
		{Method: "POST", Path: "/api/auth/login", Auth: "Public", Description: "Authenticate with email & password and issue JWT"},
		{Method: "GET", Path: "/api/auth/me", Auth: "Bearer JWT", Description: "Get currently authenticated user profile"},
		{Method: "GET", Path: "/api/auth/profile", Auth: "Optional JWT", Description: "View registered user profiles or filter by ?email= / ?id="},
		{Method: "PUT", Path: "/api/auth/profile", Auth: "Bearer JWT", Description: "Update authenticated user profile, skills, and avatar"},
		{Method: "POST", Path: "/api/auth/google", Auth: "Public", Description: "Authenticate or register via Google OAuth 2.0"},
		{Method: "GET", Path: "/api/auth/google/callback", Auth: "Public", Description: "Google OAuth 2.0 redirect callback handler"},
		{Method: "POST", Path: "/api/auth/forgot-password", Auth: "Public", Description: "Send 6-digit password recovery OTP to email"},
		{Method: "POST", Path: "/api/auth/reset-password", Auth: "Public", Description: "Verify OTP and reset account password"},
	}
}

func (s *Service) HealthCheck() map[string]interface{} {
	var totalUsers, verifiedUsers int
	_ = s.db.QueryRow("SELECT COUNT(*) FROM users").Scan(&totalUsers)
	_ = s.db.QueryRow("SELECT COUNT(*) FROM users WHERE is_verified = 1").Scan(&verifiedUsers)

	return map[string]interface{}{
		"service":          s.ID(),
		"name":             s.Name(),
		"status":           "healthy",
		"registered_users": totalUsers,
		"verified_users":   verifiedUsers,
	}
}

func (s *Service) MountRoutes(api chi.Router) {
	api.Route("/auth", func(r chi.Router) {
		r.Use(s.reg.Middleware(s.ID(), s.Version()))

		// Service Root Manifest
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

		// Service Health Endpoint
		r.Get("/health", func(w http.ResponseWriter, req *http.Request) {
			res := s.HealthCheck()
			res["metrics"] = s.reg.GetMetrics(s.ID())
			writeJSON(w, http.StatusOK, res)
		})

		// Core Auth & Identity APIs
		r.Post("/register", s.handler.Register)
		r.Get("/register", func(w http.ResponseWriter, req *http.Request) {
			writeJSON(w, http.StatusOK, map[string]interface{}{
				"microservice":    s.ID(),
				"endpoint":        "POST /api/auth/register",
				"description":     "Registers a new MCU Alumnus or Current Student with automatic Enrollment Number & Batch Year verification.",
				"required_fields": []string{"first_name", "email", "password", "enrollmentNo", "batch_year", "degree", "campus"},
			})
		})

		r.Post("/login", s.handler.Login)
		r.Get("/login", func(w http.ResponseWriter, req *http.Request) {
			writeJSON(w, http.StatusOK, map[string]interface{}{
				"microservice":    s.ID(),
				"endpoint":        "POST /api/auth/login",
				"description":     "Authenticates an MCU Alumnus or Student and returns a signed JWT Bearer token.",
				"required_fields": []string{"email", "password"},
			})
		})

		r.Post("/forgot-password", s.handler.ForgotPassword)
		r.Post("/reset-password", s.handler.ResetPassword)
		r.Post("/google", s.handler.GoogleAuth)
		r.Get("/google/callback", s.handler.GoogleCallback)
		r.Post("/google/callback", s.handler.GoogleCallback)

		// Profile & Session APIs
		r.With(middleware.OptionalAuthMiddleware(s.cfg.JWTSecret)).Get("/me", s.handler.GetMe)
		r.With(middleware.OptionalAuthMiddleware(s.cfg.JWTSecret)).Get("/profile", s.handler.GetProfile)
		r.With(middleware.AuthMiddleware(s.cfg.JWTSecret)).Put("/profile", s.handler.UpdateProfile)
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
