package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"mcu-alumni-backend/internal/middleware"
	"mcu-alumni-backend/internal/models"
)

type GivingHandler struct {
	db *sql.DB
}

func NewGivingHandler(db *sql.DB) *GivingHandler {
	return &GivingHandler{db: db}
}

func (h *GivingHandler) ListInitiatives(w http.ResponseWriter, r *http.Request) {
	query := `
		SELECT id, slug, title, hindi_title, category,
		       target_amount, raised_amount, description, hindi_description,
		       image_url, status, created_at
		FROM giving_initiatives
		WHERE status = 'active'
		ORDER BY id ASC`

	rows, err := h.db.Query(query)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch giving initiatives")
		return
	}
	defer rows.Close()

	var list []models.GivingInitiative
	for rows.Next() {
		var g models.GivingInitiative
		var hindiDesc sql.NullString

		err := rows.Scan(
			&g.ID, &g.Slug, &g.Title, &g.HindiTitle, &g.Category,
			&g.TargetAmount, &g.RaisedAmount, &g.Description, &hindiDesc,
			&g.ImageURL, &g.Status, &g.CreatedAt,
		)
		if err != nil {
			continue
		}

		if hindiDesc.Valid {
			g.HindiDescription = &hindiDesc.String
		}

		list = append(list, g)
	}

	if list == nil {
		list = []models.GivingInitiative{}
	}
	respondJSON(w, http.StatusOK, list)
}

func (h *GivingHandler) CreateDonation(w http.ResponseWriter, r *http.Request) {
	var req models.DonationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid donation payload")
		return
	}

	if req.InitiativeID == 0 || req.Amount <= 0 || req.DonorName == "" {
		respondError(w, http.StatusBadRequest, "Initiative ID, donor name, and a valid amount are required")
		return
	}

	var userID *uint
	val := r.Context().Value(middleware.UserIDKey)
	if val != nil {
		u := val.(uint)
		userID = &u
	}

	txID := fmt.Sprintf("MCU-PAY-%d", time.Now().UnixNano()%100000000)

	_, err := h.db.Exec(`
		INSERT INTO donations (initiative_id, donor_user_id, donor_name, donor_email, pan_number, amount, payment_reference, payment_status, is_anonymous)
		VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', ?)`,
		req.InitiativeID, userID, req.DonorName, req.DonorEmail, req.PanNumber, req.Amount, txID, req.IsAnonymous)

	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to process donation")
		return
	}

	// Increment initiative raised_amount
	_, _ = h.db.Exec(`
		UPDATE giving_initiatives
		SET raised_amount = raised_amount + ?
		WHERE id = ?`, req.Amount, req.InitiativeID)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message":           "धन्यवाद! MCU Alumni Giving Program में आपके योगदान के लिए साधुवाद।",
		"payment_reference": txID,
		"amount":            req.Amount,
		"status":            "completed",
	})
}

// ListDonations handles GET /api/giving/donate and GET /api/giving/donations
func (h *GivingHandler) ListDonations(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(`
		SELECT d.id, d.initiative_id, COALESCE(g.title, 'General Fund') AS initiative_title,
		       d.donor_name, d.donor_email, d.amount, d.payment_reference, d.payment_status, d.is_anonymous, d.created_at
		FROM donations d
		LEFT JOIN giving_initiatives g ON d.initiative_id = g.id
		ORDER BY d.created_at DESC LIMIT 100`)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to retrieve donations")
		return
	}
	defer rows.Close()

	type DonationRecord struct {
		ID               uint      `json:"id"`
		InitiativeID     uint      `json:"initiative_id"`
		InitiativeTitle  string    `json:"initiative_title"`
		DonorName        string    `json:"donor_name"`
		DonorEmail       *string   `json:"donor_email,omitempty"`
		Amount           float64   `json:"amount"`
		PaymentReference string    `json:"payment_reference"`
		PaymentStatus    string    `json:"payment_status"`
		IsAnonymous      bool      `json:"is_anonymous"`
		CreatedAt        time.Time `json:"created_at"`
	}

	donations := []DonationRecord{}
	for rows.Next() {
		var rec DonationRecord
		var email sql.NullString
		if err := rows.Scan(
			&rec.ID, &rec.InitiativeID, &rec.InitiativeTitle,
			&rec.DonorName, &email, &rec.Amount, &rec.PaymentReference,
			&rec.PaymentStatus, &rec.IsAnonymous, &rec.CreatedAt,
		); err == nil {
			if rec.IsAnonymous {
				rec.DonorName = "Anonymous Alumnus"
			} else if email.Valid && email.String != "" {
				rec.DonorEmail = &email.String
			}
			donations = append(donations, rec)
		}
	}

	var totalRaised float64
	_ = h.db.QueryRow("SELECT COALESCE(SUM(raised_amount), 0) FROM giving_initiatives").Scan(&totalRaised)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"microservice":       "engagement-service",
		"module":             "giving",
		"total_raised_inr":   totalRaised,
		"recorded_donations": len(donations),
		"donations":          donations,
	})
}
