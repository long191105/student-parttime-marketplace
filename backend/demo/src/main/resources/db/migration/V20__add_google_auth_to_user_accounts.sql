ALTER TABLE user_accounts
    ALTER COLUMN password_hash DROP NOT NULL,
    ADD COLUMN google_id VARCHAR(255),
    ADD COLUMN auth_provider VARCHAR(20) NOT NULL DEFAULT 'local',
    ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT TRUE,
    ADD CONSTRAINT uk_user_accounts_google_id UNIQUE (google_id);
