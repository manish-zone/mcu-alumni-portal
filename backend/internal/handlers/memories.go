package handlers

import (
	"database/sql"
	"net/http"
	"strings"

	"mcu-alumni-backend/internal/models"
)

type MemoryHandler struct {
	db *sql.DB
}

func NewMemoryHandler(db *sql.DB) *MemoryHandler {
	return &MemoryHandler{db: db}
}

func (h *MemoryHandler) List(w http.ResponseWriter, r *http.Request) {
	category := strings.TrimSpace(strings.ToLower(r.URL.Query().Get("category")))

	query := `
		SELECT m.id, m.slug, m.title, m.hindi_title, m.category, m.academic_year,
		       m.campus_id, COALESCE(c.name, 'Bhopal') AS campus_name,
		       m.description, m.hindi_description, m.image_url, m.fallback_image_url,
		       m.credit, m.display_order, m.created_at
		FROM campus_memories m
		LEFT JOIN campuses c ON m.campus_id = c.id`

	var conditions []string
	var args []interface{}

	if category != "" && category != "all" {
		conditions = append(conditions, "m.category = ?")
		args = append(args, category)
	}

	if len(conditions) > 0 {
		query += " WHERE " + strings.Join(conditions, " AND ")
	}

	query += " ORDER BY m.display_order ASC, m.id ASC"

	rows, err := h.db.Query(query, args...)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to retrieve memories")
		return
	}
	defer rows.Close()

	var list []models.CampusMemory
	for rows.Next() {
		var m models.CampusMemory
		var campusID sql.NullInt32
		var campusName, hindiDesc, fallbackImg, credit sql.NullString

		err := rows.Scan(
			&m.ID, &m.Slug, &m.Title, &m.HindiTitle, &m.Category, &m.AcademicYear,
			&campusID, &campusName, &m.Description, &hindiDesc,
			&m.ImageURL, &fallbackImg, &credit, &m.DisplayOrder, &m.CreatedAt,
		)
		if err != nil {
			continue
		}

		if campusID.Valid {
			cid := uint(campusID.Int32)
			m.CampusID = &cid
		}
		if campusName.Valid {
			m.CampusName = &campusName.String
		}
		if hindiDesc.Valid {
			m.HindiDescription = &hindiDesc.String
		}
		if fallbackImg.Valid {
			m.FallbackImageURL = &fallbackImg.String
		}
		if credit.Valid {
			m.Credit = &credit.String
		}

		list = append(list, m)
	}

	if list == nil {
		list = []models.CampusMemory{}
	}
	respondJSON(w, http.StatusOK, list)
}
