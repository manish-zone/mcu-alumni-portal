package handlers

import (
	"database/sql"
	"net/http"

	"mcu-alumni-backend/internal/models"
)

type MetaHandler struct {
	db *sql.DB
}

func NewMetaHandler(db *sql.DB) *MetaHandler {
	return &MetaHandler{db: db}
}

func (h *MetaHandler) GetCampuses(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query("SELECT id, code, name, hindi_name, address, is_active FROM campuses WHERE is_active = 1 ORDER BY id ASC")
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to load campuses")
		return
	}
	defer rows.Close()

	var list []models.Campus
	for rows.Next() {
		var c models.Campus
		var addr sql.NullString
		if err := rows.Scan(&c.ID, &c.Code, &c.Name, &c.HindiName, &addr, &c.IsActive); err == nil {
			if addr.Valid {
				c.Address = addr.String
			}
			list = append(list, c)
		}
	}
	if list == nil {
		list = []models.Campus{}
	}
	respondJSON(w, http.StatusOK, list)
}

func (h *MetaHandler) GetDepartments(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query("SELECT id, code, name, hindi_name, description FROM departments ORDER BY id ASC")
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to load departments")
		return
	}
	defer rows.Close()

	var list []models.Department
	for rows.Next() {
		var d models.Department
		var desc sql.NullString
		if err := rows.Scan(&d.ID, &d.Code, &d.Name, &d.HindiName, &desc); err == nil {
			if desc.Valid {
				d.Description = desc.String
			}
			list = append(list, d)
		}
	}
	if list == nil {
		list = []models.Department{}
	}
	respondJSON(w, http.StatusOK, list)
}

func (h *MetaHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	var stats models.DashboardStats

	_ = h.db.QueryRow("SELECT COUNT(*) FROM alumni_profiles").Scan(&stats.TotalAlumni)
	_ = h.db.QueryRow("SELECT COUNT(*) FROM alumni_profiles WHERE open_to_mentor = 1").Scan(&stats.AvailableMentors)
	_ = h.db.QueryRow("SELECT COUNT(*) FROM events WHERE status IN ('upcoming', 'ongoing')").Scan(&stats.UpcomingEvents)
	_ = h.db.QueryRow("SELECT COUNT(*) FROM jobs WHERE status = 'active'").Scan(&stats.ActiveJobs)
	_ = h.db.QueryRow("SELECT COUNT(*) FROM campus_memories").Scan(&stats.CampusMemories)
	_ = h.db.QueryRow("SELECT COALESCE(SUM(raised_amount), 0) FROM giving_initiatives").Scan(&stats.TotalGivingRaised)

	respondJSON(w, http.StatusOK, stats)
}

// GetAllMeta returns all university metadata (campuses, departments, and stats) in a single response for GET /api/meta.
func (h *MetaHandler) GetAllMeta(w http.ResponseWriter, r *http.Request) {
	var stats models.DashboardStats
	_ = h.db.QueryRow("SELECT COUNT(*) FROM alumni_profiles").Scan(&stats.TotalAlumni)
	_ = h.db.QueryRow("SELECT COUNT(*) FROM alumni_profiles WHERE open_to_mentor = 1").Scan(&stats.AvailableMentors)
	_ = h.db.QueryRow("SELECT COUNT(*) FROM events WHERE status IN ('upcoming', 'ongoing')").Scan(&stats.UpcomingEvents)
	_ = h.db.QueryRow("SELECT COUNT(*) FROM jobs WHERE status = 'active'").Scan(&stats.ActiveJobs)
	_ = h.db.QueryRow("SELECT COUNT(*) FROM campus_memories").Scan(&stats.CampusMemories)
	_ = h.db.QueryRow("SELECT COALESCE(SUM(raised_amount), 0) FROM giving_initiatives").Scan(&stats.TotalGivingRaised)

	campuses := []models.Campus{}
	if cRows, err := h.db.Query("SELECT id, code, name, hindi_name, address, is_active FROM campuses WHERE is_active = 1 ORDER BY id ASC"); err == nil {
		defer cRows.Close()
		for cRows.Next() {
			var c models.Campus
			var addr sql.NullString
			if err := cRows.Scan(&c.ID, &c.Code, &c.Name, &c.HindiName, &addr, &c.IsActive); err == nil {
				if addr.Valid {
					c.Address = addr.String
				}
				campuses = append(campuses, c)
			}
		}
	}

	departments := []models.Department{}
	if dRows, err := h.db.Query("SELECT id, code, name, hindi_name, description FROM departments ORDER BY id ASC"); err == nil {
		defer dRows.Close()
		for dRows.Next() {
			var d models.Department
			var desc sql.NullString
			if err := dRows.Scan(&d.ID, &d.Code, &d.Name, &d.HindiName, &desc); err == nil {
				if desc.Valid {
					d.Description = desc.String
				}
				departments = append(departments, d)
			}
		}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"microservice": "alumni-service",
		"module":       "meta",
		"stats":        stats,
		"campuses":     campuses,
		"departments":  departments,
	})
}
