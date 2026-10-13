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

	"github.com/go-chi/chi/v5"

	"mcu-alumni-backend/internal/middleware"
	"mcu-alumni-backend/internal/models"
	"mcu-alumni-backend/internal/services"
)

type MentorshipHandler struct {
	db       *sql.DB
	emailSvc *services.EmailService
}

func NewMentorshipHandler(db *sql.DB, emailSvc *services.EmailService) *MentorshipHandler {
	return &MentorshipHandler{db: db, emailSvc: emailSvc}
}

func (h *MentorshipHandler) CreateRequest(w http.ResponseWriter, r *http.Request) {
	var req models.MentorshipRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if req.MenteeName == "" || req.MenteeEmail == "" || req.Topic == "" {
		respondError(w, http.StatusBadRequest, "Mentee name, email, and topic are required")
		return
	}

	if req.MenteeStatus == "" {
		req.MenteeStatus = "Student"
	}
	prefTime := "Weekend Evening"
	if req.PreferredTime != nil && *req.PreferredTime != "" {
		prefTime = *req.PreferredTime
	}

	var menteeUserID *uint
	val := r.Context().Value(middleware.UserIDKey)
	if val != nil {
		u := val.(uint)
		menteeUserID = &u
	}

	mentorEmail := strings.TrimSpace(req.MentorEmail)
	mentorName := strings.TrimSpace(req.MentorName)
	mentorRole := strings.TrimSpace(req.MentorRole)
	mentorCompany := strings.TrimSpace(req.MentorCompany)

	// Look up mentor details from alumni_profiles / users if not fully supplied
	if req.MentorAlumniID > 0 && (mentorEmail == "" || mentorName == "") {
		var fn, ln, mRole, mComp, uEmail sql.NullString
		_ = h.db.QueryRow(`
			SELECT p.first_name, p.last_name, p.current_role, p.company, u.email
			FROM alumni_profiles p
			LEFT JOIN users u ON p.user_id = u.id
			WHERE p.id = ? OR p.user_id = ?
			LIMIT 1`, req.MentorAlumniID, req.MentorAlumniID).Scan(&fn, &ln, &mRole, &mComp, &uEmail)
		if mentorName == "" {
			mentorName = strings.TrimSpace(fn.String + " " + ln.String)
		}
		if mentorEmail == "" && uEmail.Valid {
			mentorEmail = strings.TrimSpace(uEmail.String)
		}
		if mentorRole == "" && mRole.Valid {
			mentorRole = strings.TrimSpace(mRole.String)
		}
		if mentorCompany == "" && mComp.Valid {
			mentorCompany = strings.TrimSpace(mComp.String)
		}
	}

	if mentorEmail == "" && mentorName != "" {
		cleanName := strings.TrimSpace(strings.Split(mentorName, "(")[0])
		if cleanName != "" {
			_ = h.db.QueryRow(`
				SELECT u.email FROM alumni_profiles p
				JOIN users u ON p.user_id = u.id
				WHERE CONCAT(p.first_name, ' ', p.last_name) LIKE ? OR p.first_name LIKE ?
				LIMIT 1`, "%"+cleanName+"%", "%"+cleanName+"%").Scan(&mentorEmail)
		}
	}

	deliveryEmail := mentorEmail
	isMockEmail := deliveryEmail == "" ||
		strings.HasSuffix(deliveryEmail, "@example.com") ||
		strings.HasSuffix(deliveryEmail, "@indianexpress.com") ||
		strings.HasSuffix(deliveryEmail, "@indiatvnews.com") ||
		strings.HasSuffix(deliveryEmail, "@ogilvy.com") ||
		strings.HasSuffix(deliveryEmail, "@sony.com")

	if isMockEmail {
		if smtpUser := strings.TrimSpace(os.Getenv("SMTP_USER")); smtpUser != "" {
			deliveryEmail = smtpUser
		}
		if mentorEmail == "" {
			mentorEmail = deliveryEmail
		}
	}

	if mentorName == "" {
		mentorName = "MCU Alumnus Mentor"
	}

	var mentorIDPtr interface{} = nil
	if req.MentorAlumniID > 0 {
		mentorIDPtr = req.MentorAlumniID
	}

	res, err := h.db.Exec(`
		INSERT INTO mentorship_requests (
			mentor_alumni_id, mentor_email, mentor_name, mentor_role, mentor_company,
			mentee_user_id, mentee_name, mentee_email, mentee_phone, mentee_status,
			topic, preferred_time, message, status
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
		mentorIDPtr, mentorEmail, mentorName, mentorRole, mentorCompany,
		menteeUserID, req.MenteeName, req.MenteeEmail, req.MenteePhone, req.MenteeStatus,
		req.Topic, prefTime, req.Message,
	)

	if err != nil {
		log.Printf("❌ Mentorship request insert error: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to submit mentorship request")
		return
	}

	reqID, _ := res.LastInsertId()
	req.ID = uint(reqID)
	req.MentorEmail = mentorEmail
	req.MentorName = mentorName
	req.MentorRole = mentorRole
	req.MentorCompany = mentorCompany
	req.MenteeUserID = menteeUserID
	req.PreferredTime = &prefTime
	req.Status = "pending"

	phoneStr := ""
	if req.MenteePhone != nil {
		phoneStr = strings.TrimSpace(*req.MenteePhone)
	}

	// Send email notification to the Alumnus asynchronously
	if h.emailSvc != nil && deliveryEmail != "" {
		go func(to, mName, mRole, mComp, sName, sEmail, sPhone, sStatus, top, pTime, msg string) {
			err := h.emailSvc.SendMentorshipRequestNotification(
				to, mName, mRole, mComp,
				sName, sEmail, sPhone, sStatus,
				top, pTime, msg,
			)
			if err != nil {
				log.Printf("⚠️ Mentorship email notification failed to %s: %v", to, err)
			} else {
				log.Printf("✅ Mentorship request email sent to %s from %s (%s)", to, sName, top)
			}
		}(deliveryEmail, mentorName, mentorRole, mentorCompany, req.MenteeName, req.MenteeEmail, phoneStr, req.MenteeStatus, req.Topic, prefTime, req.Message)
	}

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"success":      true,
		"id":           req.ID,
		"mentor_email": mentorEmail,
		"message":      "Mentorship request submitted and alumnus notified via email & account!",
		"request":      req,
	})
}

func (h *MentorshipHandler) GetMyRequests(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	role := strings.ToLower(strings.TrimSpace(q.Get("role"))) // "mentor", "mentee", or ""
	mentorEmail := strings.TrimSpace(q.Get("mentor_email"))
	menteeEmail := strings.TrimSpace(q.Get("mentee_email"))
	mentorName := strings.TrimSpace(q.Get("mentor_name"))

	val := r.Context().Value(middleware.UserIDKey)
	var currentUID *uint
	var userEmail string
	if val != nil {
		u := val.(uint)
		currentUID = &u
		_ = h.db.QueryRow(`SELECT email FROM users WHERE id = ?`, u).Scan(&userEmail)
	}

	if val == nil && mentorEmail == "" && menteeEmail == "" && mentorName == "" {
		if strings.Contains(r.Header.Get("Accept"), "text/html") {
			h.ListRequests(w, r)
			return
		}
	}

	query := `
		SELECT mr.id, COALESCE(mr.mentor_alumni_id, 0),
		       COALESCE(NULLIF(mr.mentor_email, ''), u.email, '') AS resolved_mentor_email,
		       COALESCE(NULLIF(mr.mentor_name, ''), TRIM(CONCAT(COALESCE(ap.first_name, ''), ' ', COALESCE(ap.last_name, ''))), 'MCU Mentor') AS resolved_mentor_name,
		       COALESCE(NULLIF(mr.mentor_role, ''), ap.current_role, 'Software Engineer') AS resolved_mentor_role,
		       COALESCE(NULLIF(mr.mentor_company, ''), ap.company, 'Tech Enterprise') AS resolved_mentor_company,
		       mr.mentee_user_id, mr.mentee_name, mr.mentee_email, mr.mentee_phone,
		       mr.mentee_status, mr.topic, mr.preferred_time, mr.message, mr.status,
		       mr.session_date, mr.session_time, mr.session_mode, mr.meeting_link, mr.mentor_note,
		       mr.created_at
		FROM mentorship_requests mr
		LEFT JOIN alumni_profiles ap ON mr.mentor_alumni_id = ap.id
		LEFT JOIN users u ON ap.user_id = u.id
		WHERE 1=1`

	var args []interface{}

	if role == "mentee" {
		target := menteeEmail
		if target == "" {
			target = userEmail
		}
		if target != "" && currentUID != nil {
			query += ` AND (mr.mentee_email = ? OR mr.mentee_user_id = ?)`
			args = append(args, target, *currentUID)
		} else if target != "" {
			query += ` AND mr.mentee_email = ?`
			args = append(args, target)
		} else if currentUID != nil {
			query += ` AND mr.mentee_user_id = ?`
			args = append(args, *currentUID)
		}
	} else if role == "mentor" {
		target := mentorEmail
		if target == "" {
			target = userEmail
		}
		var conds []string
		if target != "" {
			conds = append(conds, `mr.mentor_email = ?`, `u.email = ?`)
			args = append(args, target, target)
		}
		if currentUID != nil {
			conds = append(conds, `mr.mentor_alumni_id = ?`, `ap.user_id = ?`)
			args = append(args, *currentUID, *currentUID)
		}
		if mentorName != "" {
			conds = append(conds, `mr.mentor_name LIKE ?`)
			args = append(args, "%"+mentorName+"%")
		}
		if len(conds) > 0 {
			query += ` AND (` + strings.Join(conds, " OR ") + `)`
		}
	} else if currentUID != nil || userEmail != "" || mentorEmail != "" || menteeEmail != "" {
		var conds []string
		if currentUID != nil {
			conds = append(conds, `mr.mentee_user_id = ?`, `mr.mentor_alumni_id = ?`, `ap.user_id = ?`)
			args = append(args, *currentUID, *currentUID, *currentUID)
		}
		e := userEmail
		if e == "" {
			e = mentorEmail
		}
		if e == "" {
			e = menteeEmail
		}
		if e != "" {
			conds = append(conds, `mr.mentee_email = ?`, `mr.mentor_email = ?`, `u.email = ?`)
			args = append(args, e, e, e)
		}
		if len(conds) > 0 {
			query += ` AND (` + strings.Join(conds, " OR ") + `)`
		}
	}

	query += ` ORDER BY mr.created_at DESC LIMIT 100`

	rows, err := h.db.Query(query, args...)
	if err != nil {
		log.Printf("❌ Failed to retrieve mentorship requests: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to retrieve mentorship requests")
		return
	}
	defer rows.Close()

	list := h.scanMentorshipRows(rows)
	respondJSON(w, http.StatusOK, list)
}

// ListRequests handles GET /api/mentorship and GET /api/mentorship/requests
func (h *MentorshipHandler) ListRequests(w http.ResponseWriter, r *http.Request) {
	query := `
		SELECT mr.id, COALESCE(mr.mentor_alumni_id, 0),
		       COALESCE(NULLIF(mr.mentor_email, ''), u.email, '') AS resolved_mentor_email,
		       COALESCE(NULLIF(mr.mentor_name, ''), TRIM(CONCAT(COALESCE(ap.first_name, ''), ' ', COALESCE(ap.last_name, ''))), 'MCU Mentor') AS resolved_mentor_name,
		       COALESCE(NULLIF(mr.mentor_role, ''), ap.current_role, 'Software Engineer') AS resolved_mentor_role,
		       COALESCE(NULLIF(mr.mentor_company, ''), ap.company, 'Tech Enterprise') AS resolved_mentor_company,
		       mr.mentee_user_id, mr.mentee_name, mr.mentee_email, mr.mentee_phone,
		       mr.mentee_status, mr.topic, mr.preferred_time, mr.message, mr.status,
		       mr.session_date, mr.session_time, mr.session_mode, mr.meeting_link, mr.mentor_note,
		       mr.created_at
		FROM mentorship_requests mr
		LEFT JOIN alumni_profiles ap ON mr.mentor_alumni_id = ap.id
		LEFT JOIN users u ON ap.user_id = u.id
		ORDER BY mr.created_at DESC LIMIT 100`

	rows, err := h.db.Query(query)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to retrieve mentorship requests")
		return
	}
	defer rows.Close()

	list := h.scanMentorshipRows(rows)

	var availableMentors int
	_ = h.db.QueryRow("SELECT COUNT(*) FROM alumni_profiles WHERE open_to_mentor = 1").Scan(&availableMentors)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"microservice":      "engagement-service",
		"module":            "mentorship",
		"available_mentors": availableMentors,
		"total_requests":    len(list),
		"requests":          list,
	})
}

func (h *MentorshipHandler) UpdateRequestStatus(w http.ResponseWriter, r *http.Request) {
	reqIDStr := chi.URLParam(r, "id")
	reqID, err := strconv.Atoi(reqIDStr)
	if err != nil || reqID <= 0 {
		respondError(w, http.StatusBadRequest, "Invalid mentorship request ID")
		return
	}

	var payload struct {
		Status      string `json:"status"`
		SessionDate string `json:"session_date"`
		SessionTime string `json:"session_time"`
		SessionMode string `json:"session_mode"`
		MeetingLink string `json:"meeting_link"`
		MentorNote  string `json:"mentor_note"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}
	if strings.TrimSpace(payload.Status) == "" {
		payload.Status = "scheduled"
	}

	var (
		menteeEmail, menteeName, mentorName, mentorRole, mentorCompany, topic sql.NullString
	)
	_ = h.db.QueryRow(`
		SELECT mentee_email, mentee_name, mentor_name, mentor_role, mentor_company, topic
		FROM mentorship_requests WHERE id = ?`, reqID).Scan(
		&menteeEmail, &menteeName, &mentorName, &mentorRole, &mentorCompany, &topic,
	)

	_, err = h.db.Exec(`
		UPDATE mentorship_requests
		SET status = ?,
		    session_date = COALESCE(NULLIF(?, ''), session_date),
		    session_time = COALESCE(NULLIF(?, ''), session_time),
		    session_mode = COALESCE(NULLIF(?, ''), session_mode),
		    meeting_link = COALESCE(NULLIF(?, ''), meeting_link),
		    mentor_note = COALESCE(NULLIF(?, ''), mentor_note)
		WHERE id = ?`,
		payload.Status,
		strings.TrimSpace(payload.SessionDate),
		strings.TrimSpace(payload.SessionTime),
		strings.TrimSpace(payload.SessionMode),
		strings.TrimSpace(payload.MeetingLink),
		strings.TrimSpace(payload.MentorNote),
		reqID,
	)
	if err != nil {
		log.Printf("❌ Failed to update mentorship request %d: %v", reqID, err)
		respondError(w, http.StatusInternalServerError, "Failed to update mentorship session status")
		return
	}

	// Send email notification to the Student/Mentee asynchronously
	if menteeEmail.Valid && menteeEmail.String != "" && h.emailSvc != nil {
		targetMenteeEmail := menteeEmail.String
		if strings.HasSuffix(targetMenteeEmail, "@example.com") {
			if smtpUser := strings.TrimSpace(os.Getenv("SMTP_USER")); smtpUser != "" {
				targetMenteeEmail = smtpUser
			}
		}
		go func(sMail, sName, mName, mRole, mComp, top, st, sDate, sTime, sMode, mLink, mNote string) {
			err := h.emailSvc.SendMentorshipStatusNotification(
				sMail, sName, mName, mRole, mComp,
				top, st, sDate, sTime, sMode, mLink, mNote,
			)
			if err != nil {
				log.Printf("⚠️ Failed to send mentorship status email to %s: %v", sMail, err)
			} else {
				log.Printf("✅ Mentorship session schedule email sent to %s (%s)", sMail, st)
			}
		}(
			targetMenteeEmail,
			menteeName.String,
			mentorName.String,
			mentorRole.String,
			mentorCompany.String,
			topic.String,
			payload.Status,
			payload.SessionDate,
			payload.SessionTime,
			payload.SessionMode,
			payload.MeetingLink,
			payload.MentorNote,
		)
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success":      true,
		"id":           reqID,
		"status":       payload.Status,
		"session_date": payload.SessionDate,
		"session_time": payload.SessionTime,
		"session_mode": payload.SessionMode,
		"meeting_link": payload.MeetingLink,
		"mentor_note":  payload.MentorNote,
		"message":      fmt.Sprintf("Mentorship session updated to '%s' and student notified!", payload.Status),
	})
}

func (h *MentorshipHandler) DeleteRequest(w http.ResponseWriter, r *http.Request) {
	reqIDStr := chi.URLParam(r, "id")
	reqID, err := strconv.Atoi(reqIDStr)
	if err != nil || reqID <= 0 {
		respondError(w, http.StatusBadRequest, "Invalid mentorship request ID")
		return
	}

	_, err = h.db.Exec(`DELETE FROM mentorship_requests WHERE id = ?`, reqID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to delete mentorship request")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"id":      reqID,
		"message": "Mentorship request deleted successfully",
	})
}

func (h *MentorshipHandler) scanMentorshipRows(rows *sql.Rows) []models.MentorshipRequest {
	list := []models.MentorshipRequest{}
	for rows.Next() {
		var mr models.MentorshipRequest
		var muID sql.NullInt32
		var phone, prefTime, sDate, sTime, sMode, mLink, mNote sql.NullString

		if err := rows.Scan(
			&mr.ID, &mr.MentorAlumniID,
			&mr.MentorEmail, &mr.MentorName, &mr.MentorRole, &mr.MentorCompany,
			&muID, &mr.MenteeName, &mr.MenteeEmail, &phone,
			&mr.MenteeStatus, &mr.Topic, &prefTime, &mr.Message, &mr.Status,
			&sDate, &sTime, &sMode, &mLink, &mNote,
			&mr.CreatedAt,
		); err != nil {
			continue
		}
		mr.MentorName = strings.TrimSpace(mr.MentorName)
		if muID.Valid {
			u := uint(muID.Int32)
			mr.MenteeUserID = &u
		}
		if phone.Valid {
			mr.MenteePhone = &phone.String
		}
		if prefTime.Valid {
			mr.PreferredTime = &prefTime.String
		}
		if sDate.Valid && sDate.String != "" {
			mr.SessionDate = &sDate.String
		}
		if sTime.Valid && sTime.String != "" {
			mr.SessionTime = &sTime.String
		}
		if sMode.Valid && sMode.String != "" {
			mr.SessionMode = &sMode.String
		}
		if mLink.Valid && mLink.String != "" {
			mr.MeetingLink = &mLink.String
		}
		if mNote.Valid && mNote.String != "" {
			mr.MentorNote = &mNote.String
		}
		list = append(list, mr)
	}
	return list
}
