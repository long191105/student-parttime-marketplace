ALTER TABLE chat_messages
    DROP CONSTRAINT ck_chat_message_type,
    DROP CONSTRAINT ck_chat_message_location_data;

ALTER TABLE chat_messages
    ADD CONSTRAINT ck_chat_message_type CHECK (message_type IN ('TEXT', 'LOCATION', 'MISSED_CALL', 'CALL')),
    ADD CONSTRAINT ck_chat_message_location_data CHECK (
        (
            message_type IN ('TEXT', 'MISSED_CALL', 'CALL')
            AND latitude IS NULL
            AND longitude IS NULL
            AND map_url IS NULL
        )
        OR (
            message_type = 'LOCATION'
            AND map_url IS NOT NULL
            AND length(trim(map_url)) > 0
            AND (
                (latitude IS NULL AND longitude IS NULL)
                OR (
                    latitude BETWEEN -90 AND 90
                    AND longitude BETWEEN -180 AND 180
                )
            )
        )
    );
