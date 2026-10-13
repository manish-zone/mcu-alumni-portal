package models

import "time"

// User represents an authentication account
type User struct {
	ID           uint       `json:"id"`
	Email        string     `json:"email"`
	PasswordHash string     `json:"-"`
	Phone        *string    `json:"phone,omitempty"`
	Role         string     `json:"role"` // alumni, student, faculty, admin
	IsVerified   bool       `json:"is_verified"`
	IsActive     bool       `json:"is_active"`
	GoogleID     *string    `json:"google_id,omitempty"`
	AuthProvider string     `json:"auth_provider,omitempty"`
	LastLogin    *time.Time `json:"last_login,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type GoogleAuthRequest struct {
	Mode         string    `json:"mode,omitempty"` // "signin" | "signup"
	Role         string    `json:"role,omitempty"` // "alumni" | "student"
	Credential   string    `json:"credential"`
	Email        string    `json:"email,omitempty"`
	Name         string    `json:"name,omitempty"`
	Picture      string    `json:"picture,omitempty"`
	GoogleID     string    `json:"google_id,omitempty"`
	Phone        *string   `json:"phone,omitempty"`
	BatchYear    *int      `json:"batch_year,omitempty"`
	Batch        *string   `json:"batch,omitempty"`
	Degree       *string   `json:"degree,omitempty"`
	DepartmentID *uint     `json:"department_id,omitempty"`
	Department   *string   `json:"department,omitempty"`
	CampusID     *uint     `json:"campus_id,omitempty"`
	Campus       *string   `json:"campus,omitempty"`
	EnrollmentNo *string   `json:"enrollment_no,omitempty"`
	CurrentRole  *string   `json:"current_role,omitempty"`
	Company      *string   `json:"company,omitempty"`
	Location     *string   `json:"location,omitempty"`
	LinkedInURL  *string   `json:"linkedin_url,omitempty"`
	LinkedIn     *string   `json:"linkedin,omitempty"`
	Bio          *string   `json:"bio,omitempty"`
	OpenToMentor *bool     `json:"open_to_mentor,omitempty"`
	Skills       *[]string `json:"skills,omitempty"`
}

type GoogleTokenInfo struct {
	Iss           string `json:"iss"`
	Sub           string `json:"sub"`
	Azp           string `json:"azp"`
	Aud           string `json:"aud"`
	Email         string `json:"email"`
	EmailVerified string `json:"email_verified"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
	GivenName     string `json:"given_name"`
	FamilyName    string `json:"family_name"`
	Exp           string `json:"exp"`
	Error         string `json:"error,omitempty"`
	ErrorDesc     string `json:"error_description,omitempty"`
}

type RegisterRequest struct {
	Name             string    `json:"name"`
	FirstName        string    `json:"first_name"`
	LastName         string    `json:"last_name"`
	HindiName        *string   `json:"hindi_name,omitempty"`
	Email            string    `json:"email"`
	Password         string    `json:"password"`
	Phone            *string   `json:"phone,omitempty"`
	Role             string    `json:"role"` // alumni, student
	BatchYear        *int      `json:"batch_year,omitempty"`
	Batch            *string   `json:"batch,omitempty"`
	DepartmentID     *uint     `json:"department_id,omitempty"`
	Department       *string   `json:"department,omitempty"`
	CampusID         *uint     `json:"campus_id,omitempty"`
	Campus           *string   `json:"campus,omitempty"`
	Degree           *string   `json:"degree,omitempty"`
	CurrentRole      *string   `json:"current_role,omitempty"`
	CurrentRoleCamel *string   `json:"currentRole,omitempty"`
	Company          *string   `json:"company,omitempty"`
	Location         *string   `json:"location,omitempty"`
	Bio              *string   `json:"bio,omitempty"`
	OpenToMentor     *bool     `json:"open_to_mentor,omitempty"`
	OpenMentor       *bool     `json:"openToMentor,omitempty"`
	EnrollmentNo     *string   `json:"enrollmentNo,omitempty"`
	AvatarURL        *string   `json:"avatar_url,omitempty"`
	Avatar           *string   `json:"avatar,omitempty"`
	LinkedInURL      *string   `json:"linkedin_url,omitempty"`
	LinkedIn         *string   `json:"linkedin,omitempty"`
	Skills           *[]string `json:"skills,omitempty"`
}

type AuthResponse struct {
	Token   string        `json:"token"`
	User    UserProfile   `json:"user"`
	Profile AlumniProfile `json:"profile"`
}

type UserProfile struct {
	ID             uint     `json:"id"`
	Email          string   `json:"email"`
	FirstName      string   `json:"first_name"`
	LastName       string   `json:"last_name"`
	FullName       string   `json:"full_name"`
	Name           string   `json:"name"`
	HindiName      *string  `json:"hindi_name,omitempty"`
	Role           string   `json:"role"`
	Phone          *string  `json:"phone,omitempty"`
	AvatarURL      *string  `json:"avatar_url"`
	Avatar         *string  `json:"avatar"`
	BatchYear      *int     `json:"batch_year,omitempty"`
	Batch          *int     `json:"batch,omitempty"`
	Degree         *string  `json:"degree,omitempty"`
	DepartmentName *string  `json:"department_name,omitempty"`
	CampusName     *string  `json:"campus_name,omitempty"`
	CurrentRole    *string  `json:"current_role,omitempty"`
	Company        *string  `json:"company,omitempty"`
	Location       *string  `json:"location,omitempty"`
	Bio            *string  `json:"bio,omitempty"`
	LinkedInURL    *string  `json:"linkedin_url,omitempty"`
	LinkedIn       *string  `json:"linkedin,omitempty"`
	OpenToMentor   bool     `json:"open_to_mentor"`
	OpenMentor     bool     `json:"openToMentor"`
	Skills         []string `json:"skills"`
}

type UpdateProfileRequest struct {
	FirstName         *string   `json:"first_name,omitempty"`
	LastName          *string   `json:"last_name,omitempty"`
	Name              *string   `json:"name,omitempty"`
	HindiName         *string   `json:"hindi_name,omitempty"`
	Phone             *string   `json:"phone,omitempty"`
	CurrentRole       *string   `json:"current_role,omitempty"`
	CurrentRoleCamel  *string   `json:"currentRole,omitempty"`
	Company           *string   `json:"company,omitempty"`
	Location          *string   `json:"location,omitempty"`
	Bio               *string   `json:"bio,omitempty"`
	AvatarURL         *string   `json:"avatar_url,omitempty"`
	Avatar            *string   `json:"avatar,omitempty"`
	RemoveAvatar      *bool     `json:"remove_avatar,omitempty"`
	RemoveAvatarCamel *bool     `json:"removeAvatar,omitempty"`
	LinkedInURL       *string   `json:"linkedin_url,omitempty"`
	LinkedIn          *string   `json:"linkedin,omitempty"`
	BatchYear         *int      `json:"batch_year,omitempty"`
	Batch             *string   `json:"batch,omitempty"`
	Degree            *string   `json:"degree,omitempty"`
	OpenToMentor      *bool     `json:"open_to_mentor,omitempty"`
	OpenMentor        *bool     `json:"openToMentor,omitempty"`
	Skills            *[]string `json:"skills,omitempty"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email"`
}

type ResetPasswordRequest struct {
	Email       string `json:"email"`
	OTP         string `json:"otp"`
	NewPassword string `json:"new_password"`
}

// Campus represents an MCU campus
type Campus struct {
	ID        uint   `json:"id"`
	Code      string `json:"code"`
	Name      string `json:"name"`
	HindiName string `json:"hindi_name"`
	Address   string `json:"address,omitempty"`
	IsActive  bool   `json:"is_active"`
}

// Department represents an academic faculty
type Department struct {
	ID          uint   `json:"id"`
	Code        string `json:"code"`
	Name        string `json:"name"`
	HindiName   string `json:"hindi_name"`
	Description string `json:"description,omitempty"`
}

// AlumniProfile represents an alumni directory record
type AlumniProfile struct {
	ID             uint      `json:"id"`
	UserID         uint      `json:"user_id"`
	EnrollmentNo   *string   `json:"enrollment_no,omitempty"`
	FirstName      string    `json:"first_name"`
	LastName       string    `json:"last_name"`
	FullName       string    `json:"full_name"`
	Name           string    `json:"name"`
	HindiName      *string   `json:"hindi_name,omitempty"`
	HindiNameAlt   *string   `json:"hindiName,omitempty"`
	Email          string    `json:"email"`
	BatchYear      int       `json:"batch_year"`
	Batch          int       `json:"batch"`
	Degree         string    `json:"degree"`
	DepartmentID   uint      `json:"department_id"`
	DepartmentName string    `json:"department_name"`
	Department     string    `json:"department"`
	CampusID       uint      `json:"campus_id"`
	CampusName     string    `json:"campus_name"`
	Campus         string    `json:"campus"`
	CurrentRole    string    `json:"current_role"`
	Role           string    `json:"currentRole"`
	Company        string    `json:"company"`
	Location       string    `json:"location"`
	Bio            string    `json:"bio"`
	AvatarURL      string    `json:"avatar_url"`
	Avatar         string    `json:"avatar"`
	LinkedInURL    *string   `json:"linkedin_url,omitempty"`
	LinkedIn       *string   `json:"linkedIn,omitempty"`
	TwitterURL     *string   `json:"twitter_url,omitempty"`
	PortfolioURL   *string   `json:"portfolio_url,omitempty"`
	OpenToMentor   bool      `json:"open_to_mentor"`
	OpenMentor     bool      `json:"openToMentor"`
	Skills         []string  `json:"skills"`
	CreatedAt      time.Time `json:"created_at"`
}

// HallOfFameLuminary represents an official MCU pride inductee
type HallOfFameLuminary struct {
	ID               uint     `json:"id"`
	Slug             string   `json:"slug"`
	Name             string   `json:"name"`
	HindiName        string   `json:"hindi_name"`
	Category         string   `json:"category"` // rng, creative, leader
	AwardTitle       string   `json:"award_title"`
	AwardTitleEN     *string  `json:"award_title_en,omitempty"`
	BatchInfo        string   `json:"batch_info"`
	DegreeInfo       *string  `json:"degree_info,omitempty"`
	CurrentRole      string   `json:"current_role"`
	CurrentRoleEN    *string  `json:"current_role_en,omitempty"`
	CompanyName      string   `json:"company_name"`
	ImageURL         string   `json:"image_url"`
	FallbackImageURL string   `json:"fallback_image_url"`
	IsPoster         bool     `json:"is_poster"`
	IsBanner         bool     `json:"is_banner"`
	Quote            string   `json:"quote"`
	QuoteEN          *string  `json:"quote_en,omitempty"`
	OfficialSource   string   `json:"official_source"`
	DisplayOrder     int      `json:"display_order"`
	Achievements     []string `json:"achievements,omitempty"`
}

// Event represents an MCU event (Abhyuday 2026, Conclaves)
type Event struct {
	ID                uint     `json:"id"`
	Slug              string   `json:"slug"`
	Title             string   `json:"title"`
	HindiTitle        string   `json:"hindi_title"`
	Category          string   `json:"category"`
	EventDate         string   `json:"event_date"` // YYYY-MM-DD
	StartTime         *string  `json:"start_time,omitempty"`
	EndTime           *string  `json:"end_time,omitempty"`
	Venue             string   `json:"venue"`
	CampusID          *uint    `json:"campus_id,omitempty"`
	CampusName        *string  `json:"campus_name,omitempty"`
	Description       string   `json:"description"`
	HindiDescription  *string  `json:"hindi_description,omitempty"`
	BannerURL         string   `json:"banner_url"`
	FallbackBannerURL *string  `json:"fallback_banner_url,omitempty"`
	TotalSeats        int      `json:"total_seats"`
	RSVPCount         int      `json:"rsvp_count"`
	OrganizerName     string   `json:"organizer_name"`
	IsOfficialMCU     bool     `json:"is_official_mcu"`
	BadgeText         *string  `json:"badge_text,omitempty"`
	Status            string   `json:"status"`
	Tags              []string `json:"tags,omitempty"`
}

type RSVPRequest struct {
	AttendeeName  string  `json:"attendee_name"`
	AttendeeEmail string  `json:"attendee_email"`
	AttendeePhone *string `json:"attendee_phone,omitempty"`
	BatchYear     *int    `json:"batch_year,omitempty"`
	Campus        *string `json:"campus,omitempty"`
	GuestCount    int     `json:"guest_count"`
}

// Job represents a job opening
type Job struct {
	ID                  uint      `json:"id"`
	PostedByUserID      *uint     `json:"posted_by_user_id,omitempty"`
	PostedByEmail       *string   `json:"posted_by_email,omitempty"`
	Title               string    `json:"title"`
	CompanyName         string    `json:"company_name"`
	CompanyLogoURL      *string   `json:"company_logo_url,omitempty"`
	Location            string    `json:"location"`
	JobType             string    `json:"job_type"` // Full-time, Part-time, Internship, Contract, Remote
	ExperienceRequired  *string   `json:"experience_required,omitempty"`
	SalaryRange         *string   `json:"salary_range,omitempty"`
	DeadlineDate        *string   `json:"deadline_date,omitempty"`
	Description         string    `json:"description"`
	ReferralAlumnusName *string   `json:"referral_alumnus_name,omitempty"`
	ReferralRole        *string   `json:"referral_role,omitempty"`
	Status              string    `json:"status"`
	CreatedAt           time.Time `json:"created_at"`
}

// MentorshipRequest represents a 1-on-1 mentorship inquiry and session schedule
type MentorshipRequest struct {
	ID             uint      `json:"id"`
	MentorAlumniID uint      `json:"mentor_alumni_id"`
	MentorEmail    string    `json:"mentor_email,omitempty"`
	MentorName     string    `json:"mentor_name,omitempty"`
	MentorRole     string    `json:"mentor_role,omitempty"`
	MentorCompany  string    `json:"mentor_company,omitempty"`
	MenteeUserID   *uint     `json:"mentee_user_id,omitempty"`
	MenteeName     string    `json:"mentee_name"`
	MenteeEmail    string    `json:"mentee_email"`
	MenteePhone    *string   `json:"mentee_phone,omitempty"`
	MenteeStatus   string    `json:"mentee_status"` // Student, Alumni, Professional
	Topic          string    `json:"topic"`
	PreferredTime  *string   `json:"preferred_time,omitempty"`
	Message        string    `json:"message"`
	Status         string    `json:"status"` // pending, scheduled, accepted, completed, declined
	SessionDate    *string   `json:"session_date,omitempty"`
	SessionTime    *string   `json:"session_time,omitempty"`
	SessionMode    *string   `json:"session_mode,omitempty"`
	MeetingLink    *string   `json:"meeting_link,omitempty"`
	MentorNote     *string   `json:"mentor_note,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
}

// CampusMemory represents a photo archive record
type CampusMemory struct {
	ID               uint      `json:"id"`
	Slug             string    `json:"slug"`
	Title            string    `json:"title"`
	HindiTitle       string    `json:"hindi_title"`
	Category         string    `json:"category"` // library, studios, labs, auditorium, culture, heritage
	AcademicYear     string    `json:"academic_year"`
	CampusID         *uint     `json:"campus_id,omitempty"`
	CampusName       *string   `json:"campus_name,omitempty"`
	Description      string    `json:"description"`
	HindiDescription *string   `json:"hindi_description,omitempty"`
	ImageURL         string    `json:"image_url"`
	FallbackImageURL *string   `json:"fallback_image_url,omitempty"`
	Credit           *string   `json:"credit,omitempty"`
	DisplayOrder     int       `json:"display_order"`
	CreatedAt        time.Time `json:"created_at"`
}

// GivingInitiative represents a fundraising/scholarship drive
type GivingInitiative struct {
	ID               uint      `json:"id"`
	Slug             string    `json:"slug"`
	Title            string    `json:"title"`
	HindiTitle       string    `json:"hindi_title"`
	Category         string    `json:"category"` // scholarship, infrastructure, fellowship, emergency_fund
	TargetAmount     float64   `json:"target_amount"`
	RaisedAmount     float64   `json:"raised_amount"`
	Description      string    `json:"description"`
	HindiDescription *string   `json:"hindi_description,omitempty"`
	ImageURL         string    `json:"image_url"`
	Status           string    `json:"status"`
	CreatedAt        time.Time `json:"created_at"`
}

type DonationRequest struct {
	InitiativeID uint    `json:"initiative_id"`
	DonorName    string  `json:"donor_name"`
	DonorEmail   string  `json:"donor_email"`
	PanNumber    *string `json:"pan_number,omitempty"`
	Amount       float64 `json:"amount"`
	IsAnonymous  bool    `json:"is_anonymous"`
}

type DashboardStats struct {
	TotalAlumni       int     `json:"total_alumni"`
	AvailableMentors  int     `json:"available_mentors"`
	UpcomingEvents    int     `json:"upcoming_events"`
	ActiveJobs        int     `json:"active_jobs"`
	CampusMemories    int     `json:"campus_memories"`
	TotalGivingRaised float64 `json:"total_giving_raised"`
}
