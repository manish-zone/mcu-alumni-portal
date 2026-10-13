package handlers

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"mcu-alumni-backend/internal/models"

	"github.com/go-chi/chi/v5"
)

type AlumniHandler struct {
	db *sql.DB
}

func NewAlumniHandler(db *sql.DB) *AlumniHandler {
	return &AlumniHandler{db: db}
}

func (h *AlumniHandler) ListAlumni(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	search := strings.TrimSpace(q.Get("search"))
	batchStr := strings.TrimSpace(q.Get("batch"))
	deptStr := strings.TrimSpace(q.Get("department_id"))
	campusStr := strings.TrimSpace(q.Get("campus_id"))
	mentorOnly := q.Get("mentorship") == "true"

	baseQuery := `
		SELECT p.id, p.user_id, p.enrollment_no,
		       COALESCE(p.first_name, '') AS first_name,
		       COALESCE(p.last_name, '') AS last_name,
		       p.hindi_name,
		       u.email,
		       COALESCE(p.batch_year, 2024) AS batch_year,
		       COALESCE(p.degree, 'Graduate Degree') AS degree,
		       COALESCE(p.department_id, 1) AS department_id,
		       COALESCE(d.name, 'Journalism & Mass Comm') AS department_name,
		       COALESCE(p.campus_id, 1) AS campus_id,
		       COALESCE(c.name, 'Bhopal (Main Campus)') AS campus_name,
		       COALESCE(p.current_role, 'Media Professional') AS current_role,
		       COALESCE(p.company, 'MCU Alumnus') AS company,
		       COALESCE(p.location, 'Bhopal, MP') AS location,
		       COALESCE(p.bio, '') AS bio,
		       COALESCE(p.avatar_url, '') AS avatar_url,
		       p.linkedin_url, p.twitter_url, p.portfolio_url, p.open_to_mentor, p.created_at
		FROM alumni_profiles p
		JOIN users u ON p.user_id = u.id
		LEFT JOIN departments d ON p.department_id = d.id
		LEFT JOIN campuses c ON p.campus_id = c.id
		WHERE u.is_active = 1`

	var conditions []string
	var args []interface{}

	if search != "" {
		conditions = append(conditions, "(p.first_name LIKE ? OR p.last_name LIKE ? OR p.company LIKE ? OR p.current_role LIKE ? OR p.location LIKE ? OR p.degree LIKE ?)")
		s := "%" + search + "%"
		args = append(args, s, s, s, s, s, s)
	}

	if batchStr != "" {
		if batch, err := strconv.Atoi(batchStr); err == nil && batch > 0 {
			conditions = append(conditions, "p.batch_year = ?")
			args = append(args, batch)
		}
	}

	if deptStr != "" {
		if deptID, err := strconv.Atoi(deptStr); err == nil && deptID > 0 {
			conditions = append(conditions, "p.department_id = ?")
			args = append(args, deptID)
		}
	}

	if campusStr != "" {
		if campusID, err := strconv.Atoi(campusStr); err == nil && campusID > 0 {
			conditions = append(conditions, "p.campus_id = ?")
			args = append(args, campusID)
		}
	}

	if mentorOnly {
		conditions = append(conditions, "p.open_to_mentor = 1")
	}

	if len(conditions) > 0 {
		baseQuery += " AND " + strings.Join(conditions, " AND ")
	}

	baseQuery += " ORDER BY p.id DESC LIMIT 100"

	rows, err := h.db.Query(baseQuery, args...)
	if err != nil {
		respondError(w, http.StatusInternalServerError, fmt.Sprintf("Query execution failed: %v", err))
		return
	}
	defer rows.Close()

	var list []models.AlumniProfile
	var profileIDs []string

	for rows.Next() {
		var a models.AlumniProfile
		var enrollment, hindiName, linkedin, twitter, portfolio sql.NullString
		var openMentor sql.NullBool
		var deptID, campusID sql.NullInt64
		var batchYear sql.NullInt64
		var firstName, lastName, degree, role, company, loc, bio, avatar sql.NullString

		err := rows.Scan(
			&a.ID, &a.UserID, &enrollment, &firstName, &lastName, &hindiName,
			&a.Email, &batchYear, &degree, &deptID, &a.DepartmentName,
			&campusID, &a.CampusName, &role, &company,
			&loc, &bio, &avatar,
			&linkedin, &twitter, &portfolio, &openMentor, &a.CreatedAt,
		)
		if err != nil {
			log.Printf("⚠️ Error scanning alumni profile row: %v", err)
			continue
		}

		if firstName.Valid {
			a.FirstName = firstName.String
		}
		if lastName.Valid {
			a.LastName = lastName.String
		}
		a.FullName = strings.TrimSpace(a.FirstName + " " + a.LastName)
		if a.FullName == "" {
			a.FullName = a.Email
		}
		a.Name = a.FullName

		if batchYear.Valid && batchYear.Int64 > 0 {
			a.BatchYear = int(batchYear.Int64)
		} else {
			a.BatchYear = 2024
		}
		a.Batch = a.BatchYear

		if degree.Valid && degree.String != "" {
			a.Degree = degree.String
		} else {
			a.Degree = "Graduate Degree"
		}

		if deptID.Valid && deptID.Int64 > 0 {
			a.DepartmentID = uint(deptID.Int64)
		} else {
			a.DepartmentID = 1
		}
		if a.DepartmentName == "" {
			a.DepartmentName = "Journalism & Mass Comm"
		}
		a.Department = a.DepartmentName

		if campusID.Valid && campusID.Int64 > 0 {
			a.CampusID = uint(campusID.Int64)
		} else {
			a.CampusID = 1
		}
		if a.CampusName == "" {
			a.CampusName = "Bhopal (Main Campus)"
		}
		a.Campus = a.CampusName

		if role.Valid && role.String != "" {
			a.CurrentRole = role.String
		} else {
			a.CurrentRole = "Media Professional"
		}
		a.Role = a.CurrentRole

		if company.Valid && company.String != "" {
			a.Company = company.String
		} else {
			a.Company = "MCU Alumnus"
		}

		if loc.Valid && loc.String != "" {
			a.Location = loc.String
		} else {
			a.Location = "Bhopal, MP"
		}

		if bio.Valid {
			a.Bio = bio.String
		}
		if avatar.Valid {
			a.AvatarURL = avatar.String
			a.Avatar = a.AvatarURL
		}

		if enrollment.Valid {
			a.EnrollmentNo = &enrollment.String
		}
		if hindiName.Valid {
			a.HindiName = &hindiName.String
			a.HindiNameAlt = a.HindiName
		}
		if linkedin.Valid {
			a.LinkedInURL = &linkedin.String
			a.LinkedIn = a.LinkedInURL
		}
		if twitter.Valid {
			a.TwitterURL = &twitter.String
		}
		if portfolio.Valid {
			a.PortfolioURL = &portfolio.String
		}
		if openMentor.Valid {
			a.OpenToMentor = openMentor.Bool
			a.OpenMentor = a.OpenToMentor
		}

		a.Skills = []string{}
		list = append(list, a)
		profileIDs = append(profileIDs, strconv.Itoa(int(a.ID)))
	}

	// Fetch skills
	if len(profileIDs) > 0 {
		skillQuery := fmt.Sprintf(`
			SELECT als.alumni_id, s.name
			FROM alumni_skills als
			JOIN skills s ON als.skill_id = s.id
			WHERE als.alumni_id IN (%s)`, strings.Join(profileIDs, ","))

		skillRows, err := h.db.Query(skillQuery)
		if err == nil {
			defer skillRows.Close()
			skillMap := make(map[uint][]string)
			for skillRows.Next() {
				var aID uint
				var sName string
				if err := skillRows.Scan(&aID, &sName); err == nil {
					skillMap[aID] = append(skillMap[aID], sName)
				}
			}
			for i := range list {
				if skills, exists := skillMap[list[i].ID]; exists {
					list[i].Skills = skills
				}
			}
		}
	}

	if list == nil {
		list = []models.AlumniProfile{}
	}
	respondJSON(w, http.StatusOK, list)
}

func (h *AlumniHandler) GetAlumniByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid alumni ID")
		return
	}

	query := `
		SELECT p.id, p.user_id, p.enrollment_no,
		       COALESCE(p.first_name, '') AS first_name,
		       COALESCE(p.last_name, '') AS last_name,
		       p.hindi_name,
		       u.email,
		       COALESCE(p.batch_year, 2024) AS batch_year,
		       COALESCE(p.degree, 'Graduate Degree') AS degree,
		       COALESCE(p.department_id, 1) AS department_id,
		       COALESCE(d.name, 'Journalism & Mass Comm') AS department_name,
		       COALESCE(p.campus_id, 1) AS campus_id,
		       COALESCE(c.name, 'Bhopal (Main Campus)') AS campus_name,
		       COALESCE(p.current_role, 'Media Professional') AS current_role,
		       COALESCE(p.company, 'MCU Alumnus') AS company,
		       COALESCE(p.location, 'Bhopal, MP') AS location,
		       COALESCE(p.bio, '') AS bio,
		       COALESCE(p.avatar_url, '') AS avatar_url,
		       p.linkedin_url, p.twitter_url, p.portfolio_url, p.open_to_mentor, p.created_at
		FROM alumni_profiles p
		JOIN users u ON p.user_id = u.id
		LEFT JOIN departments d ON p.department_id = d.id
		LEFT JOIN campuses c ON p.campus_id = c.id
		WHERE p.id = ? AND u.is_active = 1`

	var a models.AlumniProfile
	var enrollment, hindiName, linkedin, twitter, portfolio sql.NullString
	var openMentor sql.NullBool
	var deptID, campusID sql.NullInt64
	var batchYear sql.NullInt64
	var firstName, lastName, degree, role, company, loc, bio, avatar sql.NullString

	err = h.db.QueryRow(query, id).Scan(
		&a.ID, &a.UserID, &enrollment, &firstName, &lastName, &hindiName,
		&a.Email, &batchYear, &degree, &deptID, &a.DepartmentName,
		&campusID, &a.CampusName, &role, &company,
		&loc, &bio, &avatar,
		&linkedin, &twitter, &portfolio, &openMentor, &a.CreatedAt,
	)
	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Alumni profile not found")
		return
	} else if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error")
		return
	}

	if firstName.Valid {
		a.FirstName = firstName.String
	}
	if lastName.Valid {
		a.LastName = lastName.String
	}
	a.FullName = strings.TrimSpace(a.FirstName + " " + a.LastName)
	if a.FullName == "" {
		a.FullName = a.Email
	}
	a.Name = a.FullName

	if batchYear.Valid && batchYear.Int64 > 0 {
		a.BatchYear = int(batchYear.Int64)
	} else {
		a.BatchYear = 2024
	}
	a.Batch = a.BatchYear

	if degree.Valid && degree.String != "" {
		a.Degree = degree.String
	} else {
		a.Degree = "Graduate Degree"
	}

	if deptID.Valid && deptID.Int64 > 0 {
		a.DepartmentID = uint(deptID.Int64)
	} else {
		a.DepartmentID = 1
	}
	if a.DepartmentName == "" {
		a.DepartmentName = "Journalism & Mass Comm"
	}
	a.Department = a.DepartmentName

	if campusID.Valid && campusID.Int64 > 0 {
		a.CampusID = uint(campusID.Int64)
	} else {
		a.CampusID = 1
	}
	if a.CampusName == "" {
		a.CampusName = "Bhopal (Main Campus)"
	}
	a.Campus = a.CampusName

	if role.Valid && role.String != "" {
		a.CurrentRole = role.String
	} else {
		a.CurrentRole = "Media Professional"
	}
	a.Role = a.CurrentRole

	if company.Valid && company.String != "" {
		a.Company = company.String
	} else {
		a.Company = "MCU Alumnus"
	}

	if loc.Valid && loc.String != "" {
		a.Location = loc.String
	} else {
		a.Location = "Bhopal, MP"
	}

	if bio.Valid {
		a.Bio = bio.String
	}
	if avatar.Valid {
		a.AvatarURL = avatar.String
		a.Avatar = a.AvatarURL
	}

	if enrollment.Valid {
		a.EnrollmentNo = &enrollment.String
	}
	if hindiName.Valid {
		a.HindiName = &hindiName.String
		a.HindiNameAlt = a.HindiName
	}
	if linkedin.Valid {
		a.LinkedInURL = &linkedin.String
		a.LinkedIn = a.LinkedInURL
	}
	if twitter.Valid {
		a.TwitterURL = &twitter.String
	}
	if portfolio.Valid {
		a.PortfolioURL = &portfolio.String
	}
	if openMentor.Valid {
		a.OpenToMentor = openMentor.Bool
		a.OpenMentor = a.OpenToMentor
	}

	// Fetch skills
	a.Skills = []string{}
	sRows, err := h.db.Query(`
		SELECT s.name FROM alumni_skills als
		JOIN skills s ON als.skill_id = s.id
		WHERE als.alumni_id = ?`, a.ID)
	if err == nil {
		defer sRows.Close()
		for sRows.Next() {
			var s string
			if err := sRows.Scan(&s); err == nil {
				a.Skills = append(a.Skills, s)
			}
		}
	}

	respondJSON(w, http.StatusOK, a)
}
