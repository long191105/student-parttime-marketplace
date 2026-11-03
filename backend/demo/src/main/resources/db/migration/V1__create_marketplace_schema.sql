CREATE TABLE user_accounts (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_user_accounts_email UNIQUE (email)
);

CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uk_categories_slug UNIQUE (slug)
);

CREATE TABLE listings (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(80) NOT NULL,
    price NUMERIC(15, 2) NOT NULL CHECK (price >= 0),
    condition VARCHAR(10) NOT NULL,
    location VARCHAR(160) NOT NULL,
    image_url TEXT NOT NULL,
    seller_name VARCHAR(120) NOT NULL,
    seller_initials VARCHAR(4) NOT NULL,
    seller_rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
    seller_reviews INTEGER NOT NULL DEFAULT 0,
    description TEXT NOT NULL,
    status VARCHAR(12) NOT NULL,
    review_reason TEXT,
    views BIGINT NOT NULL DEFAULT 0,
    negotiable BOOLEAN NOT NULL DEFAULT FALSE,
    specs_text TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL,
    seller_id BIGINT NOT NULL,
    CONSTRAINT fk_listings_seller FOREIGN KEY (seller_id) REFERENCES user_accounts (id)
);

CREATE TABLE favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    listing_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES user_accounts (id) ON DELETE CASCADE,
    CONSTRAINT fk_favorites_listing FOREIGN KEY (listing_id) REFERENCES listings (id) ON DELETE CASCADE,
    CONSTRAINT uk_favorites_user_listing UNIQUE (user_id, listing_id)
);

CREATE INDEX idx_listings_status_created_at ON listings (status, created_at DESC);
CREATE INDEX idx_listings_seller_created_at ON listings (seller_id, created_at DESC);
CREATE INDEX idx_listings_category ON listings (category);
