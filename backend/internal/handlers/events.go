package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"mcu-alumni-backend/internal/middleware"
	"mcu-alumni-backend/internal/models"

	"github.com/go-chi/chi/v5"
)

type EventHandler struct {
	db *sql.DB
}

func NewEventHandler(db *sql.DB) *EventHandler {
	return &EventHandler{db: db}
}

func (h *EventHandler) List(w http.ResponseWriter, r *http.Request) {
	status := strings.TrimSpace(strings.ToLower(r.URL.Query().Get("status")))
	category := strings.TrimSpace(strings.ToLower(r.URL.Query().Get("category")))

	query := `
		SELECT e.id, e.slug, e.title, e.hindi_title, e.category, e.event_date,
		       e.start_time, e.end_time, e.venue, e.campus_id, c.name AS campus_name,
		       e.description, e.hindi_description, e.banner_url, e.fallback_banner_url,
		       e.total_seats, e.rsvp_count, e.organizer_name, e.is_official_mcu,
		       e.badge_text, e.status
		FROM events e
		LEFT JOIN campuses c ON e.campus_id = c.id`

	var conditions []string
	var args []interface{}

	if status != "" && status != "all" {
		conditions = append(conditions, "e.status = ?")
		args = append(args, status)
	}

	if category != "" && category != "all" {
		conditions = append(conditions, "e.category = ?")
		args = append(args, category)
	}

	if len(conditions) > 0 {
		query += " WHERE " + strings.Join(conditions, " AND ")
	}

	query += " ORDER BY e.event_date ASC, e.id ASC"

	rows, err := h.db.Query(query, args...)
	if err != nil {
		respondError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to query events: %v", err))
		return
	}
	defer rows.Close()

	var list []models.Event
	var eventIDs []string

	for rows.Next() {
		var e models.Event
		var campusID sql.NullInt32
		var campusName, startTime, endTime, hindiDesc, fallbackBanner, badgeText sql.NullString

		err := rows.Scan(
			&e.ID, &e.Slug, &e.Title, &e.HindiTitle, &e.Category, &e.EventDate,
			&startTime, &endTime, &e.Venue, &campusID, &campusName,
			&e.Description, &hindiDesc, &e.BannerURL, &fallbackBanner,
			&e.TotalSeats, &e.RSVPCount, &e.OrganizerName, &e.IsOfficialMCU,
			&badgeText, &e.Status,
		)
		if err != nil {
			continue
		}

		if campusID.Valid {
			cid := uint(campusID.Int32)
			e.CampusID = &cid
		}
		if campusName.Valid {
			e.CampusName = &campusName.String
		}
		if startTime.Valid {
			e.StartTime = &startTime.String
		}
		if endTime.Valid {
			e.EndTime = &endTime.String
		}
		if hindiDesc.Valid {
			e.HindiDescription = &hindiDesc.String
		}
		if fallbackBanner.Valid {
			e.FallbackBannerURL = &fallbackBanner.String
		}
		if badgeText.Valid {
			e.BadgeText = &badgeText.String
		}

		e.Tags = []string{}
		list = append(list, e)
		eventIDs = append(eventIDs, strconv.Itoa(int(e.ID)))
	}

	// Fetch tags from event_tags (tag_name column)
	if len(eventIDs) > 0 {
		tagQuery := fmt.Sprintf(`
			SELECT event_id, tag_name
			FROM event_tags
			WHERE event_id IN (%s)`, strings.Join(eventIDs, ","))
		tagRows, err := h.db.Query(tagQuery)
		if err == nil {
			defer tagRows.Close()
			tagMap := make(map[uint][]string)
			for tagRows.Next() {
				var eID uint
				var tag string
				if err := tagRows.Scan(&eID, &tag); err == nil {
					tagMap[eID] = append(tagMap[eID], tag)
				}
			}
			for i := range list {
				if tags, ok := tagMap[list[i].ID]; ok {
					list[i].Tags = tags
				}
			}
		}
	}

	if list == nil {
		list = []models.Event{}
	}
	respondJSON(w, http.StatusOK, list)
}

func (h *EventHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid event ID")
		return
	}

	query := `
		SELECT e.id, e.slug, e.title, e.hindi_title, e.category, e.event_date,
		       e.start_time, e.end_time, e.venue, e.campus_id, c.name AS campus_name,
		       e.description, e.hindi_description, e.banner_url, e.fallback_banner_url,
		       e.total_seats, e.rsvp_count, e.organizer_name, e.is_official_mcu,
		       e.badge_text, e.status
		FROM events e
		LEFT JOIN campuses c ON e.campus_id = c.id
		WHERE e.id = ?`

	var e models.Event
	var campusID sql.NullInt32
	var campusName, startTime, endTime, hindiDesc, fallbackBanner, badgeText sql.NullString

	err = h.db.QueryRow(query, id).Scan(
		&e.ID, &e.Slug, &e.Title, &e.HindiTitle, &e.Category, &e.EventDate,
		&startTime, &endTime, &e.Venue, &campusID, &campusName,
		&e.Description, &hindiDesc, &e.BannerURL, &fallbackBanner,
		&e.TotalSeats, &e.RSVPCount, &e.OrganizerName, &e.IsOfficialMCU,
		&badgeText, &e.Status,
	)
	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Event not found")
		return
	} else if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error")
		return
	}

	if campusID.Valid {
		cid := uint(campusID.Int32)
		e.CampusID = &cid
	}
	if campusName.Valid {
		e.CampusName = &campusName.String
	}
	if startTime.Valid {
		e.StartTime = &startTime.String
	}
	if endTime.Valid {
		e.EndTime = &endTime.String
	}
	if hindiDesc.Valid {
		e.HindiDescription = &hindiDesc.String
	}
	if fallbackBanner.Valid {
		e.FallbackBannerURL = &fallbackBanner.String
	}
	if badgeText.Valid {
		e.BadgeText = &badgeText.String
	}

	e.Tags = []string{}
	tagRows, err := h.db.Query("SELECT tag_name FROM event_tags WHERE event_id = ?", e.ID)
	if err == nil {
		defer tagRows.Close()
		for tagRows.Next() {
			var tag string
			if err := tagRows.Scan(&tag); err == nil {
				e.Tags = append(e.Tags, tag)
			}
		}
	}

	respondJSON(w, http.StatusOK, e)
}

func (h *EventHandler) RSVP(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	eventID, err := strconv.Atoi(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid event ID")
		return
	}

	var req models.RSVPRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON body")
		return
	}

	var userID *uint
	val := r.Context().Value(middleware.UserIDKey)
	if val != nil {
		u := val.(uint)
		userID = &u
	}

	if req.AttendeeName == "" {
		req.AttendeeName = "MCU Alumnus"
	}
	if req.AttendeeEmail == "" {
		req.AttendeeEmail = "attendee@alumni.mcu.ac.in"
	}
	if req.GuestCount < 1 {
		req.GuestCount = 1
	}
	campus := "Bhopal"
	if req.Campus != nil && *req.Campus != "" {
		campus = *req.Campus
	}

	ticketCode := fmt.Sprintf("ABHYUDAY-2026-%d-%d", eventID, time.Now().UnixNano()%1000000)

	// Insert into event_rsvps
	_, err = h.db.Exec(`
		INSERT INTO event_rsvps (event_id, user_id, attendee_name, attendee_email, attendee_phone, batch_year, campus, guest_count, ticket_pass_code, status)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
		eventID, userID, req.AttendeeName, req.AttendeeEmail, req.AttendeePhone, req.BatchYear, campus, req.GuestCount, ticketCode)

	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to record RSVP")
		return
	}

	// Increment RSVP count in events table
	_, _ = h.db.Exec(`
		UPDATE events
		SET rsvp_count = rsvp_count + ?
		WHERE id = ?`, req.GuestCount, eventID)

	var newCount int
	_ = h.db.QueryRow("SELECT rsvp_count FROM events WHERE id = ?", eventID).Scan(&newCount)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message":          "अभ्युदय 2026 में आपका पंजीकरण सफलतापूर्वक दर्ज हो गया है!",
		"event_id":         eventID,
		"ticket_pass_code": ticketCode,
		"rsvp_count":       newCount,
	})
}

// GetRSVPs handles GET /api/events/{id}/rsvp
func (h *EventHandler) GetRSVPs(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	eventID, err := strconv.Atoi(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid event ID")
		return
	}

	var title string
	var totalSeats, rsvpCount int
	err = h.db.QueryRow("SELECT title, total_seats, rsvp_count FROM events WHERE id = ?", eventID).
		Scan(&title, &totalSeats, &rsvpCount)
	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Event not found")
		return
	}

	rows, err := h.db.Query(`
		SELECT id, attendee_name, attendee_email, COALESCE(batch_year, 0), COALESCE(campus, 'Bhopal'),
		       guest_count, ticket_pass_code, status, created_at
		FROM event_rsvps
		WHERE event_id = ?
		ORDER BY created_at DESC`, eventID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch RSVPs")
		return
	}
	defer rows.Close()

	type RSVPRecord struct {
		ID             uint      `json:"id"`
		AttendeeName   string    `json:"attendee_name"`
		AttendeeEmail  string    `json:"attendee_email"`
		BatchYear      int       `json:"batch_year,omitempty"`
		Campus         string    `json:"campus"`
		GuestCount     int       `json:"guest_count"`
		TicketPassCode string    `json:"ticket_pass_code"`
		Status         string    `json:"status"`
		CreatedAt      time.Time `json:"created_at"`
	}

	rsvps := []RSVPRecord{}
	for rows.Next() {
		var rec RSVPRecord
		if err := rows.Scan(
			&rec.ID, &rec.AttendeeName, &rec.AttendeeEmail, &rec.BatchYear,
			&rec.Campus, &rec.GuestCount, &rec.TicketPassCode, &rec.Status, &rec.CreatedAt,
		); err == nil {
			rsvps = append(rsvps, rec)
		}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"microservice":    "events-service",
		"event_id":        eventID,
		"event_title":     title,
		"total_seats":     totalSeats,
		"rsvp_count":      rsvpCount,
		"remaining_seats": totalSeats - rsvpCount,
		"registrations":   rsvps,
	})
}
