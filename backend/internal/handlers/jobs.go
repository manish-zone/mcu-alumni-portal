package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"mcu-alumni-backend/internal/middleware"
	"mcu-alumni-backend/internal/models"
	"mcu-alumni-backend/internal/services"

	"github.com/go-chi/chi/v5"
)

type JobHandler struct {
	db       *sql.DB
	emailSvc *services.EmailService
}

func NewJobHandler(db *sql.DB, emailSvc *services.EmailService) *JobHandler {
	return &JobHandler{db: db, emailSvc: emailSvc}
}

func (h *JobHandler) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	jobType := strings.TrimSpace(q.Get("job_type"))
	search := strings.TrimSpace(q.Get("search"))

	query := `
		SELECT j.id, j.posted_by_user_id, j.title, j.company_name, j.company_logo_url,
		       j.location, j.job_type, j.experience_required, j.salary_range, j.deadline_date,
		       j.description, j.referral_alumnus_name, j.referral_role, j.status, j.created_at,
		       u.email
		FROM jobs j
		LEFT JOIN users u ON j.posted_by_user_id = u.id
		WHERE j.status = 'active'`

	var conditions []string
	var args []interface{}

	if jobType != "" && jobType != "all" {
		conditions = append(conditions, "j.job_type = ?")
		args = append(args, jobType)
	}

	if search != "" {
		conditions = append(conditions, "(j.title LIKE ? OR j.company_name LIKE ? OR j.location LIKE ?)")
		s := "%" + search + "%"
		args = append(args, s, s, s)
	}

	if len(conditions) > 0 {
		query += " AND " + strings.Join(conditions, " AND ")
	}

	query += " ORDER BY j.created_at DESC LIMIT 50"

	rows, err := h.db.Query(query, args...)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to query jobs")
		return
	}
	defer rows.Close()

	var list []models.Job
	for rows.Next() {
		var j models.Job
		var uid sql.NullInt32
		var logo, exp, sal, deadline, refName, refRole, pEmail sql.NullString

		err := rows.Scan(
			&j.ID, &uid, &j.Title, &j.CompanyName, &logo,
			&j.Location, &j.JobType, &exp, &sal, &deadline,
			&j.Description, &refName, &refRole, &j.Status, &j.CreatedAt,
			&pEmail,
		)
		if err != nil {
			continue
		}

		if uid.Valid {
			u := uint(uid.Int32)
			j.PostedByUserID = &u
		}
		if pEmail.Valid && pEmail.String != "" {
			j.PostedByEmail = &pEmail.String
		}
		if logo.Valid {
			j.CompanyLogoURL = &logo.String
		}
		if exp.Valid {
			j.ExperienceRequired = &exp.String
		}
		if sal.Valid {
			j.SalaryRange = &sal.String
		}
		if deadline.Valid {
			j.DeadlineDate = &deadline.String
		}
		if refName.Valid {
			j.ReferralAlumnusName = &refName.String
		}
		if refRole.Valid {
			j.ReferralRole = &refRole.String
		}

		list = append(list, j)
	}

	if list == nil {
		list = []models.Job{}
	}
	respondJSON(w, http.StatusOK, list)
}

func (h *JobHandler) Create(w http.ResponseWriter, r *http.Request) {
	var userID *uint
	val := r.Context().Value(middleware.UserIDKey)
	if val != nil {
		u := val.(uint)
		userID = &u
	}

	var req struct {
		models.Job
		AuthorEmail string `json:"author_email"`
		UserEmail   string `json:"user_email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON body")
		return
	}
	j := req.Job

	if j.Title == "" || j.CompanyName == "" || j.Description == "" {
		respondError(w, http.StatusBadRequest, "Title, company name, and description are required")
		return
	}

	if userID == nil && j.PostedByUserID != nil {
		userID = j.PostedByUserID
	}
	if userID == nil {
		em := strings.TrimSpace(req.AuthorEmail)
		if em == "" {
			em = strings.TrimSpace(req.UserEmail)
		}
		if em != "" {
			var uid uint
			_ = h.db.QueryRow(`SELECT id FROM users WHERE email = ?`, em).Scan(&uid)
			if uid > 0 {
				userID = &uid
			}
		}
	}

	if j.JobType == "" {
		j.JobType = "Full-time"
	}
	if j.Location == "" {
		j.Location = "Bhopal / Hybrid"
	}

	res, err := h.db.Exec(`
		INSERT INTO jobs (posted_by_user_id, title, company_name, company_logo_url, location, job_type, experience_required, salary_range, deadline_date, description, referral_alumnus_name, referral_role, status)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
		userID, j.Title, j.CompanyName, j.CompanyLogoURL, j.Location, j.JobType, j.ExperienceRequired, j.SalaryRange, j.DeadlineDate, j.Description, j.ReferralAlumnusName, j.ReferralRole)

	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to post job opening")
		return
	}

	newID, _ := res.LastInsertId()
	j.ID = uint(newID)
	j.PostedByUserID = userID
	j.Status = "active"

	respondJSON(w, http.StatusCreated, j)
}

func (h *JobHandler) Delete(w http.ResponseWriter, r *http.Request) {
	jobIDStr := chi.URLParam(r, "id")
	jobID, err := strconv.Atoi(jobIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid job ID")
		return
	}

	val := r.Context().Value(middleware.UserIDKey)
	var currentUID *uint
	var userEmail string
	if val != nil {
		u := val.(uint)
		currentUID = &u
		_ = h.db.QueryRow(`SELECT email FROM users WHERE id = ?`, u).Scan(&userEmail)
	}

	requesterEmail := strings.TrimSpace(r.URL.Query().Get("requester_email"))
	if requesterEmail == "" {
		requesterEmail = userEmail
	}

	// 1. Inspect the job from the DB to verify ownership
	var postedByUID sql.NullInt64
	var refName sql.NullString
	err = h.db.QueryRow(`SELECT posted_by_user_id, referral_alumnus_name FROM jobs WHERE id = ?`, jobID).Scan(&postedByUID, &refName)
	if err != nil {
		if err == sql.ErrNoRows {
			respondError(w, http.StatusNotFound, "Job opening not found")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to inspect job")
		return
	}

	// 2. Strict ownership validation: Only the user who created it can delete it!
	isAuthorized := false
	if currentUID != nil && postedByUID.Valid && uint(postedByUID.Int64) == *currentUID {
		isAuthorized = true
	} else if requesterEmail != "" && postedByUID.Valid {
		var authorEmail string
		_ = h.db.QueryRow(`SELECT email FROM users WHERE id = ?`, postedByUID.Int64).Scan(&authorEmail)
		if authorEmail != "" && strings.EqualFold(authorEmail, requesterEmail) {
			isAuthorized = true
		}
	}

	if !isAuthorized {
		respondError(w, http.StatusForbidden, "Unauthorized: Only the alumnus who posted this job opportunity can delete it.")
		return
	}

	_, err = h.db.Exec(`DELETE FROM jobs WHERE id = ?`, jobID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to delete job")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Job opening deleted successfully by author",
		"id":      jobID,
	})
}

type JobApplicationRequest struct {
	JobID           interface{} `json:"job_id"`
	AlumniID        *uint       `json:"alumni_id,omitempty"`
	AlumniEmail     string      `json:"alumni_email,omitempty"`
	AlumniName      string      `json:"alumni_name,omitempty"`
	JobTitle        string      `json:"job_title"`
	CompanyName     string      `json:"company_name"`
	ApplicantName   string      `json:"applicant_name"`
	ApplicantEmail  string      `json:"applicant_email"`
	ApplicantPhone  interface{} `json:"applicant_phone,omitempty"`
	ApplicantDegree string      `json:"applicant_degree,omitempty"`
	MCUBatch        interface{} `json:"mcu_batch,omitempty"`
	PortfolioURL    string      `json:"portfolio_url,omitempty"`
	ResumeFileURL   string      `json:"resume_file_url,omitempty"`
	ResumeFileName  string      `json:"resume_file_name,omitempty"`
	CoverNote       string      `json:"cover_note,omitempty"`
}

type JobApplicationResponse struct {
	ID              uint      `json:"id"`
	JobID           *uint     `json:"job_id,omitempty"`
	AlumniID        *uint     `json:"alumni_id,omitempty"`
	AlumniEmail     string    `json:"alumni_email"`
	AlumniName      string    `json:"alumni_name,omitempty"`
	JobTitle        string    `json:"job_title"`
	CompanyName     string    `json:"company_name"`
	ApplicantUserID *uint     `json:"applicant_user_id,omitempty"`
	ApplicantName   string    `json:"applicant_name"`
	ApplicantEmail  string    `json:"applicant_email"`
	ApplicantPhone  string    `json:"applicant_phone"`
	ApplicantDegree string    `json:"applicant_degree"`
	MCUBatch        string    `json:"mcu_batch"`
	PortfolioURL    string    `json:"portfolio_url"`
	ResumeFileURL   string    `json:"resume_file_url"`
	ResumeFileName  string    `json:"resume_file_name"`
	CoverNote       string    `json:"cover_note"`
	Status          string    `json:"status"`
	AppliedAt       time.Time `json:"applied_at"`
}

func (h *JobHandler) ApplyJob(w http.ResponseWriter, r *http.Request) {
	var req JobApplicationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if req.ApplicantName == "" || req.ApplicantEmail == "" {
		respondError(w, http.StatusBadRequest, "Applicant name and email are required")
		return
	}

	var applicantUID *uint
	val := r.Context().Value(middleware.UserIDKey)
	if val != nil {
		u := val.(uint)
		applicantUID = &u
	}

	var jobIDPtr *uint
	if req.JobID != nil {
		switch v := req.JobID.(type) {
		case float64:
			u := uint(v)
			jobIDPtr = &u
		case int:
			u := uint(v)
			jobIDPtr = &u
		case string:
			cleanStr := strings.TrimPrefix(v, "db-job-")
			cleanStr = strings.TrimPrefix(cleanStr, "custom-job-")
			cleanStr = strings.TrimPrefix(cleanStr, "job-")
			if idInt, err := strconv.Atoi(cleanStr); err == nil && idInt > 0 {
				u := uint(idInt)
				jobIDPtr = &u
			}
		}
	}

	// Verify that jobIDPtr exists in jobs table; if not, link by title or set to nil
	if jobIDPtr != nil {
		var existsID uint
		if err := h.db.QueryRow(`SELECT id FROM jobs WHERE id = ?`, *jobIDPtr).Scan(&existsID); err != nil {
			var foundID uint
			if err := h.db.QueryRow(`SELECT id FROM jobs WHERE title = ? LIMIT 1`, req.JobTitle).Scan(&foundID); err == nil && foundID > 0 {
				jobIDPtr = &foundID
			} else {
				jobIDPtr = nil
			}
		}
	} else if req.JobTitle != "" {
		var foundID uint
		if err := h.db.QueryRow(`SELECT id FROM jobs WHERE title = ? LIMIT 1`, req.JobTitle).Scan(&foundID); err == nil && foundID > 0 {
			jobIDPtr = &foundID
		}
	}

	if req.CompanyName == "" {
		req.CompanyName = "MCU Placement / Referral"
	}

	alumniEmail := strings.TrimSpace(req.AlumniEmail)
	alumniName := strings.TrimSpace(req.AlumniName)

	// If alumni email not explicitly passed, try to look it up from job
	if alumniEmail == "" && jobIDPtr != nil {
		var posterUID sql.NullInt64
		var refName sql.NullString
		_ = h.db.QueryRow(`SELECT posted_by_user_id, referral_alumnus_name FROM jobs WHERE id = ?`, *jobIDPtr).Scan(&posterUID, &refName)
		if posterUID.Valid {
			_ = h.db.QueryRow(`SELECT email FROM users WHERE id = ?`, posterUID.Int64).Scan(&alumniEmail)
		}
		if alumniName == "" && refName.Valid {
			alumniName = refName.String
		}
	}

	// Try looking up by alumniName in alumni_profiles / users
	if alumniEmail == "" && alumniName != "" {
		cleanName := strings.TrimSpace(strings.Split(alumniName, "(")[0])
		if cleanName != "" {
			_ = h.db.QueryRow(`
				SELECT u.email FROM alumni_profiles p
				JOIN users u ON p.user_id = u.id
				WHERE CONCAT(p.first_name, ' ', p.last_name) LIKE ? OR p.first_name LIKE ?
				LIMIT 1`, "%"+cleanName+"%", "%"+cleanName+"%").Scan(&alumniEmail)
		}
	}

	// Determine real delivery email target:
	// If alumni email is empty or a dummy mock domain, route to active tester / alumnus email
	deliveryEmail := alumniEmail
	isMockSeedEmail := deliveryEmail == "" ||
		strings.HasSuffix(deliveryEmail, "@example.com") ||
		strings.HasSuffix(deliveryEmail, "@indianexpress.com") ||
		strings.HasSuffix(deliveryEmail, "@indiatvnews.com") ||
		strings.HasSuffix(deliveryEmail, "@ogilvy.com") ||
		strings.HasSuffix(deliveryEmail, "@sony.com")

	if isMockSeedEmail {
		if smtpUser := strings.TrimSpace(os.Getenv("SMTP_USER")); smtpUser != "" {
			deliveryEmail = smtpUser
		}
		alumniEmail = deliveryEmail
	}
	if alumniEmail == "" {
		alumniEmail = deliveryEmail
	}

	if (req.AlumniID == nil || *req.AlumniID == 0) && alumniEmail != "" {
		var uid uint
		if err := h.db.QueryRow(`SELECT id FROM users WHERE email = ?`, alumniEmail).Scan(&uid); err == nil && uid > 0 {
			req.AlumniID = &uid
		}
	}

	phoneStr := ""
	if req.ApplicantPhone != nil {
		phoneStr = strings.TrimSpace(fmt.Sprintf("%v", req.ApplicantPhone))
	}
	batchStr := ""
	if req.MCUBatch != nil {
		batchStr = strings.TrimSpace(fmt.Sprintf("%v", req.MCUBatch))
	}

	// Debounce check: Prevent duplicate submissions within last 30 seconds
	var existingAppID uint
	_ = h.db.QueryRow(`
		SELECT id FROM job_applications
		WHERE applicant_email = ?
		  AND job_title = ?
		  AND (alumni_email = ? OR alumni_id = ?)
		  AND applied_at >= DATE_SUB(NOW(), INTERVAL 30 SECOND)
		ORDER BY id DESC LIMIT 1`,
		req.ApplicantEmail, req.JobTitle, alumniEmail, req.AlumniID,
	).Scan(&existingAppID)

	if existingAppID > 0 {
		log.Printf("ℹ️ Debounced duplicate application submission (id: %d) from %s for %s", existingAppID, req.ApplicantEmail, req.JobTitle)
		respondJSON(w, http.StatusOK, map[string]interface{}{
			"success":      true,
			"id":           existingAppID,
			"message":      "Application already submitted successfully",
			"alumni_email": alumniEmail,
		})
		return
	}

	res, err := h.db.Exec(`
		INSERT INTO job_applications (
			job_id, alumni_id, alumni_email, alumni_name, job_title, company_name,
			applicant_user_id, applicant_name, applicant_email, applicant_phone, applicant_degree,
			mcu_batch, portfolio_url, resume_file_url, resume_file_name, cover_note, status
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted')`,
		jobIDPtr, req.AlumniID, alumniEmail, alumniName, req.JobTitle, req.CompanyName,
		applicantUID, req.ApplicantName, req.ApplicantEmail, phoneStr, req.ApplicantDegree,
		batchStr, req.PortfolioURL, req.ResumeFileURL, req.ResumeFileName, req.CoverNote,
	)

	if err != nil {
		log.Printf("❌ Application insert error: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to submit job referral application")
		return
	}

	appID, _ := res.LastInsertId()

	// Dispatch email notification to alumnus asynchronously
	if h.emailSvc != nil && deliveryEmail != "" {
		go func(to, name, title, comp, sName, sEmail, sPhone, sDeg, sBatch, port, resName, note string) {
			err := h.emailSvc.SendJobApplicationNotification(
				to, name, title, comp,
				sName, sEmail, sPhone, sDeg, sBatch,
				port, resName, note,
			)
			if err != nil {
				log.Printf("⚠️ Job application email notification failed to %s: %v", to, err)
			} else {
				log.Printf("✅ Referral application notification sent to %s for %s (%s)", to, title, comp)
			}
		}(deliveryEmail, alumniName, req.JobTitle, req.CompanyName, req.ApplicantName, req.ApplicantEmail, phoneStr, req.ApplicantDegree, batchStr, req.PortfolioURL, req.ResumeFileName, req.CoverNote)
	}

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"success":      true,
		"id":           appID,
		"message":      "Application submitted and alumnus notified successfully",
		"alumni_email": alumniEmail,
	})
}

func (h *JobHandler) GetApplications(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	role := strings.ToLower(strings.TrimSpace(q.Get("role"))) // "alumni" or "applicant"
	alumniEmail := strings.TrimSpace(q.Get("alumni_email"))
	applicantEmail := strings.TrimSpace(q.Get("applicant_email"))
	jobIDStr := strings.TrimSpace(q.Get("job_id"))

	// If authenticated, get current user email if not supplied
	val := r.Context().Value(middleware.UserIDKey)
	var currentUID *uint
	var userEmail string
	if val != nil {
		u := val.(uint)
		currentUID = &u
		_ = h.db.QueryRow(`SELECT email FROM users WHERE id = ?`, u).Scan(&userEmail)
	}

	query := `
		SELECT ja.id, ja.job_id, ja.alumni_id, ja.alumni_email,
		       COALESCE(NULLIF(ja.alumni_name, ''), j.referral_alumnus_name, (SELECT TRIM(CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, ''))) FROM alumni_profiles p WHERE p.user_id = ja.alumni_id LIMIT 1), 'MCU Alumnus') AS resolved_alumni_name,
		       ja.job_title, ja.company_name,
		       ja.applicant_user_id, ja.applicant_name, ja.applicant_email, ja.applicant_phone,
		       ja.applicant_degree, ja.mcu_batch, ja.portfolio_url, ja.resume_file_url, ja.resume_file_name,
		       ja.cover_note, ja.status, ja.applied_at
		FROM job_applications ja
		LEFT JOIN jobs j ON ja.job_id = j.id
		WHERE 1=1`

	var args []interface{}

	if role == "applicant" || (applicantEmail != "" && alumniEmail == "") {
		targetEmail := applicantEmail
		if targetEmail == "" && userEmail != "" {
			targetEmail = userEmail
		}
		if targetEmail != "" && currentUID != nil {
			query += ` AND (ja.applicant_email = ? OR ja.applicant_user_id = ?)`
			args = append(args, targetEmail, *currentUID)
		} else if targetEmail != "" {
			query += ` AND ja.applicant_email = ?`
			args = append(args, targetEmail)
		} else if currentUID != nil {
			query += ` AND ja.applicant_user_id = ?`
			args = append(args, *currentUID)
		} else {
			respondJSON(w, http.StatusOK, []JobApplicationResponse{})
			return
		}
	} else if role == "alumni" || alumniEmail != "" {
		targetEmail := alumniEmail
		if targetEmail == "" && userEmail != "" {
			targetEmail = userEmail
		}
		if targetEmail != "" && currentUID != nil {
			query += ` AND (ja.alumni_email = ? OR ja.alumni_id = ?)`
			args = append(args, targetEmail, *currentUID)
		} else if targetEmail != "" {
			query += ` AND ja.alumni_email = ?`
			args = append(args, targetEmail)
		} else if currentUID != nil {
			query += ` AND ja.alumni_id = ?`
			args = append(args, *currentUID)
		} else {
			respondJSON(w, http.StatusOK, []JobApplicationResponse{})
			return
		}
	} else {
		if currentUID != nil {
			targetEmail := userEmail
			if targetEmail != "" {
				query += ` AND (ja.alumni_email = ? OR ja.alumni_id = ?)`
				args = append(args, targetEmail, *currentUID)
			} else {
				query += ` AND ja.alumni_id = ?`
				args = append(args, *currentUID)
			}
		} else {
			respondJSON(w, http.StatusOK, []JobApplicationResponse{})
			return
		}
	}

	if jobIDStr != "" {
		if jid, err := strconv.Atoi(jobIDStr); err == nil && jid > 0 {
			query += ` AND ja.job_id = ?`
			args = append(args, jid)
		}
	}

	query += ` ORDER BY ja.applied_at DESC LIMIT 100`

	rows, err := h.db.Query(query, args...)
	if err != nil {
		log.Printf("❌ Failed to query applications: %v (query: %s, args: %+v)", err, query, args)
		respondError(w, http.StatusInternalServerError, "Failed to query applications")
		return
	}
	defer rows.Close()

	var list []JobApplicationResponse
	for rows.Next() {
		var a JobApplicationResponse
		var jid, aid, auid sql.NullInt64
		var aEmail, aName, jTitle, cName, aPhone, aDeg, mBatch, port, resURL, resName, note sql.NullString
		var status string
		var appliedAt time.Time

		err := rows.Scan(
			&a.ID, &jid, &aid, &aEmail, &aName, &jTitle, &cName,
			&auid, &a.ApplicantName, &a.ApplicantEmail, &aPhone,
			&aDeg, &mBatch, &port, &resURL, &resName,
			&note, &status, &appliedAt,
		)
		if err != nil {
			continue
		}

		if jid.Valid {
			u := uint(jid.Int64)
			a.JobID = &u
		}
		if aid.Valid {
			u := uint(aid.Int64)
			a.AlumniID = &u
		}
		if auid.Valid {
			u := uint(auid.Int64)
			a.ApplicantUserID = &u
		}
		a.AlumniEmail = aEmail.String
		a.AlumniName = aName.String
		a.JobTitle = jTitle.String
		a.CompanyName = cName.String
		a.ApplicantPhone = aPhone.String
		a.ApplicantDegree = aDeg.String
		a.MCUBatch = mBatch.String
		a.PortfolioURL = port.String
		a.ResumeFileURL = resURL.String
		a.ResumeFileName = resName.String
		a.CoverNote = note.String
		a.Status = status
		a.AppliedAt = appliedAt

		list = append(list, a)
	}

	if list == nil {
		list = []JobApplicationResponse{}
	}
	respondJSON(w, http.StatusOK, list)
}

func (h *JobHandler) UpdateApplicationStatus(w http.ResponseWriter, r *http.Request) {
	appIDStr := chi.URLParam(r, "id")
	appID, err := strconv.Atoi(appIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid application ID")
		return
	}

	var req struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON body")
		return
	}

	if req.Status == "" {
		respondError(w, http.StatusBadRequest, "Status is required")
		return
	}

	// 1. Query application details before update to get student and alumni details
	var (
		studentEmail, studentName, alumniEmail, alumniName, jobTitle, companyName sql.NullString
		alumniID, jobID                                                           sql.NullInt64
	)
	_ = h.db.QueryRow(`
		SELECT applicant_email, applicant_name, alumni_email, alumni_name, job_title, company_name, alumni_id, job_id
		FROM job_applications WHERE id = ?`, appID).Scan(
		&studentEmail, &studentName, &alumniEmail, &alumniName, &jobTitle, &companyName, &alumniID, &jobID,
	)

	_, err = h.db.Exec(`UPDATE job_applications SET status = ? WHERE id = ?`, req.Status, appID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to update application status")
		return
	}

	// Resolve alumni name if empty
	aName := alumniName.String
	if aName == "" && jobID.Valid {
		_ = h.db.QueryRow(`SELECT referral_alumnus_name FROM jobs WHERE id = ?`, jobID.Int64).Scan(&aName)
	}
	if aName == "" && alumniID.Valid {
		var fn, ln sql.NullString
		_ = h.db.QueryRow(`SELECT first_name, last_name FROM alumni_profiles WHERE user_id = ? OR id = ?`, alumniID.Int64, alumniID.Int64).Scan(&fn, &ln)
		fullName := strings.TrimSpace(fn.String + " " + ln.String)
		if fullName != "" {
			aName = fullName
		}
	}
	if aName == "" {
		aName = "MCU Alumnus"
	}

	// Asynchronously notify student via email
	if studentEmail.Valid && studentEmail.String != "" && h.emailSvc != nil {
		targetStudentEmail := studentEmail.String
		if strings.HasSuffix(targetStudentEmail, "@example.com") {
			if smtpUser := strings.TrimSpace(os.Getenv("SMTP_USER")); smtpUser != "" {
				targetStudentEmail = smtpUser
			}
		}
		go func(sMail, sName, alName, jTitle, cName, newSt string) {
			err := h.emailSvc.SendJobApplicationStatusNotification(
				sMail, sName, alName, jTitle, cName, newSt,
			)
			if err != nil {
				log.Printf("⚠️ Failed to send application status email to %s: %v", sMail, err)
			} else {
				log.Printf("✅ Sent application status notification email to student %s (Status: %s)", sMail, newSt)
			}
		}(targetStudentEmail, studentName.String, aName, jobTitle.String, companyName.String, req.Status)
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success":          true,
		"id":               appID,
		"status":           req.Status,
		"student_notified": studentEmail.Valid && studentEmail.String != "",
	})
}

func (h *JobHandler) DeleteApplication(w http.ResponseWriter, r *http.Request) {
	appIDStr := chi.URLParam(r, "id")
	appID, err := strconv.Atoi(appIDStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid application ID")
		return
	}

	_, err = h.db.Exec(`DELETE FROM job_applications WHERE id = ?`, appID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to delete application")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"id":      appID,
	})
}

func (h *JobHandler) RequestReferral(w http.ResponseWriter, r *http.Request) {
	h.ApplyJob(w, r)
}
