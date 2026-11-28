ALTER TABLE reports
    DROP CONSTRAINT IF EXISTS reports_status_check,
    DROP CONSTRAINT IF EXISTS chk_reports_status;

ALTER TABLE reports
    ADD CONSTRAINT chk_reports_status
        CHECK (status IN ('PENDING', 'REVIEWED', 'INVESTIGATING', 'RESOLVED', 'REJECTED', 'CLEARED')),
    ADD COLUMN IF NOT EXISTS resolution_reason TEXT;

ALTER TABLE user_notifications
    DROP CONSTRAINT IF EXISTS chk_user_notifications_type;

ALTER TABLE user_notifications
    ADD CONSTRAINT chk_user_notifications_type
        CHECK (notification_type IN ('LISTING_APPROVED', 'LISTING_REJECTED', 'NEW_MESSAGE', 'REPORT_STATUS', 'ACCOUNT_STATUS'));
