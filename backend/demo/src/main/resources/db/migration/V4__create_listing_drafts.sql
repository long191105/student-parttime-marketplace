CREATE TABLE listing_drafts (
    id BIGSERIAL PRIMARY KEY,
    seller_id BIGINT NOT NULL UNIQUE,
    content_json TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT fk_listing_drafts_seller FOREIGN KEY (seller_id) REFERENCES user_accounts (id) ON DELETE CASCADE
);
