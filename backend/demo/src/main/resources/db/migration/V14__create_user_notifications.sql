CREATE TABLE user_notifications (
    id BIGSERIAL PRIMARY KEY,
    recipient_id BIGINT NOT NULL,
    notification_type VARCHAR(32) NOT NULL,
    title VARCHAR(160) NOT NULL,
    detail VARCHAR(1000) NOT NULL,
    target_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    read_at TIMESTAMPTZ,
    CONSTRAINT fk_user_notifications_recipient FOREIGN KEY (recipient_id) REFERENCES user_accounts (id) ON DELETE CASCADE,
    CONSTRAINT chk_user_notifications_type CHECK (notification_type IN ('LISTING_APPROVED', 'LISTING_REJECTED', 'NEW_MESSAGE'))
);

CREATE INDEX idx_user_notifications_recipient_created
    ON user_notifications (recipient_id, created_at DESC);

CREATE INDEX idx_user_notifications_recipient_unread
    ON user_notifications (recipient_id, read_at)
    WHERE read_at IS NULL;
