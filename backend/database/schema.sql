-- Portfolio foundation: MySQL 8.0.16+ (CHECK constraints are enforced).
-- Select the database with the mysql client's --database option before importing.
-- This script creates empty tables only; it does not create users or credentials.
-- Safe to rerun for initial setup. Future structural changes need migrations;
-- CREATE TABLE IF NOT EXISTS does not alter an existing table.

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contact_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL,
  subject VARCHAR(200) NULL,
  message TEXT NOT NULL,
  status ENUM('new', 'read', 'archived') NOT NULL DEFAULT 'new',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_contact_messages_created (created_at, id),
  KEY idx_contact_messages_status_created (status, created_at, id),
  CONSTRAINT chk_contact_messages_name CHECK (CHAR_LENGTH(TRIM(name)) > 0),
  CONSTRAINT chk_contact_messages_email CHECK (CHAR_LENGTH(TRIM(email)) > 0),
  CONSTRAINT chk_contact_messages_message CHECK (CHAR_LENGTH(TRIM(message)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS projects (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(120) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  title VARCHAR(255) NOT NULL,
  short_title VARCHAR(120) NULL,
  tagline VARCHAR(255) NULL,
  date_label VARCHAR(80) NULL,
  category VARCHAR(80) NOT NULL,
  context VARCHAR(255) NULL,
  summary TEXT NOT NULL,
  overview TEXT NULL,
  technologies JSON NULL,
  contributions JSON NULL,
  note TEXT NULL,
  image_url VARCHAR(2048) NULL,
  repository_url VARCHAR(2048) NULL,
  demo_url VARCHAR(2048) NULL,
  display_order INT UNSIGNED NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_projects_slug (slug),
  KEY idx_projects_published_order (is_published, display_order, id),
  KEY idx_projects_category_order (category, is_published, display_order, id),
  CONSTRAINT chk_projects_slug CHECK (slug REGEXP '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT chk_projects_title CHECK (CHAR_LENGTH(TRIM(title)) > 0),
  CONSTRAINT chk_projects_category CHECK (CHAR_LENGTH(TRIM(category)) > 0),
  CONSTRAINT chk_projects_summary CHECK (CHAR_LENGTH(TRIM(summary)) > 0),
  CONSTRAINT chk_projects_technologies CHECK (technologies IS NULL OR JSON_TYPE(technologies) = 'ARRAY'),
  CONSTRAINT chk_projects_contributions CHECK (contributions IS NULL OR JSON_TYPE(contributions) = 'ARRAY'),
  CONSTRAINT chk_projects_published CHECK (is_published IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS qa_evidence (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(120) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(80) NOT NULL,
  primary_tool VARCHAR(100) NOT NULL,
  context VARCHAR(255) NULL,
  summary TEXT NOT NULL,
  scope TEXT NULL,
  recorded_result TEXT NULL,
  technologies JSON NULL,
  implementation JSON NULL,
  limitations TEXT NULL,
  source_note TEXT NULL,
  report_url VARCHAR(2048) NULL,
  display_order INT UNSIGNED NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_qa_evidence_slug (slug),
  KEY idx_qa_evidence_published_order (is_published, display_order, id),
  KEY idx_qa_evidence_category_order (category, is_published, display_order, id),
  CONSTRAINT chk_qa_evidence_slug CHECK (slug REGEXP '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT chk_qa_evidence_title CHECK (CHAR_LENGTH(TRIM(title)) > 0),
  CONSTRAINT chk_qa_evidence_category CHECK (CHAR_LENGTH(TRIM(category)) > 0),
  CONSTRAINT chk_qa_evidence_primary_tool CHECK (CHAR_LENGTH(TRIM(primary_tool)) > 0),
  CONSTRAINT chk_qa_evidence_summary CHECK (CHAR_LENGTH(TRIM(summary)) > 0),
  CONSTRAINT chk_qa_evidence_technologies CHECK (technologies IS NULL OR JSON_TYPE(technologies) = 'ARRAY'),
  CONSTRAINT chk_qa_evidence_implementation CHECK (implementation IS NULL OR JSON_TYPE(implementation) = 'ARRAY'),
  CONSTRAINT chk_qa_evidence_published CHECK (is_published IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
