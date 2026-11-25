CREATE TABLE listing_reports (
    id BIGSERIAL PRIMARY KEY,
    reporter_id BIGINT NOT NULL,
    listing_id BIGINT NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT fk_listing_reports_reporter FOREIGN KEY (reporter_id) REFERENCES user_accounts (id),
    CONSTRAINT fk_listing_reports_listing FOREIGN KEY (listing_id) REFERENCES listings (id),
    CONSTRAINT uk_listing_reports_reporter_listing UNIQUE (reporter_id, listing_id),
    CONSTRAINT chk_listing_reports_status CHECK (status IN ('OPEN', 'DISMISSED', 'RESOLVED'))
);

CREATE INDEX idx_listing_reports_status_created_at ON listing_reports (status, created_at DESC);
