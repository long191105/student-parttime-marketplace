CREATE TABLE chat_conversations (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL,
    buyer_id BIGINT NOT NULL,
    seller_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT fk_chat_conversations_listing FOREIGN KEY (listing_id) REFERENCES listings (id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_conversations_buyer FOREIGN KEY (buyer_id) REFERENCES user_accounts (id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_conversations_seller FOREIGN KEY (seller_id) REFERENCES user_accounts (id) ON DELETE CASCADE,
    CONSTRAINT uk_chat_conversation_listing_buyer UNIQUE (listing_id, buyer_id),
    CONSTRAINT ck_chat_conversation_distinct_participants CHECK (buyer_id <> seller_id)
);

CREATE TABLE chat_messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    content TEXT NOT NULL CHECK (length(trim(content)) > 0),
    sent_at TIMESTAMPTZ NOT NULL,
    read_at TIMESTAMPTZ,
    CONSTRAINT fk_chat_messages_conversation FOREIGN KEY (conversation_id)
        REFERENCES chat_conversations (id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_messages_sender FOREIGN KEY (sender_id)
        REFERENCES user_accounts (id) ON DELETE CASCADE
);

CREATE INDEX idx_chat_conversations_buyer_updated ON chat_conversations (buyer_id, updated_at DESC);
CREATE INDEX idx_chat_conversations_seller_updated ON chat_conversations (seller_id, updated_at DESC);
CREATE INDEX idx_chat_messages_conversation_sent ON chat_messages (conversation_id, sent_at);
