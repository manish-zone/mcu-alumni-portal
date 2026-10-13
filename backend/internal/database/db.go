package database

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	"mcu-alumni-backend/internal/config"

	_ "github.com/go-sql-driver/mysql"
)

func Connect(cfg *config.Config) (*sql.DB, error) {
	dsn := cfg.DSN()
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database handle: %w", err)
	}

	// Configure connection pooling
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(5 * time.Minute)
	db.SetConnMaxIdleTime(2 * time.Minute)

	// Verify connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping MySQL database (%s): %w", cfg.DBName, err)
	}

	log.Printf(" Successfully connected to MySQL database: %s @ %s:%s", cfg.DBName, cfg.DBHost, cfg.DBPort)
	autoMigrate(db)
	return db, nil
}

func autoMigrate(db *sql.DB) {
	// 1. Add google_id column if not exists
	var count int
	_ = db.QueryRow("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'google_id'").Scan(&count)
	if count == 0 {
		_, err := db.Exec("ALTER TABLE users ADD COLUMN google_id VARCHAR(128) DEFAULT NULL UNIQUE")
		if err != nil {
			log.Printf("⚠️ Warning adding google_id column: %v", err)
		} else {
			log.Printf("✅ Auto-migrated users table: added google_id column")
		}
	}

	// 2. Add auth_provider column if not exists
	count = 0
	_ = db.QueryRow("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'auth_provider'").Scan(&count)
	if count == 0 {
		_, err := db.Exec("ALTER TABLE users ADD COLUMN auth_provider VARCHAR(32) NOT NULL DEFAULT 'local'")
		if err != nil {
			log.Printf("⚠️ Warning adding auth_provider column: %v", err)
		} else {
			log.Printf("✅ Auto-migrated users table: added auth_provider column")
		}
	}

	// 3. Make password_hash nullable for OAuth users
	_, _ = db.Exec("ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) DEFAULT NULL")

	// 4. Ensure password_reset_otps table exists
	_, err := db.Exec(`CREATE TABLE IF NOT EXISTS password_reset_otps (
		id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
		email VARCHAR(191) NOT NULL,
		otp_code VARCHAR(10) NOT NULL,
		expires_at DATETIME NOT NULL,
		is_used BOOLEAN DEFAULT FALSE,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		INDEX idx_otp_email (email),
		INDEX idx_otp_code (otp_code)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`)
	if err != nil {
		log.Printf("⚠️ Warning ensuring password_reset_otps table: %v", err)
	}

	// 5. Ensure job_applications table exists
	_, _ = db.Exec(`CREATE TABLE IF NOT EXISTS job_applications (
		id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
		job_id INT UNSIGNED DEFAULT NULL,
		alumni_id INT UNSIGNED DEFAULT NULL,
		alumni_email VARCHAR(191) DEFAULT NULL,
		job_title VARCHAR(191) DEFAULT NULL,
		company_name VARCHAR(128) DEFAULT NULL,
		applicant_user_id INT UNSIGNED DEFAULT NULL,
		applicant_name VARCHAR(128) NOT NULL,
		applicant_email VARCHAR(191) NOT NULL,
		applicant_phone VARCHAR(20) DEFAULT NULL,
		applicant_degree VARCHAR(128) DEFAULT NULL,
		mcu_batch VARCHAR(64) DEFAULT NULL,
		portfolio_url VARCHAR(512) DEFAULT NULL,
		resume_file_url MEDIUMTEXT DEFAULT NULL,
		resume_file_name VARCHAR(255) DEFAULT NULL,
		cover_note TEXT DEFAULT NULL,
		status VARCHAR(32) NOT NULL DEFAULT 'submitted',
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		INDEX idx_japp_alumni_email (alumni_email),
		INDEX idx_japp_alumni_id (alumni_id),
		INDEX idx_japp_applicant_email (applicant_email)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`)

	checkCol := func(colName, colDef string) {
		var c int
		_ = db.QueryRow("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'job_applications' AND column_name = ?", colName).Scan(&c)
		if c == 0 {
			_, _ = db.Exec(fmt.Sprintf("ALTER TABLE job_applications ADD COLUMN %s %s", colName, colDef))
		}
	}
	checkCol("alumni_id", "INT UNSIGNED DEFAULT NULL")
	checkCol("alumni_email", "VARCHAR(191) DEFAULT NULL")
	checkCol("alumni_name", "VARCHAR(128) DEFAULT NULL")
	checkCol("job_title", "VARCHAR(191) DEFAULT NULL")
	checkCol("company_name", "VARCHAR(128) DEFAULT NULL")
	checkCol("applicant_degree", "VARCHAR(128) DEFAULT NULL")
	checkCol("resume_file_name", "VARCHAR(255) DEFAULT NULL")
	_, _ = db.Exec("ALTER TABLE job_applications DROP FOREIGN KEY fk_japp_job")
	_, _ = db.Exec("ALTER TABLE job_applications MODIFY COLUMN job_id INT UNSIGNED NULL DEFAULT NULL")
	_, _ = db.Exec("ALTER TABLE job_applications ADD CONSTRAINT fk_japp_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL")
	_, _ = db.Exec("ALTER TABLE job_applications MODIFY COLUMN resume_file_url MEDIUMTEXT DEFAULT NULL")
	_, _ = db.Exec("ALTER TABLE job_applications MODIFY COLUMN mcu_batch VARCHAR(64) DEFAULT NULL")
	_, _ = db.Exec("ALTER TABLE job_applications MODIFY COLUMN status VARCHAR(32) NOT NULL DEFAULT 'submitted'")

	// 6. Ensure mentorship_requests table and scheduling columns exist
	_, _ = db.Exec(`CREATE TABLE IF NOT EXISTS mentorship_requests (
		id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
		mentor_alumni_id INT UNSIGNED DEFAULT NULL,
		mentor_email VARCHAR(191) DEFAULT NULL,
		mentor_name VARCHAR(128) DEFAULT NULL,
		mentor_role VARCHAR(128) DEFAULT NULL,
		mentor_company VARCHAR(128) DEFAULT NULL,
		mentee_user_id INT UNSIGNED DEFAULT NULL,
		mentee_name VARCHAR(128) NOT NULL,
		mentee_email VARCHAR(191) NOT NULL,
		mentee_phone VARCHAR(32) DEFAULT NULL,
		mentee_status VARCHAR(64) NOT NULL DEFAULT 'Student',
		topic VARCHAR(191) NOT NULL,
		preferred_time VARCHAR(128) DEFAULT NULL,
		message TEXT NOT NULL,
		status VARCHAR(32) NOT NULL DEFAULT 'pending',
		session_date VARCHAR(64) DEFAULT NULL,
		session_time VARCHAR(64) DEFAULT NULL,
		session_mode VARCHAR(64) DEFAULT NULL,
		meeting_link VARCHAR(512) DEFAULT NULL,
		mentor_note TEXT DEFAULT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		INDEX idx_mreq_mentor_email (mentor_email),
		INDEX idx_mreq_mentee_email (mentee_email)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`)

	checkMentorCol := func(colName, colDef string) {
		var c int
		_ = db.QueryRow("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'mentorship_requests' AND column_name = ?", colName).Scan(&c)
		if c == 0 {
			_, _ = db.Exec(fmt.Sprintf("ALTER TABLE mentorship_requests ADD COLUMN %s %s", colName, colDef))
		}
	}
	checkMentorCol("mentor_email", "VARCHAR(191) DEFAULT NULL")
	checkMentorCol("mentor_name", "VARCHAR(128) DEFAULT NULL")
	checkMentorCol("mentor_role", "VARCHAR(128) DEFAULT NULL")
	checkMentorCol("mentor_company", "VARCHAR(128) DEFAULT NULL")
	checkMentorCol("session_date", "VARCHAR(64) DEFAULT NULL")
	checkMentorCol("session_time", "VARCHAR(64) DEFAULT NULL")
	checkMentorCol("session_mode", "VARCHAR(64) DEFAULT NULL")
	checkMentorCol("meeting_link", "VARCHAR(512) DEFAULT NULL")
	checkMentorCol("mentor_note", "TEXT DEFAULT NULL")

	// Relax any foreign keys on mentorship_requests so both DB and directory mentors work seamlessly
	var fkName string
	_ = db.QueryRow(`
		SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
		WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mentorship_requests'
		  AND COLUMN_NAME = 'mentor_alumni_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1`).Scan(&fkName)
	if fkName != "" {
		_, _ = db.Exec(fmt.Sprintf("ALTER TABLE mentorship_requests DROP FOREIGN KEY %s", fkName))
	}
	_, _ = db.Exec("ALTER TABLE mentorship_requests MODIFY COLUMN mentor_alumni_id INT UNSIGNED NULL DEFAULT NULL")
	_, _ = db.Exec("ALTER TABLE mentorship_requests MODIFY COLUMN status VARCHAR(32) NOT NULL DEFAULT 'pending'")
}
