package services

import (
	"bytes"
	"crypto/tls"
	"encoding/base64"
	"fmt"
	"log"
	"net"
	"net/smtp"
	"os"
	"strings"
	"time"

	"mcu-alumni-backend/internal/config"

	"github.com/joho/godotenv"
)

type EmailService struct {
	cfg *config.Config
}

func NewEmailService(cfg *config.Config) *EmailService {
	return &EmailService{cfg: cfg}
}

// loadFreshConfig re-reads .env dynamically so credential changes take effect immediately
func (s *EmailService) loadFreshConfig() {
	for _, envFile := range []string{".env", "backend/.env", "../.env"} {
		if _, err := os.Stat(envFile); err == nil {
			_ = godotenv.Overload(envFile)
		}
	}
	if u := strings.TrimSpace(os.Getenv("SMTP_USER")); u != "" {
		s.cfg.SMTPUser = u
	}
	if p := strings.TrimSpace(os.Getenv("SMTP_PASS")); p != "" {
		s.cfg.SMTPPassword = p
	}
	if h := strings.TrimSpace(os.Getenv("SMTP_HOST")); h != "" {
		s.cfg.SMTPHost = h
	}
	if pt := strings.TrimSpace(os.Getenv("SMTP_PORT")); pt != "" {
		s.cfg.SMTPPort = pt
	}
	if f := strings.TrimSpace(os.Getenv("SMTP_FROM")); f != "" {
		s.cfg.SMTPFrom = f
	}
}

// IsConfigured returns true if SMTP credentials are provided
func (s *EmailService) IsConfigured() bool {
	s.loadFreshConfig()
	return strings.TrimSpace(s.cfg.SMTPUser) != "" && strings.TrimSpace(s.cfg.SMTPPassword) != ""
}

// SendPasswordResetEmail sends a real email containing the 6-digit OTP
func (s *EmailService) SendPasswordResetEmail(recipientEmail, recipientName, otpCode string) error {
	if strings.TrimSpace(recipientName) == "" {
		recipientName = "MCU Alumnus"
	}

	subject := fmt.Sprintf("MCU Alumni Portal - Password Reset Verification Code: %s", otpCode)
	htmlBody := s.buildPasswordResetHTML(recipientEmail, recipientName, otpCode)

	return s.SendHTMLMail(recipientEmail, subject, htmlBody)
}

// SendHTMLMail connects to the configured SMTP server and delivers the HTML email
func (s *EmailService) SendHTMLMail(to, subject, htmlBody string) error {
	s.loadFreshConfig()

	host := strings.TrimSpace(s.cfg.SMTPHost)
	port := strings.TrimSpace(s.cfg.SMTPPort)
	user := strings.TrimSpace(s.cfg.SMTPUser)
	// Strip any spaces from the App Password (e.g. "uxhy fckz ojvh rcvb" -> "uxhyfckzojvhrcvb")
	pass := strings.ReplaceAll(strings.TrimSpace(s.cfg.SMTPPassword), " ", "")
	from := strings.TrimSpace(s.cfg.SMTPFrom)

	if host == "" {
		host = "smtp.gmail.com"
	}
	if port == "" {
		port = "587"
	}

	if user == "" || pass == "" {
		log.Printf("\n========================================================================")
		log.Printf("[MCU EMAIL SERVICE] ⚠️ SMTP_USER / SMTP_PASS not set in .env")
		log.Printf("Recipient: %s", to)
		log.Printf("Subject  : %s", subject)
		log.Printf("Action   : Please set SMTP_USER and SMTP_PASS in .env to deliver real emails")
		log.Printf("========================================================================\n")
		return fmt.Errorf("SMTP credentials not configured on server. Please configure SMTP_USER and SMTP_PASS in .env to send real emails.")
	}

	// Gmail SMTP requires the From header to reflect the authenticated user
	if from == "" || strings.Contains(from, "noreply@mcu.ac.in") {
		from = fmt.Sprintf("MCU Alumni Portal <%s>", user)
	}

	headers := make(map[string]string)
	headers["From"] = from
	headers["To"] = to
	headers["Subject"] = "=?UTF-8?B?" + base64.StdEncoding.EncodeToString([]byte(subject)) + "?="
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = "text/html; charset=UTF-8"
	headers["Date"] = time.Now().Format(time.RFC1123Z)

	var msg bytes.Buffer
	for k, v := range headers {
		msg.WriteString(fmt.Sprintf("%s: %s\r\n", k, v))
	}
	msg.WriteString("\r\n")
	msg.WriteString(htmlBody)

	addr := net.JoinHostPort(host, port)
	auth := smtp.PlainAuth("", user, pass, host)

	// SSL/TLS Direct connection (Port 465)
	if port == "465" {
		tlsConfig := &tls.Config{
			ServerName: host,
		}
		conn, err := tls.Dial("tcp", addr, tlsConfig)
		if err != nil {
			return fmt.Errorf("TLS dial to %s failed: %w", addr, err)
		}
		defer conn.Close()

		client, err := smtp.NewClient(conn, host)
		if err != nil {
			return fmt.Errorf("SMTP client creation failed: %w", err)
		}
		defer client.Quit()

		if err = client.Auth(auth); err != nil {
			return fmt.Errorf("SMTP auth failed: %w", err)
		}

		if err = client.Mail(user); err != nil {
			return fmt.Errorf("SMTP MAIL failed: %w", err)
		}
		if err = client.Rcpt(to); err != nil {
			return fmt.Errorf("SMTP RCPT failed: %w", err)
		}

		w, err := client.Data()
		if err != nil {
			return fmt.Errorf("SMTP DATA failed: %w", err)
		}
		if _, err = w.Write(msg.Bytes()); err != nil {
			return fmt.Errorf("SMTP write body failed: %w", err)
		}
		if err = w.Close(); err != nil {
			return fmt.Errorf("SMTP data close failed: %w", err)
		}
		log.Printf("[MCU EMAIL SERVICE] ✅ Email delivered via SSL (Port 465) to: %s", to)
		return nil
	}

	// Standard STARTTLS connection (Port 587)
	err := smtp.SendMail(addr, auth, user, []string{to}, msg.Bytes())
	if err != nil {
		return fmt.Errorf("SMTP SendMail to %s failed: %w", addr, err)
	}

	log.Printf("[MCU EMAIL SERVICE] ✅ Verification email delivered via SMTP (Port %s) to: %s", port, to)
	return nil
}

// buildPasswordResetHTML generates an official, beautiful responsive email template
func (s *EmailService) buildPasswordResetHTML(recipientEmail, recipientName, otpCode string) string {
	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%%" style="background-color: #f1f5f9; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04); border: 1px solid #e2e8f0;">

          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #003366 0%%, #002244 55%%, #8d0303 100%%); padding: 32px 28px; text-align: center; color: #ffffff;">
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 800; color: #fcd34d; margin-bottom: 6px;">
                माखनलाल चतुर्वेदी राष्ट्रीय पत्रकारिता एवं संचार विश्वविद्यालय
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;">
                MCU Alumni Portal
              </h1>
              <div style="font-size: 12px; color: #e2e8f0; margin-top: 4px; font-weight: 500;">
                Alumni Association • Password Reset Verification
              </div>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 32px; color: #1e293b;">
              <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #0f172a;">
                Dear %s,
              </h2>

              <p style="margin: 0 0 18px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                We received a request to reset the login password for your MCU Alumni account (<strong>%s</strong>). Please use the 6-digit verification code below to complete your password reset:
              </p>

              <!-- OTP Box -->
              <div style="background: #f8fafc; border: 2px dashed #003366; border-radius: 14px; padding: 22px 16px; text-align: center; margin: 26px 0;">
                <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">
                  VERIFICATION OTP
                </div>
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #003366; line-height: 1.2;">
                  %s
                </div>
                <div style="font-size: 12px; color: #dc2626; font-weight: 600; margin-top: 10px; display: inline-block; background-color: #fee2e2; padding: 4px 12px; border-radius: 9999px;">
                  ⏳ Valid for 15 minutes only
                </div>
              </div>

              <!-- Security Notice -->
              <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 6px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #92400e;">
                  <strong>Security Notice:</strong> Never share this verification code with anyone. MCU staff or administrators will never ask for your OTP or account password.
                </p>
              </div>

              <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #64748b;">
                If you did not request a password reset, you can safely disregard this email. Your existing password will remain secure.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.6;">
              <p style="margin: 0 0 6px 0; font-weight: 600; color: #64748b;">
                Makhanlal Chaturvedi National University of Journalism and Communication
              </p>
              <p style="margin: 0 0 6px 0;">
                Bishankhedi Campus, Bhadbhada Road, Bhopal (M.P.) - 462044
              </p>
              <p style="margin: 0; color: #cbd5e1; font-size: 11px;">
                © 2026 MCU Alumni Association. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`, recipientName, recipientEmail, otpCode)
}

// SendJobApplicationNotification sends an official email notification to the alumnus when a student applies
func (s *EmailService) SendJobApplicationNotification(
	recipientEmail, recipientName string,
	jobTitle, companyName string,
	applicantName, applicantEmail, applicantPhone, applicantDegree, applicantBatch string,
	portfolioURL, resumeFileName, coverNote string,
) error {
	if strings.TrimSpace(recipientName) == "" {
		recipientName = "MCU Alumnus"
	}
	if strings.TrimSpace(jobTitle) == "" {
		jobTitle = "Career Opportunity"
	}
	if strings.TrimSpace(companyName) == "" {
		companyName = "Your Organization"
	}

	subject := fmt.Sprintf("New Referral Application: %s applied for %s at %s", applicantName, jobTitle, companyName)
	htmlBody := s.buildJobApplicationNotificationHTML(
		recipientName, jobTitle, companyName,
		applicantName, applicantEmail, applicantPhone, applicantDegree, applicantBatch,
		portfolioURL, resumeFileName, coverNote,
	)

	return s.SendHTMLMail(recipientEmail, subject, htmlBody)
}

func (s *EmailService) buildJobApplicationNotificationHTML(
	recipientName, jobTitle, companyName string,
	applicantName, applicantEmail, applicantPhone, applicantDegree, applicantBatch string,
	portfolioURL, resumeFileName, coverNote string,
) string {
	if applicantPhone == "" {
		applicantPhone = "Not provided"
	}
	if applicantDegree == "" {
		applicantDegree = "Computer Science / Journalism"
	}
	if applicantBatch == "" {
		applicantBatch = "Recent Batch"
	}
	if coverNote == "" {
		coverNote = "The student has requested an alumni referral for this position."
	}
	if resumeFileName == "" {
		resumeFileName = "Resume attached in portal"
	}
	if portfolioURL == "" {
		portfolioURL = "Not provided"
	}

	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Referral Application</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%%" style="background-color: #f1f5f9; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04); border: 1px solid #e2e8f0;">

          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #003366 0%%, #002244 55%%, #8d0303 100%%); padding: 32px 28px; text-align: center; color: #ffffff;">
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 800; color: #fcd34d; margin-bottom: 6px;">
                माखनलाल चतुर्वेदी राष्ट्रीय पत्रकारिता एवं संचार विश्वविद्यालय
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;">
                MCU Alumni Portal
              </h1>
              <div style="font-size: 13px; color: #fde047; margin-top: 6px; font-weight: 600;">
                ⭐ New Student Referral Application Alert
              </div>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; color: #1e293b;">
              <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #003366;">
                Dear %s,
              </h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                A student from the university has submitted an application requesting your alumni referral for the opportunity you posted: <strong>%s</strong> (%s).
              </p>

              <!-- Position Card -->
              <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #fc4a00; border-radius: 8px; padding: 16px 18px; margin-bottom: 22px;">
                <div style="font-size: 11px; text-transform: uppercase; font-weight: 800; color: #8d0303; margin-bottom: 4px;">
                  Target Position & Organization
                </div>
                <div style="font-size: 16px; font-weight: 700; color: #003366;">
                  %s
                </div>
                <div style="font-size: 13px; color: #64748b; margin-top: 2px;">
                  %s
                </div>
              </div>

              <!-- Student Profile Details Table -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%%" style="border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 22px; font-size: 13px;">
                <tr style="background-color: #f1f5f9;">
                  <td colspan="2" style="padding: 10px 14px; font-weight: 700; color: #003366; border-bottom: 1px solid #e2e8f0;">
                    👨‍🎓 Applicant Student Details
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-weight: 600; color: #64748b; width: 35%%; border-bottom: 1px solid #f1f5f9;">Full Name:</td>
                  <td style="padding: 10px 14px; font-weight: 700; color: #1e293b; border-bottom: 1px solid #f1f5f9;">%s</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-weight: 600; color: #64748b; border-bottom: 1px solid #f1f5f9;">Department / Degree:</td>
                  <td style="padding: 10px 14px; color: #1e293b; border-bottom: 1px solid #f1f5f9;">%s</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-weight: 600; color: #64748b; border-bottom: 1px solid #f1f5f9;">Batch / Roll No:</td>
                  <td style="padding: 10px 14px; color: #1e293b; border-bottom: 1px solid #f1f5f9;">%s</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-weight: 600; color: #64748b; border-bottom: 1px solid #f1f5f9;">Email Address:</td>
                  <td style="padding: 10px 14px; color: #0284c7; border-bottom: 1px solid #f1f5f9;"><a href="mailto:%s" style="color: #0284c7; text-decoration: none;">%s</a></td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-weight: 600; color: #64748b; border-bottom: 1px solid #f1f5f9;">Phone Number:</td>
                  <td style="padding: 10px 14px; color: #1e293b; border-bottom: 1px solid #f1f5f9;">%s</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-weight: 600; color: #64748b; border-bottom: 1px solid #f1f5f9;">Attached Resume / CV:</td>
                  <td style="padding: 10px 14px; font-weight: 600; color: #003366; border-bottom: 1px solid #f1f5f9;">📄 %s</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-weight: 600; color: #64748b;">Portfolio / LinkedIn:</td>
                  <td style="padding: 10px 14px; color: #0284c7;"><a href="%s" style="color: #0284c7; word-break: break-all;">%s</a></td>
                </tr>
              </table>

              <!-- Cover Pitch -->
              <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 16px; margin-bottom: 24px;">
                <div style="font-size: 12px; font-weight: 700; color: #92400e; margin-bottom: 6px;">
                  💬 Student's Cover Note & Pitch:
                </div>
                <div style="font-size: 13px; line-height: 1.6; color: #78350f; font-style: italic;">
                  "%s"
                </div>
              </div>

              <!-- Portal Login Callout -->
              <div style="text-align: center; margin-bottom: 24px;">
                <p style="font-size: 13px; color: #64748b; margin-bottom: 12px;">
                  You can log in to the portal to review this applicant's resume and manage their referral status:
                </p>
                <a href="http://localhost:5173" style="display: inline-block; background-color: #fc4a00; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(252, 74, 0, 0.3);">
                  Manage Referral in Alumni Portal →
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.6;">
              <p style="margin: 0 0 6px 0; font-weight: 600; color: #64748b;">
                Makhanlal Chaturvedi National University of Journalism and Communication
              </p>
              <p style="margin: 0 0 6px 0;">
                Bishankhedi Campus, Bhadbhada Road, Bhopal (M.P.) - 462044
              </p>
              <p style="margin: 0; color: #cbd5e1; font-size: 11px;">
                © 2026 MCU Alumni Association. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
		recipientName,
		jobTitle, companyName,
		jobTitle, companyName,
		applicantName,
		applicantDegree,
		applicantBatch,
		applicantEmail, applicantEmail,
		applicantPhone,
		resumeFileName,
		portfolioURL, portfolioURL,
		coverNote,
	)
}

// SendJobApplicationStatusNotification sends an email to the student when their referral application status is updated (e.g. accepted/referred)
func (s *EmailService) SendJobApplicationStatusNotification(
	studentEmail, studentName, alumniName, jobTitle, companyName, newStatus string,
) error {
	if strings.TrimSpace(studentEmail) == "" {
		return nil
	}
	if strings.TrimSpace(studentName) == "" {
		studentName = "MCU Student"
	}
	if strings.TrimSpace(alumniName) == "" {
		alumniName = "Distinguished MCU Alumnus"
	}

	var subject string
	if newStatus == "referred" || newStatus == "accepted" {
		subject = fmt.Sprintf("🎉 [MCU Referral Accepted] Congratulations %s! Your referral for %s was ACCEPTED by %s", studentName, jobTitle, alumniName)
	} else if newStatus == "under_review" {
		subject = fmt.Sprintf("🔍 [MCU Referral In Review] Your referral application for %s is being reviewed by %s", jobTitle, alumniName)
	} else {
		subject = fmt.Sprintf("[MCU Referral Update] Status update on your referral application for %s", jobTitle)
	}

	htmlBody := s.buildJobApplicationStatusHTML(studentName, alumniName, jobTitle, companyName, newStatus)
	return s.SendHTMLMail(studentEmail, subject, htmlBody)
}

func (s *EmailService) buildJobApplicationStatusHTML(
	studentName, alumniName, jobTitle, companyName, newStatus string,
) string {
	statusHeadline := "Application Status Update"
	statusBadgeColor := "#d97706"
	statusBadgeText := "UNDER REVIEW"
	messageBody := fmt.Sprintf("Your referral application is currently being reviewed by distinguished alumnus <strong>%s</strong>.", alumniName)
	infoBlock := `<div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 16px; margin-bottom: 22px;">
		<div style="font-size: 12px; font-weight: 700; color: #92400e; margin-bottom: 4px;">
			⏳ Current Status
		</div>
		<div style="font-size: 13px; line-height: 1.5; color: #b45309;">
			The alumnus is reviewing your attached resume and credentials. You will receive an email notification as soon as a decision is made.
		</div>
	</div>`

	if newStatus == "referred" || newStatus == "accepted" {
		statusHeadline = "🎉 Congratulations! Your Referral Application Has Been Accepted!"
		statusBadgeColor = "#059669"
		statusBadgeText = "✅ REFERRED TO HR / ACCEPTED"
		messageBody = fmt.Sprintf("Heartiest congratulations! Distinguished alumnus <strong>%s</strong> has accepted your referral application for <strong>%s</strong> (%s) and has officially endorsed and forwarded your profile to the hiring team / recruiter.", alumniName, jobTitle, companyName)
		infoBlock = `<div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 16px; margin-bottom: 22px;">
			<div style="font-size: 12px; font-weight: 700; color: #166534; margin-bottom: 4px;">
				📌 What happens next?
			</div>
			<div style="font-size: 13px; line-height: 1.5; color: #15803d;">
				The company's talent acquisition / recruiting team will review your application. If your profile is shortlisted, they will contact you directly via your registered email or phone number.
			</div>
		</div>`
	} else if newStatus == "rejected" {
		statusHeadline = "Referral Application Status Update"
		statusBadgeColor = "#dc2626"
		statusBadgeText = "NOT SHORTLISTED"
		messageBody = fmt.Sprintf("Distinguished alumnus <strong>%s</strong> has reviewed your referral application for <strong>%s</strong>. While your candidacy was not selected for this specific referral, we appreciate your interest and encourage you to explore other openings on the MCU Alumni Portal.", alumniName, jobTitle)
		infoBlock = `<div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px 16px; margin-bottom: 22px;">
			<div style="font-size: 12px; font-weight: 700; color: #991b1b; margin-bottom: 4px;">
				💡 Next steps for your career
			</div>
			<div style="font-size: 13px; line-height: 1.5; color: #b91c1c;">
				We encourage you to explore other openings, connect with mentors across batches, and keep your resume updated in your portal profile.
			</div>
		</div>`
	}

	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MCU Referral Application Status</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%%" style="background-color: #f1f5f9; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%%" style="max-width: 620px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 51, 102, 0.1); border: 1px solid #e2e8f0;">

          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #003366 0%%, #002244 50%%, #8d0303 100%%); padding: 26px 32px; text-align: left; border-bottom: 4px solid #fc4a00;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%%">
                <tr>
                  <td>
                    <div style="color: #fc4a00; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px;">
                      माखनलाल चतुर्वेदी राष्ट्रीय पत्रकारिता एवं संचार विश्वविद्यालय
                    </div>
                    <div style="color: #ffffff; font-size: 19px; font-weight: 700; font-family: Georgia, serif;">
                      MCU Alumni & Student Referral Network
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <div style="display: inline-block; padding: 5px 12px; background-color: %s; color: #ffffff; font-weight: 800; font-size: 11px; border-radius: 6px; letter-spacing: 0.5px; margin-bottom: 14px;">
                %s
              </div>

              <h2 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700; color: #003366;">
                %s
              </h2>

              <p style="margin: 0 0 18px 0; font-size: 14px; line-height: 1.6; color: #334155;">
                <strong>Dear %s,</strong> %s
              </p>

              <!-- Position Card -->
              <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #003366; border-radius: 8px; padding: 16px 18px; margin-bottom: 22px;">
                <div style="font-size: 11px; text-transform: uppercase; font-weight: 800; color: #8d0303; margin-bottom: 4px;">
                  Target Position & Organization
                </div>
                <div style="font-size: 16px; font-weight: 700; color: #003366;">
                  %s
                </div>
                <div style="font-size: 13px; color: #64748b; margin-top: 2px;">
                  %s • Referred by %s
                </div>
              </div>

              <!-- Next Steps Callout -->
              %s

              <!-- Portal Login Callout -->
              <div style="text-align: center; margin-bottom: 20px;">
                <a href="http://localhost:5173" style="display: inline-block; background-color: #003366; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 12px 26px; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(0, 51, 102, 0.3);">
                  View Applied Jobs in MCU Portal →
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center; color: #94a3b8; font-size: 11px; line-height: 1.6;">
              <p style="margin: 0 0 4px 0; font-weight: 600; color: #64748b;">
                Makhanlal Chaturvedi National University of Journalism and Communication
              </p>
              <p style="margin: 0;">
                Bhopal, Madhya Pradesh - 462044 | © 2026 MCU Alumni Association
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
		statusBadgeColor,
		statusBadgeText,
		statusHeadline,
		studentName,
		messageBody,
		jobTitle,
		companyName, alumniName,
		infoBlock,
	)
}

// SendMentorshipRequestNotification sends an official email to the alumnus when a student/user requests 1-on-1 mentorship
func (s *EmailService) SendMentorshipRequestNotification(
	mentorEmail, mentorName, mentorRole, mentorCompany string,
	menteeName, menteeEmail, menteePhone, menteeStatus string,
	topic, preferredTime, message string,
) error {
	if strings.TrimSpace(mentorEmail) == "" {
		return nil
	}
	if strings.TrimSpace(mentorName) == "" {
		mentorName = "Distinguished MCU Alumnus"
	}
	if strings.TrimSpace(topic) == "" {
		topic = "Career & Software Engineering Guidance"
	}
	if strings.TrimSpace(menteePhone) == "" {
		menteePhone = "Not provided"
	}
	if strings.TrimSpace(preferredTime) == "" {
		preferredTime = "Flexible / Weekend Evening"
	}
	if strings.TrimSpace(menteeStatus) == "" {
		menteeStatus = "Current MCU Student"
	}

	subject := fmt.Sprintf("🧭 [MCU Mentorship Request] %s requested mentorship on %s", menteeName, topic)
	htmlBody := fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>New Mentorship Request</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:28px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 10px 25px -5px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#003366 0%%,#002244 55%%,#fc4a00 100%%);padding:28px;text-align:center;color:#ffffff;">
              <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:800;color:#fcd34d;margin-bottom:6px;">
                माखनलाल चतुर्वेदी राष्ट्रीय पत्रकारिता एवं संचार विश्वविद्यालय
              </div>
              <h1 style="margin:0;font-size:21px;font-weight:700;color:#ffffff;">MCU 1-on-1 Mentorship Hub</h1>
              <div style="font-size:13px;color:#fde047;margin-top:6px;font-weight:600;">
                🧭 New Student Mentorship Session Request
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;color:#1e293b;">
              <h2 style="margin:0 0 10px 0;font-size:18px;color:#003366;">Dear %s,</h2>
              <p style="margin:0 0 18px 0;font-size:14px;line-height:1.6;color:#475569;">
                <strong>%s</strong> (%s) has requested a 1-on-1 mentorship session with you regarding <strong>%s</strong>. Please review their request and schedule a session according to your availability in your MCU Alumni Portal account.
              </p>
              <div style="background:#f8fafc;border:1px solid #cbd5e1;border-left:4px solid #fc4a00;border-radius:10px;padding:15px 18px;margin-bottom:20px;">
                <div style="font-size:11px;text-transform:uppercase;font-weight:800;color:#8d0303;margin-bottom:4px;">Mentorship Topic & Preferred Slot</div>
                <div style="font-size:16px;font-weight:700;color:#003366;">%s</div>
                <div style="font-size:13px;color:#475569;margin-top:4px;">⏰ Preferred Slot by Student: <strong>%s</strong></div>
              </div>
              <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:20px;font-size:13px;">
                <tr style="background:#f1f5f9;">
                  <td colspan="2" style="padding:10px 14px;font-weight:700;color:#003366;border-bottom:1px solid #e2e8f0;">👨‍🎓 Mentee Details</td>
                </tr>
                <tr>
                  <td style="padding:9px 14px;font-weight:600;color:#64748b;width:36%%;border-bottom:1px solid #f1f5f9;">Full Name:</td>
                  <td style="padding:9px 14px;font-weight:700;color:#1e293b;border-bottom:1px solid #f1f5f9;">%s</td>
                </tr>
                <tr>
                  <td style="padding:9px 14px;font-weight:600;color:#64748b;border-bottom:1px solid #f1f5f9;">Category:</td>
                  <td style="padding:9px 14px;color:#1e293b;border-bottom:1px solid #f1f5f9;">%s</td>
                </tr>
                <tr>
                  <td style="padding:9px 14px;font-weight:600;color:#64748b;border-bottom:1px solid #f1f5f9;">Email:</td>
                  <td style="padding:9px 14px;color:#0284c7;border-bottom:1px solid #f1f5f9;"><a href="mailto:%s" style="color:#0284c7;text-decoration:none;">%s</a></td>
                </tr>
                <tr>
                  <td style="padding:9px 14px;font-weight:600;color:#64748b;">Phone:</td>
                  <td style="padding:9px 14px;color:#1e293b;">%s</td>
                </tr>
              </table>
              <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:15px;margin-bottom:22px;">
                <div style="font-size:12px;font-weight:700;color:#92400e;margin-bottom:6px;">💬 Student's Career / Guidance Question:</div>
                <div style="font-size:13px;line-height:1.6;color:#78350f;font-style:italic;">"%s"</div>
              </div>
              <div style="text-align:center;">
                <a href="http://localhost:5173" style="display:inline-block;background-color:#fc4a00;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 26px;border-radius:10px;">
                  Schedule Session in Alumni Account →
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
		mentorName,
		menteeName, menteeStatus, topic,
		topic, preferredTime,
		menteeName, menteeStatus, menteeEmail, menteeEmail, menteePhone,
		message,
	)

	return s.SendHTMLMail(mentorEmail, subject, htmlBody)
}

// SendMentorshipStatusNotification sends an email to the student when the alumnus schedules or updates their mentorship session
func (s *EmailService) SendMentorshipStatusNotification(
	menteeEmail, menteeName string,
	mentorName, mentorRole, mentorCompany string,
	topic, status, sessionDate, sessionTime, sessionMode, meetingLink, mentorNote string,
) error {
	if strings.TrimSpace(menteeEmail) == "" {
		return nil
	}
	if strings.TrimSpace(menteeName) == "" {
		menteeName = "MCU Student"
	}
	if strings.TrimSpace(mentorName) == "" {
		mentorName = "Distinguished MCU Alumnus"
	}

	var subject string
	badgeColor := "#059669"
	badgeText := "✅ SESSION SCHEDULED & CONFIRMED"
	headline := "🎉 Your 1-on-1 Mentorship Session is Scheduled!"

	if status == "declined" || status == "rejected" {
		subject = fmt.Sprintf("[MCU Mentorship Update] Update on your mentorship request with %s", mentorName)
		badgeColor = "#dc2626"
		badgeText = "UNAVAILABLE AT THIS TIME"
		headline = "Mentorship Request Status Update"
	} else if status == "completed" {
		subject = fmt.Sprintf("✅ [MCU Mentorship Completed] Thank you for completing your session with %s", mentorName)
		badgeColor = "#0284c7"
		badgeText = "COMPLETED"
		headline = "Mentorship Session Completed"
	} else {
		subject = fmt.Sprintf("🎉 [MCU Mentorship Scheduled] %s scheduled your session on %s (%s)", mentorName, sessionDate, sessionTime)
	}

	if sessionDate == "" {
		sessionDate = "Upcoming Slot (Check Portal)"
	}
	if sessionTime == "" {
		sessionTime = "As per mutual convenience"
	}
	if sessionMode == "" {
		sessionMode = "Google Meet / Virtual Call"
	}
	if mentorNote == "" {
		mentorNote = "Looking forward to guiding you on your career and technical journey!"
	}

	linkHTML := ""
	if strings.TrimSpace(meetingLink) != "" {
		linkHTML = fmt.Sprintf(`<div style="margin-top:8px;"><a href="%s" style="color:#0284c7;font-weight:700;">🔗 Join / Open Session Link: %s</a></div>`, meetingLink, meetingLink)
	}

	htmlBody := fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Mentorship Session Update</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:28px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 10px 25px -5px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#003366 0%%,#002244 55%%,#059669 100%%);padding:26px 28px;color:#ffffff;">
              <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;font-weight:800;color:#fcd34d;margin-bottom:4px;">
                माखनलाल चतुर्वेदी राष्ट्रीय पत्रकारिता एवं संचार विश्वविद्यालय
              </div>
              <div style="font-size:20px;font-weight:700;">MCU Alumni Mentorship Network</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;color:#1e293b;">
              <div style="display:inline-block;padding:5px 12px;background-color:%s;color:#ffffff;font-weight:800;font-size:11px;border-radius:6px;margin-bottom:12px;">%s</div>
              <h2 style="margin:0 0 10px 0;font-size:18px;color:#003366;">%s</h2>
              <p style="margin:0 0 18px 0;font-size:14px;line-height:1.6;color:#334155;">
                Dear <strong>%s</strong>, distinguished alumnus <strong>%s</strong> has updated your mentorship session request for <strong>%s</strong>.
              </p>
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-left:4px solid #059669;border-radius:10px;padding:16px 18px;margin-bottom:20px;font-size:13px;line-height:1.7;">
                <div style="font-size:12px;text-transform:uppercase;font-weight:800;color:#166534;margin-bottom:6px;">📅 Confirmed Session Schedule (Alumnus Availability)</div>
                <div><strong>Mentor:</strong> %s (%s %s)</div>
                <div><strong>Topic:</strong> %s</div>
                <div><strong>Session Date:</strong> %s</div>
                <div><strong>Session Time:</strong> %s</div>
                <div><strong>Mode:</strong> %s</div>
                %s
              </div>
              <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 16px;margin-bottom:22px;">
                <div style="font-size:12px;font-weight:700;color:#92400e;margin-bottom:4px;">💬 Message from Mentor:</div>
                <div style="font-size:13px;color:#78350f;font-style:italic;">"%s"</div>
              </div>
              <div style="text-align:center;">
                <a href="http://localhost:5173" style="display:inline-block;background-color:#003366;color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;padding:12px 26px;border-radius:10px;">
                  View Session Details in Your Account →
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
		badgeColor, badgeText, headline,
		menteeName, mentorName, topic,
		mentorName, mentorRole, mentorCompany,
		topic, sessionDate, sessionTime, sessionMode,
		linkHTML,
		mentorNote,
	)

	return s.SendHTMLMail(menteeEmail, subject, htmlBody)
}
