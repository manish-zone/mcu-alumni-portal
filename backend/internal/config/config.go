package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port               string
	DBUser             string
	DBPassword         string
	DBHost             string
	DBPort             string
	DBName             string
	JWTSecret          string
	FrontendOrigin     string
	GoogleClientID     string
	GoogleClientSecret string
	SMTPHost           string
	SMTPPort           string
	SMTPUser           string
	SMTPPassword       string
	SMTPFrom           string
}

func Load() *Config {
	// Attempt to load .env file from root, backend, or parent safely
	for _, envFile := range []string{".env", "backend/.env", "../.env"} {
		if _, err := os.Stat(envFile); err == nil {
			_ = godotenv.Overload(envFile)
		}
	}

	port := getEnv("PORT", "8080")
	dbUser := getEnv("DB_USER", "root")
	dbPass := getEnv("DB_PASSWORD", "root")
	dbHost := getEnv("DB_HOST", "127.0.0.1")
	dbPort := getEnv("DB_PORT", "3306")
	dbName := getEnv("DB_NAME", "mcu_alumni_db")
	jwtSecret := getEnv("JWT_SECRET", "mcu_alumni_portal_super_secret_jwt_key_2026_abhyuday")
	frontendOrigin := getEnv("FRONTEND_ORIGIN", "http://localhost:5173")
	googleClientID := getEnv("GOOGLE_CLIENT_ID", "1012854870861-vcifvdo38g7q4cnkjk71rv0oir4rra8n.apps.googleusercontent.com")
	googleClientSecret := getEnv("GOOGLE_CLIENT_SECRET", "")
	smtpHost := getEnv("SMTP_HOST", "smtp.gmail.com")
	smtpPort := getEnv("SMTP_PORT", "587")
	smtpUser := getEnv("SMTP_USER", "")
	smtpPass := getEnv("SMTP_PASS", "")
	smtpFrom := getEnv("SMTP_FROM", "")

	return &Config{
		Port:               port,
		DBUser:             dbUser,
		DBPassword:         dbPass,
		DBHost:             dbHost,
		DBPort:             dbPort,
		DBName:             dbName,
		JWTSecret:          jwtSecret,
		FrontendOrigin:     frontendOrigin,
		GoogleClientID:     googleClientID,
		GoogleClientSecret: googleClientSecret,
		SMTPHost:           smtpHost,
		SMTPPort:           smtpPort,
		SMTPUser:           smtpUser,
		SMTPPassword:       smtpPass,
		SMTPFrom:           smtpFrom,
	}
}

func (c *Config) DSN() string {
	return fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&charset=utf8mb4&collation=utf8mb4_unicode_ci",
		c.DBUser, c.DBPassword, c.DBHost, c.DBPort, c.DBName)
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok && val != "" {
		return val
	}
	return fallback
}
