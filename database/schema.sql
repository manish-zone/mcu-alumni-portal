-- =============================================================================
-- Makhanlal Chaturvedi National University of Journalism and Communication (MCU)
-- Bhopal, Madhya Pradesh, India
-- Alumni Portal Relational Database Schema (MySQL 8.0+)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `mcu_alumni_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `mcu_alumni_db`;

-- Disable foreign key checks during schema creation
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. UNIVERSITY METADATA & GLOBAL SETTINGS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `university_metadata`;
CREATE TABLE `university_metadata` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `meta_key` VARCHAR(64) NOT NULL UNIQUE,
  `meta_value` TEXT NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. CAMPUSES (Bhopal Bishankhedi, Khandwa, Rewa, Datia)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `campuses`;
CREATE TABLE `campuses` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(32) NOT NULL UNIQUE,
  `name` VARCHAR(128) NOT NULL,
  `hindi_name` VARCHAR(128) NOT NULL,
  `address` TEXT DEFAULT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. ACADEMIC DEPARTMENTS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `departments`;
CREATE TABLE `departments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(32) NOT NULL UNIQUE,
  `name` VARCHAR(128) NOT NULL,
  `hindi_name` VARCHAR(128) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. USER ACCOUNTS & AUTHENTICATION
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) DEFAULT NULL,
  `google_id` VARCHAR(128) DEFAULT NULL,
  `auth_provider` VARCHAR(32) NOT NULL DEFAULT 'local',
  `phone` VARCHAR(20) DEFAULT NULL,
  `role` ENUM('alumni', 'student', 'faculty', 'admin') NOT NULL DEFAULT 'alumni',
  `is_verified` BOOLEAN DEFAULT FALSE,
  `is_active` BOOLEAN DEFAULT TRUE,
  `last_login` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_google_id` (`google_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. ALUMNI PROFILES
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `alumni_profiles`;
CREATE TABLE `alumni_profiles` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL UNIQUE,
  `enrollment_no` VARCHAR(64) DEFAULT NULL UNIQUE,
  `first_name` VARCHAR(64) NOT NULL,
  `last_name` VARCHAR(64) NOT NULL,
  `hindi_name` VARCHAR(128) DEFAULT NULL,
  `batch_year` SMALLINT UNSIGNED NOT NULL,
  `degree` VARCHAR(128) NOT NULL,
  `department_id` INT UNSIGNED DEFAULT NULL,
  `campus_id` INT UNSIGNED DEFAULT NULL,
  `current_role` VARCHAR(128) NOT NULL,
  `company` VARCHAR(128) NOT NULL,
  `location` VARCHAR(128) DEFAULT NULL,
  `bio` TEXT DEFAULT NULL,
  `avatar_url` MEDIUMTEXT DEFAULT NULL,
  `linkedin_url` VARCHAR(512) DEFAULT NULL,
  `twitter_url` VARCHAR(512) DEFAULT NULL,
  `portfolio_url` VARCHAR(512) DEFAULT NULL,
  `open_to_mentor` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_alumni_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_alumni_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_alumni_campus` FOREIGN KEY (`campus_id`) REFERENCES `campuses` (`id`) ON DELETE SET NULL,
  INDEX `idx_alumni_batch` (`batch_year`),
  INDEX `idx_alumni_company` (`company`),
  INDEX `idx_alumni_location` (`location`),
  INDEX `idx_alumni_mentor` (`open_to_mentor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. SKILLS & ALUMNI SKILL MAPPINGS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `skills`;
CREATE TABLE `skills` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(64) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `alumni_skills`;
CREATE TABLE `alumni_skills` (
  `alumni_id` INT UNSIGNED NOT NULL,
  `skill_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`alumni_id`, `skill_id`),
  CONSTRAINT `fk_askill_alumni` FOREIGN KEY (`alumni_id`) REFERENCES `alumni_profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_askill_skill` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. MENTORSHIP TOPICS & MAPPINGS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `mentorship_topics`;
CREATE TABLE `mentorship_topics` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(128) NOT NULL UNIQUE,
  `hindi_name` VARCHAR(128) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `alumni_mentorship_topics`;
CREATE TABLE `alumni_mentorship_topics` (
  `alumni_id` INT UNSIGNED NOT NULL,
  `topic_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`alumni_id`, `topic_id`),
  CONSTRAINT `fk_amtopic_alumni` FOREIGN KEY (`alumni_id`) REFERENCES `alumni_profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_amtopic_topic` FOREIGN KEY (`topic_id`) REFERENCES `mentorship_topics` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. HALL OF FAME (LUMINARIES & "OUR ALUMNI, OUR PRIDE" FROM MCU.AC.IN)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `hall_of_fame`;
CREATE TABLE `hall_of_fame` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `slug` VARCHAR(64) NOT NULL UNIQUE,
  `name` VARCHAR(128) NOT NULL,
  `hindi_name` VARCHAR(128) NOT NULL,
  `category` ENUM('rng', 'creative', 'leader') NOT NULL DEFAULT 'rng',
  `award_title` VARCHAR(191) NOT NULL,
  `award_title_en` VARCHAR(191) DEFAULT NULL,
  `batch_info` VARCHAR(64) DEFAULT 'MCU Alumnus',
  `degree_info` VARCHAR(128) DEFAULT NULL,
  `current_role` VARCHAR(191) NOT NULL,
  `current_role_en` VARCHAR(191) DEFAULT NULL,
  `company_name` VARCHAR(128) NOT NULL,
  `image_url` VARCHAR(512) NOT NULL,
  `fallback_image_url` VARCHAR(512) NOT NULL,
  `is_poster` BOOLEAN DEFAULT TRUE,
  `is_banner` BOOLEAN DEFAULT FALSE,
  `quote` TEXT NOT NULL,
  `quote_en` TEXT DEFAULT NULL,
  `official_source` VARCHAR(255) DEFAULT 'MCU Official Archives (mcu.ac.in) • Our Alumni, Our Pride',
  `display_order` SMALLINT UNSIGNED DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_hof_category` (`category`),
  INDEX `idx_hof_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `hall_of_fame_achievements`;
CREATE TABLE `hall_of_fame_achievements` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `hall_of_fame_id` INT UNSIGNED NOT NULL,
  `achievement_text` VARCHAR(255) NOT NULL,
  `display_order` SMALLINT UNSIGNED DEFAULT 0,
  CONSTRAINT `fk_hof_achieve` FOREIGN KEY (`hall_of_fame_id`) REFERENCES `hall_of_fame` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 9. EVENTS, FESTIVALS (ABHYUDAY 2026, CONCLAVES) & ARCHIVES
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `events`;
CREATE TABLE `events` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `slug` VARCHAR(64) NOT NULL UNIQUE,
  `title` VARCHAR(191) NOT NULL,
  `hindi_title` VARCHAR(191) NOT NULL,
  `category` ENUM('conclave', 'festival', 'reunion', 'workshop', 'webinar') NOT NULL DEFAULT 'conclave',
  `event_date` DATE NOT NULL,
  `start_time` VARCHAR(32) DEFAULT NULL,
  `end_time` VARCHAR(32) DEFAULT NULL,
  `venue` VARCHAR(255) NOT NULL,
  `campus_id` INT UNSIGNED DEFAULT NULL,
  `description` TEXT NOT NULL,
  `hindi_description` TEXT DEFAULT NULL,
  `banner_url` VARCHAR(512) NOT NULL,
  `fallback_banner_url` VARCHAR(512) DEFAULT NULL,
  `total_seats` INT UNSIGNED DEFAULT 500,
  `rsvp_count` INT UNSIGNED DEFAULT 0,
  `organizer_name` VARCHAR(128) DEFAULT 'MCU Alumni Association',
  `is_official_mcu` BOOLEAN DEFAULT TRUE,
  `badge_text` VARCHAR(64) DEFAULT NULL,
  `status` ENUM('upcoming', 'ongoing', 'completed', 'cancelled') NOT NULL DEFAULT 'upcoming',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_event_campus` FOREIGN KEY (`campus_id`) REFERENCES `campuses` (`id`) ON DELETE SET NULL,
  INDEX `idx_events_date` (`event_date`),
  INDEX `idx_events_category` (`category`),
  INDEX `idx_events_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `event_tags`;
CREATE TABLE `event_tags` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `event_id` INT UNSIGNED NOT NULL,
  `tag_name` VARCHAR(64) NOT NULL,
  CONSTRAINT `fk_etag_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  INDEX `idx_etag_name` (`tag_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `event_rsvps`;
CREATE TABLE `event_rsvps` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `event_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED DEFAULT NULL,
  `attendee_name` VARCHAR(128) NOT NULL,
  `attendee_email` VARCHAR(191) NOT NULL,
  `attendee_phone` VARCHAR(20) DEFAULT NULL,
  `batch_year` SMALLINT UNSIGNED DEFAULT NULL,
  `campus` VARCHAR(64) DEFAULT 'Bhopal',
  `guest_count` TINYINT UNSIGNED DEFAULT 1,
  `ticket_pass_code` VARCHAR(64) NOT NULL UNIQUE,
  `status` ENUM('confirmed', 'attended', 'cancelled') NOT NULL DEFAULT 'confirmed',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_rsvp_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rsvp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_rsvp_pass` (`ticket_pass_code`),
  INDEX `idx_rsvp_email` (`attendee_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 10. JOBS, CAREERS & ALUMNI REFERRALS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `jobs`;
CREATE TABLE `jobs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `posted_by_user_id` INT UNSIGNED DEFAULT NULL,
  `title` VARCHAR(191) NOT NULL,
  `company_name` VARCHAR(128) NOT NULL,
  `company_logo_url` VARCHAR(512) DEFAULT NULL,
  `location` VARCHAR(128) NOT NULL,
  `job_type` ENUM('Full-time', 'Part-time', 'Internship', 'Contract', 'Remote') NOT NULL DEFAULT 'Full-time',
  `experience_required` VARCHAR(64) DEFAULT '2-4 Years',
  `salary_range` VARCHAR(64) DEFAULT 'Competitive',
  `deadline_date` DATE DEFAULT NULL,
  `description` TEXT NOT NULL,
  `referral_alumnus_name` VARCHAR(128) DEFAULT NULL,
  `referral_role` VARCHAR(128) DEFAULT NULL,
  `status` ENUM('active', 'closed', 'draft') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_job_poster` FOREIGN KEY (`posted_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_jobs_status` (`status`),
  INDEX `idx_jobs_type` (`job_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `job_tags`;
CREATE TABLE `job_tags` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `job_id` INT UNSIGNED NOT NULL,
  `tag_name` VARCHAR(64) NOT NULL,
  CONSTRAINT `fk_jtag_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE,
  INDEX `idx_jtag_name` (`tag_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `job_applications`;
CREATE TABLE `job_applications` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `job_id` INT UNSIGNED NOT NULL,
  `applicant_user_id` INT UNSIGNED DEFAULT NULL,
  `applicant_name` VARCHAR(128) NOT NULL,
  `applicant_email` VARCHAR(191) NOT NULL,
  `applicant_phone` VARCHAR(20) DEFAULT NULL,
  `mcu_batch` SMALLINT UNSIGNED DEFAULT NULL,
  `portfolio_url` VARCHAR(512) DEFAULT NULL,
  `resume_file_url` VARCHAR(512) DEFAULT NULL,
  `cover_note` TEXT DEFAULT NULL,
  `status` ENUM('submitted', 'reviewing', 'shortlisted', 'referred', 'rejected') NOT NULL DEFAULT 'submitted',
  `applied_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_japp_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_japp_user` FOREIGN KEY (`applicant_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_japp_job` (`job_id`),
  INDEX `idx_japp_email` (`applicant_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 11. MENTORSHIP REQUESTS (1-ON-1 GUIDANCE)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `mentorship_requests`;
CREATE TABLE `mentorship_requests` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `mentor_alumni_id` INT UNSIGNED NOT NULL,
  `mentee_user_id` INT UNSIGNED DEFAULT NULL,
  `mentee_name` VARCHAR(128) NOT NULL,
  `mentee_email` VARCHAR(191) NOT NULL,
  `mentee_phone` VARCHAR(20) DEFAULT NULL,
  `mentee_status` ENUM('Student', 'Alumni', 'Professional') NOT NULL DEFAULT 'Student',
  `topic` VARCHAR(191) NOT NULL,
  `preferred_time` VARCHAR(64) DEFAULT 'Weekend Evening',
  `message` TEXT NOT NULL,
  `status` ENUM('pending', 'accepted', 'completed', 'declined') NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_mreq_mentor` FOREIGN KEY (`mentor_alumni_id`) REFERENCES `alumni_profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mreq_user` FOREIGN KEY (`mentee_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_mreq_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 12. CAMPUS MEMORIES (PHOTO HERITAGE & ARCHIVES FROM MCU.AC.IN)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `campus_memories`;
CREATE TABLE `campus_memories` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `slug` VARCHAR(64) NOT NULL UNIQUE,
  `title` VARCHAR(191) NOT NULL,
  `hindi_title` VARCHAR(191) NOT NULL,
  `category` ENUM('library', 'studios', 'labs', 'auditorium', 'culture', 'heritage') NOT NULL,
  `academic_year` VARCHAR(32) NOT NULL DEFAULT '2024-25',
  `campus_id` INT UNSIGNED DEFAULT NULL,
  `description` TEXT NOT NULL,
  `hindi_description` TEXT DEFAULT NULL,
  `image_url` VARCHAR(512) NOT NULL,
  `fallback_image_url` VARCHAR(512) NOT NULL,
  `credit` VARCHAR(128) DEFAULT 'MCU Archives (mcu.ac.in)',
  `display_order` SMALLINT UNSIGNED DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_cmem_campus` FOREIGN KEY (`campus_id`) REFERENCES `campuses` (`id`) ON DELETE SET NULL,
  INDEX `idx_cmem_category` (`category`),
  INDEX `idx_cmem_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `memory_tags`;
CREATE TABLE `memory_tags` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `memory_id` INT UNSIGNED NOT NULL,
  `tag_name` VARCHAR(64) NOT NULL,
  CONSTRAINT `fk_mtag_memory` FOREIGN KEY (`memory_id`) REFERENCES `campus_memories` (`id`) ON DELETE CASCADE,
  INDEX `idx_mtag_name` (`tag_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 13. GIVING INITIATIVES & ALUMNI DONATIONS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `giving_initiatives`;
CREATE TABLE `giving_initiatives` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `slug` VARCHAR(64) NOT NULL UNIQUE,
  `title` VARCHAR(191) NOT NULL,
  `hindi_title` VARCHAR(191) NOT NULL,
  `category` ENUM('scholarship', 'infrastructure', 'fellowship', 'emergency_fund') NOT NULL,
  `target_amount` DECIMAL(12, 2) NOT NULL DEFAULT 500000.00,
  `raised_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `description` TEXT NOT NULL,
  `hindi_description` TEXT DEFAULT NULL,
  `image_url` VARCHAR(512) NOT NULL,
  `status` ENUM('active', 'goal_reached', 'closed') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_giving_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `donations`;
CREATE TABLE `donations` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `initiative_id` INT UNSIGNED NOT NULL,
  `donor_user_id` INT UNSIGNED DEFAULT NULL,
  `donor_name` VARCHAR(128) NOT NULL,
  `donor_email` VARCHAR(191) NOT NULL,
  `pan_number` VARCHAR(16) DEFAULT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `payment_reference` VARCHAR(64) NOT NULL UNIQUE,
  `payment_status` ENUM('pending', 'completed', 'failed') NOT NULL DEFAULT 'completed',
  `is_anonymous` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_don_initiative` FOREIGN KEY (`initiative_id`) REFERENCES `giving_initiatives` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_don_user` FOREIGN KEY (`donor_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_don_initiative` (`initiative_id`),
  INDEX `idx_don_status` (`payment_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 23. PASSWORD RESET & EMAIL OTP VERIFICATIONS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `password_reset_otps`;
CREATE TABLE `password_reset_otps` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(191) NOT NULL,
  `otp_code` VARCHAR(10) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `is_used` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_otp_email` (`email`),
  INDEX `idx_otp_code` (`otp_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- End of Schema
-- =============================================================================
