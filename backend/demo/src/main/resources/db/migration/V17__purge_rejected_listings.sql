DELETE FROM user_notifications
WHERE (
        notification_type IN ('LISTING_APPROVED', 'LISTING_REJECTED')
        AND target_id IN (
            SELECT id::text
            FROM listings
            WHERE status = 'REJECTED'
        )
    )
    OR (
        notification_type = 'NEW_MESSAGE'
        AND target_id IN (
            SELECT chat_conversations.id::text
            FROM chat_conversations
            JOIN listings ON listings.id = chat_conversations.listing_id
            WHERE listings.status = 'REJECTED'
        )
    );

DELETE FROM listing_reports
WHERE listing_id IN (
    SELECT id
    FROM listings
    WHERE status = 'REJECTED'
);

DELETE FROM listings
WHERE status = 'REJECTED';
