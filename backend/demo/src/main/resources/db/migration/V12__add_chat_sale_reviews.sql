ALTER TABLE chat_conversations
    ADD COLUMN sale_confirmed_at TIMESTAMPTZ;

CREATE TABLE chat_reviews (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    reviewer_id BIGINT NOT NULL,
    reviewee_id BIGINT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment VARCHAR(500) NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT fk_chat_reviews_conversation FOREIGN KEY (conversation_id)
        REFERENCES chat_conversations (id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_reviews_reviewer FOREIGN KEY (reviewer_id)
        REFERENCES user_accounts (id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_reviews_reviewee FOREIGN KEY (reviewee_id)
        REFERENCES user_accounts (id) ON DELETE CASCADE,
    CONSTRAINT uk_chat_reviews_conversation_reviewer UNIQUE (conversation_id, reviewer_id),
    CONSTRAINT ck_chat_reviews_distinct_participants CHECK (reviewer_id <> reviewee_id)
);

CREATE TABLE chat_review_tags (
    review_id BIGINT NOT NULL REFERENCES chat_reviews (id) ON DELETE CASCADE,
    tag VARCHAR(80) NOT NULL,
    PRIMARY KEY (review_id, tag)
);

CREATE TABLE chat_review_images (
    review_id BIGINT NOT NULL REFERENCES chat_reviews (id) ON DELETE CASCADE,
    image_order INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    PRIMARY KEY (review_id, image_order)
);

CREATE INDEX idx_chat_reviews_conversation ON chat_reviews (conversation_id);
