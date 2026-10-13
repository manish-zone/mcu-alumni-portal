package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"mcu-alumni-backend/internal/config"
	"mcu-alumni-backend/internal/middleware"
	"mcu-alumni-backend/internal/models"
	"mcu-alumni-backend/internal/services"

	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	db       *sql.DB
	cfg      *config.Config
	emailSvc *services.EmailService
}

func NewAuthHandler(db *sql.DB, cfg *config.Config) *AuthHandler {
	return &AuthHandler{
		db:       db,
		cfg:      cfg,
		emailSvc: services.NewEmailService(cfg),
	}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON body")
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.FirstName = strings.TrimSpace(req.FirstName)
	req.LastName = strings.TrimSpace(req.LastName)

	if req.FirstName == "" && req.Name != "" {
		parts := strings.SplitN(strings.TrimSpace(req.Name), " ", 2)
		req.FirstName = parts[0]
		if len(parts) > 1 {
			req.LastName = parts[1]
		}
	}
	if req.FirstName == "" {
		req.FirstName = "MCU"
	}
	if req.LastName == "" {
		req.LastName = "Alumnus"
	}

	if req.Email == "" || req.Password == "" {
		respondError(w, http.StatusBadRequest, "Email and password are required")
		return
	}

	if req.Role == "" {
		req.Role = "alumni"
	}

	// Check if email already registered
	var existingID uint
	err := h.db.QueryRow("SELECT id FROM users WHERE email = ?", req.Email).Scan(&existingID)
	if err == nil {
		respondError(w, http.StatusConflict, "Email is already registered. Please login.")
		return
	} else if err != sql.ErrNoRows {
		respondError(w, http.StatusInternalServerError, "Database error verifying email")
		return
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	// Insert into users
	res, err := h.db.Exec(`
		INSERT INTO users (email, password_hash, phone, role, is_verified, is_active)
		VALUES (?, ?, ?, ?, 1, 1)`,
		req.Email, string(hash), req.Phone, req.Role)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create user account")
		return
	}

	userID, _ := res.LastInsertId()

	// Batch year fallback
	batchYear := 2024
	if req.BatchYear != nil {
		batchYear = *req.BatchYear
	} else if req.Batch != nil {
		if b, err := strconv.Atoi(*req.Batch); err == nil && b > 0 {
			batchYear = b
		}
	}

	// Campus fallback
	var campusID uint = 1
	if req.CampusID != nil {
		campusID = *req.CampusID
	} else if req.Campus != nil {
		cName := strings.ToLower(*req.Campus)
		if strings.Contains(cName, "khandwa") {
			campusID = 2
		} else if strings.Contains(cName, "rewa") {
			campusID = 3
		} else if strings.Contains(cName, "datia") {
			campusID = 4
		} else {
			campusID = 1
		}
	}

	degree := "BCA (Bachelor of Computer Applications)"
	if req.Degree != nil && *req.Degree != "" {
		degree = *req.Degree
	}
	var deptID uint = 6
	if req.DepartmentID != nil {
		deptID = *req.DepartmentID
	} else if req.Department != nil {
		dName := strings.ToLower(*req.Department)
		if strings.Contains(dName, "broadcast") || strings.Contains(dName, "electronic") {
			deptID = 2
		} else if strings.Contains(dName, "pr") || strings.Contains(dName, "ad") {
			deptID = 3
		} else if strings.Contains(dName, "new_media") || strings.Contains(dName, "digital") {
			deptID = 4
		} else if strings.Contains(dName, "mgmt") || strings.Contains(dName, "management") {
			deptID = 5
		} else if strings.Contains(dName, "computer") || strings.Contains(dName, "ca") || strings.Contains(dName, "it") {
			deptID = 6
		} else if strings.Contains(dName, "journalism") || strings.Contains(dName, "mass") {
			deptID = 1
		}
	}

	currentRole := "Software Engineer"
	if req.CurrentRole != nil && *req.CurrentRole != "" {
		currentRole = *req.CurrentRole
	} else if req.CurrentRoleCamel != nil && *req.CurrentRoleCamel != "" {
		currentRole = *req.CurrentRoleCamel
	}
	company := "Technology Firm"
	if req.Company != nil && *req.Company != "" {
		company = *req.Company
	}
	location := "Bhopal, MP"
	if req.Location != nil && *req.Location != "" {
		location = *req.Location
	}
	bio := "Proud alumnus of Makhanlal Chaturvedi National University."
	if strings.ToLower(strings.TrimSpace(req.Role)) == "student" {
		bio = "Student at Makhanlal Chaturvedi National University."
	}
	if req.Bio != nil && *req.Bio != "" {
		bio = *req.Bio
	}
	openMentor := true
	if req.OpenToMentor != nil {
		openMentor = *req.OpenToMentor
	} else if req.OpenMentor != nil {
		openMentor = *req.OpenMentor
	}

	var linkedInURL *string
	if req.LinkedInURL != nil && strings.TrimSpace(*req.LinkedInURL) != "" {
		val := strings.TrimSpace(*req.LinkedInURL)
		if !strings.HasPrefix(val, "http://") && !strings.HasPrefix(val, "https://") {
			if strings.Contains(val, "linkedin.com/") {
				val = "https://" + val
			} else {
				val = "https://www.linkedin.com/in/" + strings.TrimPrefix(val, "@")
			}
		}
		linkedInURL = &val
	} else if req.LinkedIn != nil && strings.TrimSpace(*req.LinkedIn) != "" {
		val := strings.TrimSpace(*req.LinkedIn)
		if !strings.HasPrefix(val, "http://") && !strings.HasPrefix(val, "https://") {
			if strings.Contains(val, "linkedin.com/") {
				val = "https://" + val
			} else {
				val = "https://www.linkedin.com/in/" + strings.TrimPrefix(val, "@")
			}
		}
		linkedInURL = &val
	}

	fullName := strings.TrimSpace(req.Name)
	if fullName == "" {
		fullName = strings.TrimSpace(req.FirstName + " " + req.LastName)
	}
	firstName := strings.TrimSpace(req.FirstName)
	lastName := strings.TrimSpace(req.LastName)
	if firstName == "" && lastName == "" && fullName != "" {
		parts := strings.SplitN(fullName, " ", 2)
		firstName = parts[0]
		if len(parts) > 1 {
			lastName = parts[1]
		}
	}
	if firstName == "" {
		firstName = "Alumnus"
	}

	var enrollmentNo *string
	if req.EnrollmentNo != nil && strings.TrimSpace(*req.EnrollmentNo) != "" {
		trimmed := strings.TrimSpace(*req.EnrollmentNo)
		enrollmentNo = &trimmed
	}

	var avatarURL *string
	if req.AvatarURL != nil && strings.TrimSpace(*req.AvatarURL) != "" {
		trimmed := strings.TrimSpace(*req.AvatarURL)
		avatarURL = &trimmed
	} else if req.Avatar != nil && strings.TrimSpace(*req.Avatar) != "" {
		trimmed := strings.TrimSpace(*req.Avatar)
		avatarURL = &trimmed
	}

	pRes, err := h.db.Exec(`
		INSERT INTO alumni_profiles
		(user_id, enrollment_no, first_name, last_name, hindi_name, batch_year, degree, department_id, campus_id, current_role, company, location, bio, avatar_url, linkedin_url, open_to_mentor)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		userID, enrollmentNo, firstName, lastName, req.HindiName, batchYear, degree, deptID, campusID, currentRole, company, location, bio, avatarURL, linkedInURL, openMentor)
	if err != nil {
		log.Printf("⚠️ Warning: Failed to insert alumni_profiles row for user %d: %v", userID, err)
	}

	profileID, _ := pRes.LastInsertId()

	// Default skills
	defaultSkills := []string{"Media & Communication", "Journalism"}
	for _, sk := range defaultSkills {
		var sID uint
		_ = h.db.QueryRow("SELECT id FROM skills WHERE name = ?", sk).Scan(&sID)
		if sID > 0 && profileID > 0 {
			_, _ = h.db.Exec("INSERT IGNORE INTO alumni_skills (alumni_id, skill_id) VALUES (?, ?)", profileID, sID)
		}
	}

	// Generate JWT
	token, err := middleware.GenerateToken(uint(userID), req.Email, req.Role, h.cfg.JWTSecret)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to generate session token")
		return
	}

	fullName = strings.TrimSpace(firstName + " " + lastName)
	var campusName, deptName string
	_ = h.db.QueryRow("SELECT name FROM campuses WHERE id = ?", campusID).Scan(&campusName)
	_ = h.db.QueryRow("SELECT name FROM departments WHERE id = ?", deptID).Scan(&deptName)

	// Determine profile-tailored skills from payload or infer dynamically
	var assignedSkills []string
	if req.Skills != nil && len(*req.Skills) > 0 {
		assignedSkills = *req.Skills
	} else {
		assignedSkills = inferBackendSkills(currentRole, degree, deptName)
	}

	for _, sk := range assignedSkills {
		skClean := strings.TrimSpace(sk)
		if skClean == "" {
			continue
		}
		var sID uint
		_ = h.db.QueryRow("SELECT id FROM skills WHERE name = ?", skClean).Scan(&sID)
		if sID == 0 {
			res, err := h.db.Exec("INSERT IGNORE INTO skills (name) VALUES (?)", skClean)
			if err == nil {
				id, _ := res.LastInsertId()
				sID = uint(id)
			}
			if sID == 0 {
				_ = h.db.QueryRow("SELECT id FROM skills WHERE name = ?", skClean).Scan(&sID)
			}
		}
		if sID > 0 && profileID > 0 {
			_, _ = h.db.Exec("INSERT IGNORE INTO alumni_skills (alumni_id, skill_id) VALUES (?, ?)", profileID, sID)
		}
	}

	fullProfile := models.AlumniProfile{
		ID:             uint(profileID),
		UserID:         uint(userID),
		FirstName:      firstName,
		LastName:       lastName,
		FullName:       fullName,
		Name:           fullName,
		HindiName:      req.HindiName,
		HindiNameAlt:   req.HindiName,
		Email:          req.Email,
		BatchYear:      batchYear,
		Batch:          batchYear,
		Degree:         degree,
		DepartmentID:   deptID,
		DepartmentName: deptName,
		Department:     deptName,
		CampusID:       campusID,
		CampusName:     campusName,
		Campus:         campusName,
		CurrentRole:    currentRole,
		Role:           currentRole,
		Company:        company,
		Location:       location,
		Bio:            bio,
		AvatarURL: func() string {
			if avatarURL != nil {
				return *avatarURL
			}
			return ""
		}(),
		Avatar: func() string {
			if avatarURL != nil {
				return *avatarURL
			}
			return ""
		}(),
		LinkedInURL:  linkedInURL,
		LinkedIn:     linkedInURL,
		OpenToMentor: openMentor,
		OpenMentor:   openMentor,
		Skills:       assignedSkills,
		CreatedAt:    time.Now(),
	}

	respondJSON(w, http.StatusCreated, models.AuthResponse{
		Token: token,
		User: models.UserProfile{
			ID:             uint(userID),
			Email:          req.Email,
			FirstName:      req.FirstName,
			LastName:       req.LastName,
			FullName:       fullName,
			Name:           fullName,
			HindiName:      req.HindiName,
			Role:           req.Role,
			Phone:          req.Phone,
			AvatarURL:      avatarURL,
			Avatar:         avatarURL,
			BatchYear:      &batchYear,
			Batch:          &batchYear,
			Degree:         &degree,
			DepartmentName: &deptName,
			CampusName:     &campusName,
			CurrentRole:    &currentRole,
			Company:        &company,
			Location:       &location,
			OpenToMentor:   openMentor,
			OpenMentor:     openMentor,
			Skills:         assignedSkills,
		},
		Profile: fullProfile,
	})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON body")
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" || req.Password == "" {
		respondError(w, http.StatusBadRequest, "Email and password are required")
		return
	}

	var u models.User
	var phone sql.NullString
	err := h.db.QueryRow(`
		SELECT id, email, password_hash, phone, role, is_verified, is_active
		FROM users WHERE email = ?`, req.Email).
		Scan(&u.ID, &u.Email, &u.PasswordHash, &phone, &u.Role, &u.IsVerified, &u.IsActive)

	if err == sql.ErrNoRows {
		respondError(w, http.StatusUnauthorized, "Invalid email or password")
		return
	} else if err != nil {
		respondError(w, http.StatusInternalServerError, "Database query error")
		return
	}

	if !u.IsActive {
		respondError(w, http.StatusForbidden, "Your account has been deactivated. Please contact administrator.")
		return
	}

	// Compare bcrypt hash
	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(req.Password)); err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	profile := models.UserProfile{
		ID:    u.ID,
		Email: u.Email,
		Role:  u.Role,
	}
	if phone.Valid {
		profile.Phone = &phone.String
	}

	// Fetch profile details
	var firstName, lastName, hindiName sql.NullString
	var batchYear sql.NullInt32
	var degree, currentRole, company, location, avatarURL sql.NullString
	var bio, linkedinURL sql.NullString
	var deptName, campusName sql.NullString
	var openToMentor sql.NullBool

	_ = h.db.QueryRow(`
		SELECT p.first_name, p.last_name, p.hindi_name, p.batch_year, p.degree,
		       p.current_role, p.company, p.location, p.avatar_url, p.bio, p.linkedin_url, p.open_to_mentor,
		       d.name, c.name
		FROM alumni_profiles p
		LEFT JOIN departments d ON p.department_id = d.id
		LEFT JOIN campuses c ON p.campus_id = c.id
		WHERE p.user_id = ? LIMIT 1`, u.ID).
		Scan(&firstName, &lastName, &hindiName, &batchYear, &degree,
			&currentRole, &company, &location, &avatarURL, &bio, &linkedinURL, &openToMentor,
			&deptName, &campusName)

	if firstName.Valid {
		profile.FirstName = firstName.String
	}
	if lastName.Valid {
		profile.LastName = lastName.String
	}
	profile.FullName = strings.TrimSpace(profile.FirstName + " " + profile.LastName)
	if profile.FullName == "" {
		profile.FullName = u.Email
	}
	profile.Name = profile.FullName

	if hindiName.Valid {
		profile.HindiName = &hindiName.String
	}
	if batchYear.Valid {
		b := int(batchYear.Int32)
		profile.BatchYear = &b
		profile.Batch = &b
	}
	if degree.Valid {
		profile.Degree = &degree.String
	}
	if currentRole.Valid {
		profile.CurrentRole = &currentRole.String
	}
	if company.Valid {
		profile.Company = &company.String
	}
	if location.Valid {
		profile.Location = &location.String
	}
	if bio.Valid {
		profile.Bio = &bio.String
	}
	if avatarURL.Valid {
		profile.AvatarURL = &avatarURL.String
		profile.Avatar = &avatarURL.String
	}
	if linkedinURL.Valid {
		profile.LinkedInURL = &linkedinURL.String
		profile.LinkedIn = &linkedinURL.String
	}
	if deptName.Valid {
		profile.DepartmentName = &deptName.String
	}
	if campusName.Valid {
		profile.CampusName = &campusName.String
	}
	if openToMentor.Valid {
		profile.OpenToMentor = openToMentor.Bool
		profile.OpenMentor = openToMentor.Bool
	}

	// Generate JWT
	token, err := middleware.GenerateToken(u.ID, u.Email, u.Role, h.cfg.JWTSecret)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to issue token")
		return
	}

	respondJSON(w, http.StatusOK, models.AuthResponse{
		Token: token,
		User:  profile,
	})
}

func (h *AuthHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	val := r.Context().Value(middleware.UserIDKey)
	if val == nil {
		if strings.Contains(r.Header.Get("Accept"), "text/html") {
			h.GetProfile(w, r)
			return
		}
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	userID := val.(uint)

	var u models.User
	var phone sql.NullString
	err := h.db.QueryRow(`
		SELECT id, email, phone, role, is_verified, is_active
		FROM users WHERE id = ?`, userID).
		Scan(&u.ID, &u.Email, &phone, &u.Role, &u.IsVerified, &u.IsActive)

	if err != nil {
		respondError(w, http.StatusNotFound, "User not found")
		return
	}

	profile := models.UserProfile{
		ID:    u.ID,
		Email: u.Email,
		Role:  u.Role,
	}
	if phone.Valid {
		profile.Phone = &phone.String
	}

	var firstName, lastName, hindiName sql.NullString
	var batchYear sql.NullInt32
	var degree, currentRole, company, location, avatarURL sql.NullString
	var bio, linkedinURL sql.NullString
	var deptName, campusName sql.NullString
	var openToMentor sql.NullBool

	_ = h.db.QueryRow(`
		SELECT p.first_name, p.last_name, p.hindi_name, p.batch_year, p.degree,
		       p.current_role, p.company, p.location, p.avatar_url, p.bio, p.linkedin_url, p.open_to_mentor,
		       COALESCE(d.name, '') AS dept_name, COALESCE(c.name, '') AS campus_name
		FROM alumni_profiles p
		LEFT JOIN departments d ON p.department_id = d.id
		LEFT JOIN campuses c ON p.campus_id = c.id
		WHERE p.user_id = ? LIMIT 1`, u.ID).
		Scan(&firstName, &lastName, &hindiName, &batchYear, &degree,
			&currentRole, &company, &location, &avatarURL, &bio, &linkedinURL, &openToMentor,
			&deptName, &campusName)

	if firstName.Valid {
		profile.FirstName = firstName.String
	}
	if lastName.Valid {
		profile.LastName = lastName.String
	}
	profile.FullName = strings.TrimSpace(profile.FirstName + " " + profile.LastName)
	if profile.FullName == "" {
		profile.FullName = u.Email
	}
	profile.Name = profile.FullName

	if hindiName.Valid {
		profile.HindiName = &hindiName.String
	}
	if batchYear.Valid {
		b := int(batchYear.Int32)
		profile.BatchYear = &b
		profile.Batch = &b
	}
	if degree.Valid {
		profile.Degree = &degree.String
	}
	if currentRole.Valid {
		profile.CurrentRole = &currentRole.String
	}
	if company.Valid {
		profile.Company = &company.String
	}
	if location.Valid {
		profile.Location = &location.String
	}
	if bio.Valid {
		profile.Bio = &bio.String
	}
	if avatarURL.Valid {
		profile.AvatarURL = &avatarURL.String
		profile.Avatar = &avatarURL.String
	}
	if linkedinURL.Valid {
		profile.LinkedInURL = &linkedinURL.String
		profile.LinkedIn = &linkedinURL.String
	}
	if deptName.Valid {
		profile.DepartmentName = &deptName.String
	}
	if campusName.Valid {
		profile.CampusName = &campusName.String
	}
	if openToMentor.Valid {
		profile.OpenToMentor = openToMentor.Bool
		profile.OpenMentor = openToMentor.Bool
	}

	profile.Skills = []string{}
	skillRows, err := h.db.Query(`
		SELECT s.name
		FROM alumni_skills als
		JOIN skills s ON als.skill_id = s.id
		JOIN alumni_profiles p ON als.alumni_id = p.id
		WHERE p.user_id = ?`, userID)
	if err == nil {
		defer skillRows.Close()
		for skillRows.Next() {
			var sName string
			if err := skillRows.Scan(&sName); err == nil {
				profile.Skills = append(profile.Skills, sName)
			}
		}
	}

	respondJSON(w, http.StatusOK, profile)
}

// GetProfile handles GET /api/auth/profile.
// If authenticated via Bearer token or ?token= query param, it returns the logged-in user's profile (same as GetMe).
// If visited directly in the browser without a token, it returns all registered user profiles (or filters by ?email= or ?id=).
func (h *AuthHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	if val := r.Context().Value(middleware.UserIDKey); val != nil {
		h.GetMe(w, r)
		return
	}

	emailFilter := strings.TrimSpace(strings.ToLower(r.URL.Query().Get("email")))
	idFilter := strings.TrimSpace(r.URL.Query().Get("id"))

	query := `
		SELECT u.id, u.email, u.phone, u.role, u.is_verified,
		       p.id AS profile_id, p.enrollment_no, p.first_name, p.last_name, p.hindi_name,
		       p.batch_year, p.degree, p.current_role, p.company, p.location,
		       p.avatar_url, p.bio, p.linkedin_url, p.open_to_mentor,
		       COALESCE(d.name, '') AS dept_name, COALESCE(c.name, '') AS campus_name
		FROM users u
		LEFT JOIN alumni_profiles p ON p.user_id = u.id
		LEFT JOIN departments d ON p.department_id = d.id
		LEFT JOIN campuses c ON p.campus_id = c.id
		WHERE 1=1`
	var args []interface{}
	if emailFilter != "" {
		query += " AND LOWER(u.email) = ?"
		args = append(args, emailFilter)
	}
	if idFilter != "" {
		query += " AND u.id = ?"
		args = append(args, idFilter)
	}
	query += " ORDER BY u.id DESC"

	rows, err := h.db.Query(query, args...)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch profiles")
		return
	}
	defer rows.Close()

	type PublicProfileEntry struct {
		ID             uint     `json:"id"`
		ProfileID      *uint    `json:"profile_id,omitempty"`
		Email          string   `json:"email"`
		EnrollmentNo   *string  `json:"enrollment_no,omitempty"`
		Name           string   `json:"name"`
		FirstName      string   `json:"first_name"`
		LastName       string   `json:"last_name"`
		HindiName      *string  `json:"hindi_name,omitempty"`
		Role           string   `json:"role"`
		MemberCategory string   `json:"member_category"`
		IsVerified     bool     `json:"is_verified"`
		Phone          *string  `json:"phone,omitempty"`
		BatchYear      *int     `json:"batch_year,omitempty"`
		Degree         *string  `json:"degree,omitempty"`
		DepartmentName *string  `json:"department_name,omitempty"`
		CampusName     *string  `json:"campus_name,omitempty"`
		CurrentRole    *string  `json:"current_role,omitempty"`
		Company        *string  `json:"company,omitempty"`
		Location       *string  `json:"location,omitempty"`
		Bio            *string  `json:"bio,omitempty"`
		LinkedInURL    *string  `json:"linkedin_url,omitempty"`
		AvatarURL      *string  `json:"avatar_url,omitempty"`
		OpenToMentor   bool     `json:"open_to_mentor"`
		Skills         []string `json:"skills"`
	}

	currentYear := time.Now().Year()
	profiles := []PublicProfileEntry{}

	for rows.Next() {
		var uID uint
		var email, role string
		var isVerified bool
		var phone sql.NullString
		var profileID sql.NullInt64
		var enrollmentNo, firstName, lastName, hindiName sql.NullString
		var batchYear sql.NullInt32
		var degree, currentRole, company, location, avatarURL, bio, linkedinURL sql.NullString
		var openToMentor sql.NullBool
		var deptName, campusName sql.NullString

		if err := rows.Scan(
			&uID, &email, &phone, &role, &isVerified,
			&profileID, &enrollmentNo, &firstName, &lastName, &hindiName,
			&batchYear, &degree, &currentRole, &company, &location,
			&avatarURL, &bio, &linkedinURL, &openToMentor,
			&deptName, &campusName,
		); err != nil {
			continue
		}

		entry := PublicProfileEntry{
			ID:         uID,
			Email:      email,
			Role:       role,
			IsVerified: isVerified,
			Skills:     []string{},
		}
		if profileID.Valid {
			pid := uint(profileID.Int64)
			entry.ProfileID = &pid
		}
		if phone.Valid && phone.String != "" {
			pStr := phone.String
			entry.Phone = &pStr
		}
		if enrollmentNo.Valid && enrollmentNo.String != "" {
			eStr := enrollmentNo.String
			entry.EnrollmentNo = &eStr
		}
		if firstName.Valid {
			entry.FirstName = firstName.String
		}
		if lastName.Valid {
			entry.LastName = lastName.String
		}
		entry.Name = strings.TrimSpace(entry.FirstName + " " + entry.LastName)
		if entry.Name == "" {
			entry.Name = email
		}
		if hindiName.Valid && hindiName.String != "" {
			hStr := hindiName.String
			entry.HindiName = &hStr
		}
		if batchYear.Valid {
			b := int(batchYear.Int32)
			entry.BatchYear = &b
			if b < currentYear {
				entry.MemberCategory = "Alumnus (Graduate)"
			} else {
				entry.MemberCategory = "Current Student"
			}
		} else {
			entry.MemberCategory = "Alumnus (Graduate)"
		}
		if degree.Valid && degree.String != "" {
			dStr := degree.String
			entry.Degree = &dStr
		}
		if deptName.Valid && deptName.String != "" {
			dnStr := deptName.String
			entry.DepartmentName = &dnStr
		}
		if campusName.Valid && campusName.String != "" {
			cnStr := campusName.String
			entry.CampusName = &cnStr
		}
		if currentRole.Valid && currentRole.String != "" {
			crStr := currentRole.String
			entry.CurrentRole = &crStr
		}
		if company.Valid && company.String != "" {
			coStr := company.String
			entry.Company = &coStr
		}
		if location.Valid && location.String != "" {
			locStr := location.String
			entry.Location = &locStr
		}
		if bio.Valid && bio.String != "" {
			bStr := bio.String
			entry.Bio = &bStr
		}
		if linkedinURL.Valid && linkedinURL.String != "" {
			liStr := linkedinURL.String
			entry.LinkedInURL = &liStr
		}
		if avatarURL.Valid && avatarURL.String != "" {
			avStr := avatarURL.String
			if strings.HasPrefix(avStr, "data:image/") && len(avStr) > 200 {
				avStr = "[Uploaded Base64 Profile Photo]"
			}
			entry.AvatarURL = &avStr
		}
		if openToMentor.Valid {
			entry.OpenToMentor = openToMentor.Bool
		}

		skillRows, sErr := h.db.Query(`
			SELECT s.name
			FROM alumni_skills als
			JOIN skills s ON als.skill_id = s.id
			JOIN alumni_profiles p ON als.alumni_id = p.id
			WHERE p.user_id = ?`, uID)
		if sErr == nil {
			for skillRows.Next() {
				var sName string
				if err := skillRows.Scan(&sName); err == nil {
					entry.Skills = append(entry.Skills, sName)
				}
			}
			skillRows.Close()
		}

		profiles = append(profiles, entry)
	}

	if (emailFilter != "" || idFilter != "") && len(profiles) == 1 {
		respondJSON(w, http.StatusOK, profiles[0])
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status":                    "active",
		"endpoint":                  "/api/auth/profile",
		"supported_methods":         []string{"GET", "PUT"},
		"filter_usage":              "Pass ?email=user@example.com or ?id=1 or Authorization: Bearer <token> for a single profile",
		"total_registered_profiles": len(profiles),
		"profiles":                  profiles,
	})
}

func (h *AuthHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	val := r.Context().Value(middleware.UserIDKey)
	if val == nil {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	userID := val.(uint)

	var req models.UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON body")
		return
	}

	// 1. Update phone in users table if provided
	if req.Phone != nil {
		_, _ = h.db.Exec("UPDATE users SET phone = ? WHERE id = ?", *req.Phone, userID)
	}

	// 2. Ensure an alumni_profiles record exists for this user (handles admin, OAuth, or orphaned accounts)
	var profileCount int
	_ = h.db.QueryRow("SELECT COUNT(*) FROM alumni_profiles WHERE user_id = ?", userID).Scan(&profileCount)
	if profileCount == 0 {
		_, _ = h.db.Exec(`
			INSERT INTO alumni_profiles
			(user_id, first_name, last_name, batch_year, degree, department_id, campus_id, current_role, company, location)
			VALUES (?, 'Alumnus', '', 2024, 'BCA (Bachelor of Computer Applications)', 6, 1, 'Software Engineer', 'MCU Alumnus', 'Bhopal, MP')`, userID)
	}

	// 3. Normalize Names
	var firstName, lastName *string
	if req.FirstName != nil && strings.TrimSpace(*req.FirstName) != "" {
		firstName = req.FirstName
	}
	if req.LastName != nil && strings.TrimSpace(*req.LastName) != "" {
		lastName = req.LastName
	}
	if (firstName == nil || lastName == nil) && req.Name != nil && strings.TrimSpace(*req.Name) != "" {
		parts := strings.SplitN(strings.TrimSpace(*req.Name), " ", 2)
		f := parts[0]
		firstName = &f
		if len(parts) > 1 {
			l := parts[1]
			lastName = &l
		} else {
			empty := ""
			lastName = &empty
		}
	}

	// 3. Normalize Avatar
	var avatarURL *string
	removeAvatar := false
	if (req.RemoveAvatar != nil && *req.RemoveAvatar) || (req.RemoveAvatarCamel != nil && *req.RemoveAvatarCamel) {
		removeAvatar = true
	} else if req.AvatarURL != nil && strings.TrimSpace(*req.AvatarURL) == "" {
		removeAvatar = true
	} else if req.Avatar != nil && strings.TrimSpace(*req.Avatar) == "" {
		removeAvatar = true
	} else if req.AvatarURL != nil && strings.TrimSpace(*req.AvatarURL) != "" {
		avatarURL = req.AvatarURL
	} else if req.Avatar != nil && strings.TrimSpace(*req.Avatar) != "" {
		avatarURL = req.Avatar
	}

	// 4. Normalize Current Role
	var currentRole *string
	if req.CurrentRole != nil && strings.TrimSpace(*req.CurrentRole) != "" {
		currentRole = req.CurrentRole
	} else if req.CurrentRoleCamel != nil && strings.TrimSpace(*req.CurrentRoleCamel) != "" {
		currentRole = req.CurrentRoleCamel
	}

	// 5. Normalize LinkedIn URL
	var linkedInURL *string
	if req.LinkedInURL != nil && strings.TrimSpace(*req.LinkedInURL) != "" {
		val := strings.TrimSpace(*req.LinkedInURL)
		if !strings.HasPrefix(val, "http://") && !strings.HasPrefix(val, "https://") {
			if strings.Contains(val, "linkedin.com/") {
				val = "https://" + val
			} else {
				val = "https://www.linkedin.com/in/" + strings.TrimPrefix(val, "@")
			}
		}
		linkedInURL = &val
	} else if req.LinkedIn != nil && strings.TrimSpace(*req.LinkedIn) != "" {
		val := strings.TrimSpace(*req.LinkedIn)
		if !strings.HasPrefix(val, "http://") && !strings.HasPrefix(val, "https://") {
			if strings.Contains(val, "linkedin.com/") {
				val = "https://" + val
			} else {
				val = "https://www.linkedin.com/in/" + strings.TrimPrefix(val, "@")
			}
		}
		linkedInURL = &val
	}

	// 6. Normalize Batch Year
	var batchYear *int
	if req.BatchYear != nil && *req.BatchYear > 0 {
		batchYear = req.BatchYear
	} else if req.Batch != nil {
		if b, err := strconv.Atoi(strings.TrimSpace(*req.Batch)); err == nil && b > 0 {
			batchYear = &b
		}
	}

	// 7. Normalize Mentorship
	var openMentor *bool
	if req.OpenToMentor != nil {
		openMentor = req.OpenToMentor
	} else if req.OpenMentor != nil {
		openMentor = req.OpenMentor
	}

	// 8. Construct dynamic UPDATE statement for alumni_profiles
	var setClauses []string
	var args []interface{}

	if firstName != nil {
		setClauses = append(setClauses, "first_name = ?")
		args = append(args, *firstName)
	}
	if lastName != nil {
		setClauses = append(setClauses, "last_name = ?")
		args = append(args, *lastName)
	}
	if req.HindiName != nil {
		setClauses = append(setClauses, "hindi_name = ?")
		args = append(args, *req.HindiName)
	}
	if currentRole != nil {
		setClauses = append(setClauses, "current_role = ?")
		args = append(args, *currentRole)
	}
	if req.Company != nil {
		setClauses = append(setClauses, "company = ?")
		args = append(args, *req.Company)
	}
	if req.Location != nil {
		setClauses = append(setClauses, "location = ?")
		args = append(args, *req.Location)
	}
	if req.Bio != nil {
		setClauses = append(setClauses, "bio = ?")
		args = append(args, *req.Bio)
	}
	if removeAvatar {
		setClauses = append(setClauses, "avatar_url = NULL")
	} else if avatarURL != nil {
		setClauses = append(setClauses, "avatar_url = ?")
		args = append(args, *avatarURL)
	}
	if linkedInURL != nil {
		setClauses = append(setClauses, "linkedin_url = ?")
		args = append(args, *linkedInURL)
	}
	if batchYear != nil {
		setClauses = append(setClauses, "batch_year = ?")
		args = append(args, *batchYear)
	}
	if req.Degree != nil {
		setClauses = append(setClauses, "degree = ?")
		args = append(args, *req.Degree)
	}
	if openMentor != nil {
		setClauses = append(setClauses, "open_to_mentor = ?")
		args = append(args, *openMentor)
	}

	if len(setClauses) > 0 {
		query := fmt.Sprintf("UPDATE alumni_profiles SET %s WHERE user_id = ?", strings.Join(setClauses, ", "))
		args = append(args, userID)
		if _, err := h.db.Exec(query, args...); err != nil {
			respondError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to update profile: %v", err))
			return
		}
	}

	// 9. Re-fetch the updated profile and return
	// 9. Update skills in alumni_skills if provided
	if req.Skills != nil {
		var profileID uint
		_ = h.db.QueryRow("SELECT id FROM alumni_profiles WHERE user_id = ?", userID).Scan(&profileID)
		if profileID > 0 {
			_, _ = h.db.Exec("DELETE FROM alumni_skills WHERE alumni_id = ?", profileID)
			for _, sk := range *req.Skills {
				skClean := strings.TrimSpace(sk)
				if skClean == "" {
					continue
				}
				var sID uint
				_ = h.db.QueryRow("SELECT id FROM skills WHERE name = ?", skClean).Scan(&sID)
				if sID == 0 {
					res, err := h.db.Exec("INSERT IGNORE INTO skills (name) VALUES (?)", skClean)
					if err == nil {
						id, _ := res.LastInsertId()
						sID = uint(id)
					}
					if sID == 0 {
						_ = h.db.QueryRow("SELECT id FROM skills WHERE name = ?", skClean).Scan(&sID)
					}
				}
				if sID > 0 {
					_, _ = h.db.Exec("INSERT IGNORE INTO alumni_skills (alumni_id, skill_id) VALUES (?, ?)", profileID, sID)
				}
			}
		}
	}

	// 10. Re-fetch the updated profile and return
	h.GetMe(w, r)
}

func (h *AuthHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req models.ForgotPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON body")
		return
	}

	email := strings.TrimSpace(strings.ToLower(req.Email))
	if email == "" {
		respondError(w, http.StatusBadRequest, "Email is required")
		return
	}

	// 1. Verify that user exists
	var userID uint
	var userName sql.NullString
	err := h.db.QueryRow(`
		SELECT u.id, CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, '')) AS user_name
		FROM users u
		LEFT JOIN alumni_profiles p ON u.id = p.user_id
		WHERE u.email = ? AND u.is_active = 1`, email).Scan(&userID, &userName)
	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "No registered account found with this email address")
		return
	} else if err != nil {
		log.Printf("[FORGOT PASSWORD ERROR] Failed to query user %s: %v", email, err)
		respondError(w, http.StatusInternalServerError, "Database error")
		return
	}

	name := strings.TrimSpace(userName.String)
	if name == "" {
		name = "MCU Alumnus"
	}

	// 2. Generate 6-digit OTP
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	otpCode := fmt.Sprintf("%06d", rng.Intn(1000000))

	// Invalidate previous unused OTPs
	_, _ = h.db.Exec("UPDATE password_reset_otps SET is_used = 1 WHERE email = ? AND is_used = 0", email)

	// Save new OTP with 15 minutes expiry using MySQL NOW() for exact timezone alignment
	_, err = h.db.Exec(`
		INSERT INTO password_reset_otps (email, otp_code, expires_at)
		VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))`, email, otpCode)
	if err != nil {
		respondError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to generate OTP: %v", err))
		return
	}

	// 3. Send real email via SMTP
	if h.emailSvc.IsConfigured() {
		if err := h.emailSvc.SendPasswordResetEmail(email, name, otpCode); err != nil {
			log.Printf("[EMAIL SERVICE ERROR] Failed to send real OTP email to %s: %v", email, err)
			respondError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to deliver verification email to %s: %v. Please check SMTP configuration.", email, err))
			return
		}
		log.Printf("[EMAIL SERVICE] ✅ Real password reset verification code sent to %s", email)
	} else {
		// Log prominently in console if SMTP is not configured
		log.Printf("\n========================================================================")
		log.Printf("[MCU EMAIL SERVICE] ⚠️ SMTP_USER / SMTP_PASS NOT SET IN .ENV")
		log.Printf("Target Email  : %s", email)
		log.Printf("Generated OTP : %s", otpCode)
		log.Printf("Expires In    : 15 minutes")
		log.Printf("NOTE: To deliver real emails, add SMTP_USER & SMTP_PASS in .env")
		log.Printf("========================================================================\n")
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status":     "success",
		"message":    fmt.Sprintf("A 6-digit verification code has been sent to %s. Please check your inbox and spam folder.", email),
		"email":      email,
		"expires_in": "15 minutes",
	})
}

func (h *AuthHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req models.ResetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON body")
		return
	}

	email := strings.TrimSpace(strings.ToLower(req.Email))
	otp := strings.TrimSpace(req.OTP)
	newPassword := strings.TrimSpace(req.NewPassword)

	if email == "" || otp == "" || newPassword == "" {
		respondError(w, http.StatusBadRequest, "Email, OTP code, and new password are required")
		return
	}

	if len(newPassword) < 6 {
		respondError(w, http.StatusBadRequest, "New password must be at least 6 characters")
		return
	}

	// 1. Verify OTP in database
	var otpID uint
	err := h.db.QueryRow(`
		SELECT id FROM password_reset_otps
		WHERE email = ? AND otp_code = ? AND is_used = 0 AND expires_at > NOW()
		ORDER BY id DESC LIMIT 1`, email, otp).Scan(&otpID)

	if err == sql.ErrNoRows {
		respondError(w, http.StatusBadRequest, "Invalid or expired OTP code. Please request a new OTP.")
		return
	} else if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error validating OTP")
		return
	}

	// 2. Hash new password
	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	// 3. Update password in users table
	res, err := h.db.Exec("UPDATE users SET password_hash = ? WHERE email = ?", string(hash), email)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to update password")
		return
	}
	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		respondError(w, http.StatusNotFound, "User account not found")
		return
	}

	// 4. Mark OTP as used
	_, _ = h.db.Exec("UPDATE password_reset_otps SET is_used = 1 WHERE id = ?", otpID)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status":  "success",
		"message": "Password has been successfully reset! You can now sign in with your new password.",
	})
}

func inferBackendSkills(role, degree, dept string) []string {
	combined := strings.ToLower(role + " " + degree + " " + dept)
	if strings.Contains(combined, "software") || strings.Contains(combined, "developer") || strings.Contains(combined, "engineer") || strings.Contains(combined, "computer") || strings.Contains(combined, "mca") || strings.Contains(combined, "bca") || strings.Contains(combined, "tech") {
		return []string{"Full Stack Web Development", "System Architecture", "Cloud & Distributed Systems", "Database Engineering"}
	}
	if strings.Contains(combined, "data") || strings.Contains(combined, "ai") || strings.Contains(combined, "analytics") {
		return []string{"Data Analytics & Modeling", "Machine Learning", "Python & SQL", "Statistical Analysis"}
	}
	if strings.Contains(combined, "anchor") || strings.Contains(combined, "broadcast") || strings.Contains(combined, "television") || strings.Contains(combined, "tv") {
		return []string{"Prime-Time News Anchoring", "Live Field Reporting", "Broadcast Studio Operations", "Video Journalism"}
	}
	if strings.Contains(combined, "pr") || strings.Contains(combined, "public relations") || strings.Contains(combined, "corporate comm") {
		return []string{"Crisis PR & Reputation Management", "Corporate Communications", "Strategic Media Relations", "Press Release Crafting"}
	}
	if strings.Contains(combined, "advertis") || strings.Contains(combined, "brand") || strings.Contains(combined, "marketing") {
		return []string{"Brand Positioning & Identity", "Creative Ad Campaign Strategy", "Digital Performance Marketing", "Media Planning & Buying"}
	}
	if strings.Contains(combined, "film") || strings.Contains(combined, "direction") || strings.Contains(combined, "cinema") {
		return []string{"Film Direction & Screenwriting", "Cinematography & Lighting", "Documentary Filmmaking", "Video Post-Production"}
	}
	if strings.Contains(combined, "radio") || strings.Contains(combined, "sound") || strings.Contains(combined, "podcast") || strings.Contains(combined, "audio") {
		return []string{"Radio Jockeying & Voice Modulation", "Sound Engineering & Mixing", "Podcast Production", "Audio Storytelling"}
	}
	return []string{"Investigative Reporting", "Editorial Direction", "Digital Content Creation", "Fact-Checking & Verification"}
}

func (h *AuthHandler) GoogleAuth(w http.ResponseWriter, r *http.Request) {
	var req models.GoogleAuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	var email, name, givenName, familyName, picture, googleID string

	// 1. Verify Google Credential Token if provided
	if req.Credential != "" {
		tokenInfo, err := verifyGoogleToken(req.Credential)
		if err != nil {
			// If verification failed and we have direct fallback claims, use them (dev mode)
			if req.Email == "" {
				respondError(w, http.StatusUnauthorized, fmt.Sprintf("Google verification failed: %v", err))
				return
			}
			email = strings.TrimSpace(strings.ToLower(req.Email))
			name = strings.TrimSpace(req.Name)
			picture = req.Picture
			googleID = req.GoogleID
		} else {
			email = strings.TrimSpace(strings.ToLower(tokenInfo.Email))
			name = strings.TrimSpace(tokenInfo.Name)
			givenName = strings.TrimSpace(tokenInfo.GivenName)
			familyName = strings.TrimSpace(tokenInfo.FamilyName)
			picture = tokenInfo.Picture
			googleID = tokenInfo.Sub
		}
	} else if req.Email != "" {
		// Dev / test mode 1-click authentication
		email = strings.TrimSpace(strings.ToLower(req.Email))
		name = strings.TrimSpace(req.Name)
		picture = req.Picture
		googleID = req.GoogleID
		if googleID == "" {
			googleID = "dev_google_" + strconv.FormatInt(time.Now().UnixNano(), 10)
		}
	} else {
		respondError(w, http.StatusBadRequest, "Google credential or email is required")
		return
	}

	if email == "" {
		respondError(w, http.StatusBadRequest, "Valid email could not be obtained from Google")
		return
	}

	if name == "" {
		name = strings.Split(email, "@")[0]
	}
	if givenName == "" {
		parts := strings.SplitN(name, " ", 2)
		givenName = parts[0]
		if len(parts) > 1 {
			familyName = parts[1]
		}
	}
	if givenName == "" {
		givenName = "MCU"
	}
	if familyName == "" {
		familyName = "Alumnus"
	}

	// 2. Check if user already exists in database (by google_id or email)
	var u models.User
	var phone sql.NullString
	var existingGoogleID sql.NullString
	err := h.db.QueryRow(`
		SELECT id, email, password_hash, phone, role, is_verified, is_active, google_id
		FROM users
		WHERE (google_id = ? AND google_id != '') OR LOWER(email) = LOWER(?)
		LIMIT 1`, googleID, email).
		Scan(&u.ID, &u.Email, &u.PasswordHash, &phone, &u.Role, &u.IsVerified, &u.IsActive, &existingGoogleID)

	modeClean := strings.ToLower(strings.TrimSpace(req.Mode))
	isSignInOnly := modeClean == "signin" || (modeClean != "signup" && req.Degree == nil && req.BatchYear == nil && req.CurrentRole == nil)

	// Parse academic, career, and contact fields from request
	var phoneVal interface{} = nil
	if req.Phone != nil && strings.TrimSpace(*req.Phone) != "" {
		phoneVal = strings.TrimSpace(*req.Phone)
	}

	batchYear := 2024
	if req.BatchYear != nil && *req.BatchYear > 1980 {
		batchYear = *req.BatchYear
	} else if req.Batch != nil {
		if b, err := strconv.Atoi(*req.Batch); err == nil && b > 1980 {
			batchYear = b
		}
	}

	degree := "BCA (Bachelor of Computer Applications)"
	if req.Degree != nil && strings.TrimSpace(*req.Degree) != "" {
		degree = strings.TrimSpace(*req.Degree)
	}

	var campusID uint = 1
	if req.CampusID != nil && *req.CampusID > 0 {
		campusID = *req.CampusID
	} else if req.Campus != nil {
		cName := strings.ToLower(*req.Campus)
		if strings.Contains(cName, "khandwa") {
			campusID = 2
		} else if strings.Contains(cName, "rewa") {
			campusID = 3
		} else if strings.Contains(cName, "datia") {
			campusID = 4
		} else {
			campusID = 1
		}
	}

	currentRole := "Full Stack Software Engineer"
	if req.CurrentRole != nil && strings.TrimSpace(*req.CurrentRole) != "" {
		currentRole = strings.TrimSpace(*req.CurrentRole)
	}

	company := "Tech & Software Solutions (MCU IT)"
	if req.Company != nil && strings.TrimSpace(*req.Company) != "" {
		company = strings.TrimSpace(*req.Company)
	}

	location := "Bhopal, MP"
	if req.Location != nil && strings.TrimSpace(*req.Location) != "" {
		location = strings.TrimSpace(*req.Location)
	}

	var enrollmentNo *string
	if req.EnrollmentNo != nil && strings.TrimSpace(*req.EnrollmentNo) != "" {
		val := strings.TrimSpace(*req.EnrollmentNo)
		enrollmentNo = &val
	}

	var linkedInURL *string
	if req.LinkedInURL != nil && strings.TrimSpace(*req.LinkedInURL) != "" {
		val := strings.TrimSpace(*req.LinkedInURL)
		linkedInURL = &val
	} else if req.LinkedIn != nil && strings.TrimSpace(*req.LinkedIn) != "" {
		val := strings.TrimSpace(*req.LinkedIn)
		linkedInURL = &val
	}

	requestedRole := strings.ToLower(strings.TrimSpace(req.Role))
	if requestedRole != "student" && requestedRole != "alumni" {
		requestedRole = "alumni"
	}

	openMentor := requestedRole != "student"
	if req.OpenToMentor != nil {
		openMentor = *req.OpenToMentor
	}
	if requestedRole == "student" {
		openMentor = false
	}

	var deptID uint = 6
	if req.DepartmentID != nil && *req.DepartmentID > 0 {
		deptID = *req.DepartmentID
	}

	var userID uint
	effectiveRole := requestedRole
	if err == sql.ErrNoRows {
		// If signing in, do NOT auto-create an account — require prior registration
		if isSignInOnly {
			respondError(w, http.StatusNotFound, fmt.Sprintf("You do not have an account with %s. Please create an account first.", email))
			return
		}

		// 3. Provision NEW user account during explicit registration (signup)
		res, err := h.db.Exec(`
			INSERT INTO users (email, password_hash, phone, role, is_verified, is_active, google_id, auth_provider, last_login)
			VALUES (?, ?, ?, ?, 1, 1, ?, 'google', NOW())`,
			email, "google_oauth:"+googleID, phoneVal, effectiveRole, googleID)
		if err != nil {
			respondError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to create Google user: %v", err))
			return
		}
		newID, _ := res.LastInsertId()
		userID = uint(newID)

		pRes, err := h.db.Exec(`
			INSERT INTO alumni_profiles
			(user_id, enrollment_no, first_name, last_name, batch_year, degree, department_id, campus_id, current_role, company, location, avatar_url, linkedin_url, open_to_mentor)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			userID, enrollmentNo, givenName, familyName, batchYear, degree, deptID, campusID, currentRole, company, location, picture, linkedInURL, openMentor)
		if err != nil {
			log.Printf("⚠️ Warning: Failed to insert alumni_profiles row for Google user %d: %v", userID, err)
		}

		profileID, _ := pRes.LastInsertId()

		// Assign skills
		var assignedSkills []string
		if req.Skills != nil && len(*req.Skills) > 0 {
			assignedSkills = *req.Skills
		} else {
			assignedSkills = inferBackendSkills(currentRole, degree, "")
		}
		for _, sk := range assignedSkills {
			skClean := strings.TrimSpace(sk)
			if skClean == "" {
				continue
			}
			var sID uint
			_ = h.db.QueryRow("SELECT id FROM skills WHERE name = ?", skClean).Scan(&sID)
			if sID == 0 {
				res, err := h.db.Exec("INSERT IGNORE INTO skills (name) VALUES (?)", skClean)
				if err == nil {
					id, _ := res.LastInsertId()
					sID = uint(id)
				}
				if sID == 0 {
					_ = h.db.QueryRow("SELECT id FROM skills WHERE name = ?", skClean).Scan(&sID)
				}
			}
			if sID > 0 && profileID > 0 {
				_, _ = h.db.Exec("INSERT IGNORE INTO alumni_skills (alumni_id, skill_id) VALUES (?, ?)", profileID, sID)
			}
		}
	} else if err != nil {
		respondError(w, http.StatusInternalServerError, "Database query error")
		return
	} else {
		// 4. EXISTING User: Update login timestamp and google_id if not yet linked
		userID = u.ID
		if u.Role != "" {
			effectiveRole = u.Role
		}
		if !u.IsActive {
			respondError(w, http.StatusForbidden, "Your account has been deactivated. Please contact administrator.")
			return
		}

		if !isSignInOnly && req.Role != "" && effectiveRole != "admin" {
			effectiveRole = requestedRole
		}

		_, _ = h.db.Exec(`
			UPDATE users
			SET last_login = NOW(),
			    google_id = COALESCE(NULLIF(google_id, ''), ?),
			    phone = COALESCE(?, phone),
			    role = ?,
			    auth_provider = IF(auth_provider = 'local', 'google', auth_provider)
			WHERE id = ?`, googleID, phoneVal, effectiveRole, userID)

		if isSignInOnly {
			// Only backfill avatar if empty on sign-in; do NOT overwrite existing degree/role/company
			if picture != "" {
				_, _ = h.db.Exec(`
					UPDATE alumni_profiles
					SET avatar_url = COALESCE(NULLIF(avatar_url, ''), ?)
					WHERE user_id = ?`, picture, userID)
			}
		} else {
			// Explicit registration / profile update via Google signup
			_, _ = h.db.Exec(`
				UPDATE alumni_profiles
				SET batch_year = IF(? > 1980, ?, batch_year),
				    degree = IF(? != '', ?, degree),
				    department_id = IF(? > 0, ?, department_id),
				    campus_id = IF(? > 0, ?, campus_id),
				    current_role = IF(? != '', ?, current_role),
				    company = IF(? != '', ?, company),
				    location = IF(? != '', ?, location),
				    avatar_url = IF(? != '', ?, avatar_url),
				    linkedin_url = COALESCE(?, linkedin_url),
				    enrollment_no = COALESCE(?, enrollment_no),
				    open_to_mentor = ?
				WHERE user_id = ?`,
				batchYear, batchYear, degree, degree, deptID, deptID, campusID, campusID, currentRole, currentRole, company, company, location, location, picture, picture, linkedInURL, enrollmentNo, openMentor, userID)

			if req.Skills != nil && len(*req.Skills) > 0 {
				var pID uint
				_ = h.db.QueryRow("SELECT id FROM alumni_profiles WHERE user_id = ?", userID).Scan(&pID)
				if pID > 0 {
					_, _ = h.db.Exec("DELETE FROM alumni_skills WHERE alumni_id = ?", pID)
					for _, sk := range *req.Skills {
						skClean := strings.TrimSpace(sk)
						if skClean == "" {
							continue
						}
						var sID uint
						_ = h.db.QueryRow("SELECT id FROM skills WHERE name = ?", skClean).Scan(&sID)
						if sID == 0 {
							res, err := h.db.Exec("INSERT IGNORE INTO skills (name) VALUES (?)", skClean)
							if err == nil {
								id, _ := res.LastInsertId()
								sID = uint(id)
							}
							if sID == 0 {
								_ = h.db.QueryRow("SELECT id FROM skills WHERE name = ?", skClean).Scan(&sID)
							}
						}
						if sID > 0 {
							_, _ = h.db.Exec("INSERT IGNORE INTO alumni_skills (alumni_id, skill_id) VALUES (?, ?)", pID, sID)
						}
					}
				}
			}
		}
	}

	// 5. Generate MCU JWT session token
	token, err := middleware.GenerateToken(userID, email, effectiveRole, h.cfg.JWTSecret)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to generate session token")
		return
	}

	// 6. Fetch full user & alumni profile to respond
	profile := models.UserProfile{
		ID:    userID,
		Email: email,
		Role:  effectiveRole,
	}

	var pFirstName, pLastName, pHindiName sql.NullString
	var pBatchYear sql.NullInt32
	var pDegree, pCurrentRole, pCompany, pLocation, pAvatarURL sql.NullString
	var pBio, pLinkedinURL sql.NullString
	var pDeptName, pCampusName sql.NullString
	var pOpenMentor sql.NullBool
	var profileRecID uint

	_ = h.db.QueryRow(`
		SELECT p.id, p.first_name, p.last_name, p.hindi_name, p.batch_year, p.degree,
		       p.current_role, p.company, p.location, p.avatar_url, p.bio, p.linkedin_url, p.open_to_mentor,
		       d.name, c.name
		FROM alumni_profiles p
		LEFT JOIN departments d ON p.department_id = d.id
		LEFT JOIN campuses c ON p.campus_id = c.id
		WHERE p.user_id = ? LIMIT 1`, userID).
		Scan(&profileRecID, &pFirstName, &pLastName, &pHindiName, &pBatchYear, &pDegree,
			&pCurrentRole, &pCompany, &pLocation, &pAvatarURL, &pBio, &pLinkedinURL, &pOpenMentor,
			&pDeptName, &pCampusName)

	if pFirstName.Valid {
		profile.FirstName = pFirstName.String
	} else {
		profile.FirstName = givenName
	}
	if pLastName.Valid {
		profile.LastName = pLastName.String
	} else {
		profile.LastName = familyName
	}
	profile.FullName = strings.TrimSpace(profile.FirstName + " " + profile.LastName)
	profile.Name = profile.FullName

	if pHindiName.Valid {
		profile.HindiName = &pHindiName.String
	}
	if pBatchYear.Valid {
		b := int(pBatchYear.Int32)
		profile.BatchYear = &b
		profile.Batch = &b
	}
	if pDegree.Valid {
		profile.Degree = &pDegree.String
	}
	if pCurrentRole.Valid {
		profile.CurrentRole = &pCurrentRole.String
	}
	if pCompany.Valid {
		profile.Company = &pCompany.String
	}
	if pLocation.Valid {
		profile.Location = &pLocation.String
	}
	if pBio.Valid {
		profile.Bio = &pBio.String
	}
	if pAvatarURL.Valid && pAvatarURL.String != "" {
		profile.AvatarURL = &pAvatarURL.String
		profile.Avatar = &pAvatarURL.String
	} else if picture != "" {
		profile.AvatarURL = &picture
		profile.Avatar = &picture
	}
	if pDeptName.Valid {
		profile.DepartmentName = &pDeptName.String
	}
	if pCampusName.Valid {
		profile.CampusName = &pCampusName.String
	}
	if pOpenMentor.Valid {
		profile.OpenToMentor = pOpenMentor.Bool
		profile.OpenMentor = pOpenMentor.Bool
	} else {
		profile.OpenToMentor = true
		profile.OpenMentor = true
	}

	// Fetch skills from database
	profile.Skills = []string{}
	if profileRecID > 0 {
		rows, err := h.db.Query(`
			SELECT s.name
			FROM alumni_skills als
			JOIN skills s ON als.skill_id = s.id
			WHERE als.alumni_id = ?`, profileRecID)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var sName string
				if err := rows.Scan(&sName); err == nil {
					profile.Skills = append(profile.Skills, sName)
				}
			}
		}
	}

	fullProfile := models.AlumniProfile{
		ID:           profileRecID,
		UserID:       userID,
		FirstName:    profile.FirstName,
		LastName:     profile.LastName,
		FullName:     profile.FullName,
		Name:         profile.FullName,
		HindiName:    profile.HindiName,
		HindiNameAlt: profile.HindiName,
		Email:        profile.Email,
		BatchYear:    batchYear,
		Batch:        batchYear,
		DepartmentID: deptID,
		DepartmentName: func() string {
			if profile.DepartmentName != nil {
				return *profile.DepartmentName
			}
			return "Journalism & Mass Comm"
		}(),
		Department: func() string {
			if profile.DepartmentName != nil {
				return *profile.DepartmentName
			}
			return "Journalism & Mass Comm"
		}(),
		CampusID: campusID,
		CampusName: func() string {
			if profile.CampusName != nil {
				return *profile.CampusName
			}
			return "Bhopal (Main Campus)"
		}(),
		Campus: func() string {
			if profile.CampusName != nil {
				return *profile.CampusName
			}
			return "Bhopal (Main Campus)"
		}(),
		Degree: func() string {
			if profile.Degree != nil {
				return *profile.Degree
			}
			return degree
		}(),
		CurrentRole: func() string {
			if profile.CurrentRole != nil {
				return *profile.CurrentRole
			}
			return currentRole
		}(),
		Role: func() string {
			if profile.CurrentRole != nil {
				return *profile.CurrentRole
			}
			return currentRole
		}(),
		Company: func() string {
			if profile.Company != nil {
				return *profile.Company
			}
			return company
		}(),
		Location: func() string {
			if profile.Location != nil {
				return *profile.Location
			}
			return location
		}(),
		AvatarURL: func() string {
			if profile.AvatarURL != nil {
				return *profile.AvatarURL
			}
			return picture
		}(),
		Avatar: func() string {
			if profile.Avatar != nil {
				return *profile.Avatar
			}
			return picture
		}(),
		EnrollmentNo: enrollmentNo,
		LinkedInURL:  linkedInURL,
		LinkedIn:     linkedInURL,
		OpenToMentor: profile.OpenToMentor,
		OpenMentor:   profile.OpenMentor,
		Skills:       profile.Skills,
		CreatedAt:    time.Now(),
	}

	respondJSON(w, http.StatusOK, models.AuthResponse{
		Token:   token,
		User:    profile,
		Profile: fullProfile,
	})
}

func verifyGoogleToken(token string) (*models.GoogleTokenInfo, error) {
	client := &http.Client{Timeout: 8 * time.Second}

	endpoint := "https://oauth2.googleapis.com/tokeninfo?id_token="
	if !strings.Contains(token, ".") {
		endpoint = "https://oauth2.googleapis.com/tokeninfo?access_token="
	}

	resp, err := client.Get(endpoint + url.QueryEscape(token))
	if err != nil {
		return nil, fmt.Errorf("network error verifying Google token: %w", err)
	}
	defer resp.Body.Close()

	var tokenInfo models.GoogleTokenInfo
	if err := json.NewDecoder(resp.Body).Decode(&tokenInfo); err != nil {
		return nil, fmt.Errorf("failed to decode Google token response: %w", err)
	}

	if tokenInfo.Error != "" {
		return nil, fmt.Errorf("google token rejected: %s (%s)", tokenInfo.Error, tokenInfo.ErrorDesc)
	}

	if tokenInfo.EmailVerified != "" && tokenInfo.EmailVerified != "true" && tokenInfo.EmailVerified != "1" {
		return nil, fmt.Errorf("google email is not verified")
	}

	return &tokenInfo, nil
}

// GoogleCallback handles standard OAuth2 redirect and POST callbacks:
// URL: http://localhost:8080/api/auth/google/callback
func (h *AuthHandler) GoogleCallback(w http.ResponseWriter, r *http.Request) {
	frontendOrigin := h.cfg.FrontendOrigin
	if frontendOrigin == "" {
		frontendOrigin = "http://localhost:5173"
	}

	// 1. Check if error was returned by Google OAuth
	if errParam := r.URL.Query().Get("error"); errParam != "" {
		http.Redirect(w, r, fmt.Sprintf("%s/?auth_error=%s", frontendOrigin, url.QueryEscape(errParam)), http.StatusTemporaryRedirect)
		return
	}

	var credential, code string

	if r.Method == http.MethodPost {
		_ = r.ParseForm()
		credential = r.FormValue("credential")
		code = r.FormValue("code")
	} else {
		credential = r.URL.Query().Get("credential")
		code = r.URL.Query().Get("code")
	}

	var email, name, picture, googleID string

	// 2. If ID Token / Credential was provided
	if credential != "" {
		tokenInfo, err := verifyGoogleToken(credential)
		if err == nil && tokenInfo != nil {
			email = strings.TrimSpace(strings.ToLower(tokenInfo.Email))
			name = strings.TrimSpace(tokenInfo.Name)
			picture = tokenInfo.Picture
			googleID = tokenInfo.Sub
		}
	}

	// 3. If standard OAuth authorization code was provided
	if email == "" && code != "" && h.cfg.GoogleClientID != "" && h.cfg.GoogleClientSecret != "" {
		callbackURL := fmt.Sprintf("http://localhost:%s/api/auth/google/callback", h.cfg.Port)
		tokenResp, err := http.PostForm("https://oauth2.googleapis.com/token", url.Values{
			"code":          {code},
			"client_id":     {h.cfg.GoogleClientID},
			"client_secret": {h.cfg.GoogleClientSecret},
			"redirect_uri":  {callbackURL},
			"grant_type":    {"authorization_code"},
		})
		if err == nil {
			defer tokenResp.Body.Close()
			var tokenData struct {
				IDToken     string `json:"id_token"`
				AccessToken string `json:"access_token"`
			}
			if err := json.NewDecoder(tokenResp.Body).Decode(&tokenData); err == nil && tokenData.IDToken != "" {
				tokenInfo, err := verifyGoogleToken(tokenData.IDToken)
				if err == nil && tokenInfo != nil {
					email = strings.TrimSpace(strings.ToLower(tokenInfo.Email))
					name = strings.TrimSpace(tokenInfo.Name)
					picture = tokenInfo.Picture
					googleID = tokenInfo.Sub
				}
			}
		}
	}

	// 4. If we successfully extracted user info, authenticate or provision
	if email != "" {
		var u models.User
		var phone, existingGoogleID sql.NullString
		err := h.db.QueryRow(`
			SELECT id, email, password_hash, phone, role, is_verified, is_active, google_id
			FROM users WHERE google_id = ? OR email = ? LIMIT 1`, googleID, email).
			Scan(&u.ID, &u.Email, &u.PasswordHash, &phone, &u.Role, &u.IsVerified, &u.IsActive, &existingGoogleID)

		var userID uint
		if err == sql.ErrNoRows {
			// Auto-provision
			res, err := h.db.Exec(`
				INSERT INTO users (email, password_hash, role, is_verified, is_active, google_id, auth_provider, created_at, last_login)
				VALUES (?, NULL, 'alumni', 1, 1, ?, 'google', NOW(), NOW())`,
				email, googleID)
			if err == nil {
				id, _ := res.LastInsertId()
				userID = uint(id)

				parts := strings.SplitN(name, " ", 2)
				firstName := parts[0]
				lastName := ""
				if len(parts) > 1 {
					lastName = parts[1]
				}

				_, _ = h.db.Exec(`
					INSERT INTO alumni_profiles (user_id, first_name, last_name, batch_year, degree, current_role, company, location, avatar_url, open_to_mentor, created_at)
					VALUES (?, ?, ?, 2024, 'Mass Communication', 'Media Professional', 'MCU Alumnus', 'Bhopal, MP', ?, 1, NOW())`,
					userID, firstName, lastName, picture)
			}
		} else if err == nil {
			userID = u.ID
			_, _ = h.db.Exec(`
				UPDATE users
				SET last_login = NOW(),
				    google_id = COALESCE(google_id, ?),
				    auth_provider = IF(auth_provider = 'local', 'google', auth_provider)
				WHERE id = ?`, googleID, userID)
		}

		if userID > 0 {
			token, err := middleware.GenerateToken(userID, email, "alumni", h.cfg.JWTSecret)
			if err == nil && token != "" {
				http.Redirect(w, r, fmt.Sprintf("%s/?auth_token=%s", frontendOrigin, token), http.StatusTemporaryRedirect)
				return
			}
		}
	}

	// Fallback response if accessed directly or waiting for config
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>MCU Alumni Portal - Google OAuth Callback</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 50px 20px; background: #f8fafc; color: #1e293b; }
    .card { max-width: 520px; margin: 0 auto; background: #fff; padding: 36px 28px; border-radius: 16px; border: 2px solid #003366; box-shadow: 0 10px 25px rgba(0,0,0,0.08); }
    h2 { color: #003366; margin-top: 0; }
    code { background: #e2e8f0; padding: 4px 8px; border-radius: 6px; font-size: 13px; color: #003366; word-break: break-all; }
    .btn { display: inline-block; margin-top: 24px; padding: 12px 24px; background: #fc4a00; color: #fff; text-decoration: none; border-radius: 10px; font-weight: bold; }
    .btn:hover { background: #e04200; }
  </style>
</head>
<body>
  <div class="card">
    <h2>MCU Alumni Portal</h2>
    <p><strong>Google OAuth Callback Endpoint is Active & Ready</strong></p>
    <p>Callback URL:<br><code>http://localhost:%s/api/auth/google/callback</code></p>
    <a href="%s" class="btn">Return to Alumni Portal</a>
  </div>
</body>
</html>`, h.cfg.Port, frontendOrigin)
}
