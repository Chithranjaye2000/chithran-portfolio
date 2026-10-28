-- Contact-only Aiven setup. No seed data, history imports, or unrelated tables.
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
