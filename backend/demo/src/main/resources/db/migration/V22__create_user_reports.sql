ALTER TABLE user_accounts
    ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS reports (
    id BIGSERIAL PRIMARY KEY,
    reporter_id BIGINT NOT NULL REFERENCES user_accounts (id),
    reported_user_id BIGINT NOT NULL REFERENCES user_accounts (id),
    source_type VARCHAR(16) NOT NULL CHECK (source_type IN ('CHAT', 'PROFILE', 'POST')),
    post_id BIGINT REFERENCES listings (id),
    chat_room_id BIGINT REFERENCES chat_conversations (id),
    reason VARCHAR(24) NOT NULL CHECK (reason IN ('SCAM', 'PROHIBITED_ITEM', 'HARASSMENT', 'SPAM', 'OTHER')),
    description TEXT NOT NULL,
    evidence_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(16) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'REVIEWED', 'RESOLVED', 'REJECTED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_reports_context CHECK (
        (source_type = 'CHAT' AND chat_room_id IS NOT NULL AND post_id IS NULL)
        OR (source_type = 'POST' AND post_id IS NOT NULL AND chat_room_id IS NULL)
        OR (source_type = 'PROFILE' AND post_id IS NULL AND chat_room_id IS NULL)
    ),
    CONSTRAINT ck_reports_not_self CHECK (reporter_id <> reported_user_id)
);

CREATE INDEX IF NOT EXISTS idx_reports_target_status_created
    ON reports (reported_user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_created
    ON reports (reporter_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uk_reports_pending_duplicate
    ON reports (
        reporter_id,
        reported_user_id,
        source_type,
        (COALESCE(post_id, 0)),
        (COALESCE(chat_room_id, 0))
    )
    WHERE status = 'PENDING';
