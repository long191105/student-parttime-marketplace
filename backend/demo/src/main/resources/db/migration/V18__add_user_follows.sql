CREATE TABLE user_follows (
    id BIGSERIAL PRIMARY KEY,
    follower_id BIGINT NOT NULL,
    followed_id BIGINT NOT NULL,
    CONSTRAINT fk_user_follows_follower
        FOREIGN KEY (follower_id) REFERENCES user_accounts (id) ON DELETE CASCADE,
    CONSTRAINT fk_user_follows_followed
        FOREIGN KEY (followed_id) REFERENCES user_accounts (id) ON DELETE CASCADE,
    CONSTRAINT uk_user_follows_follower_followed UNIQUE (follower_id, followed_id),
    CONSTRAINT ck_user_follows_not_self CHECK (follower_id <> followed_id)
);

CREATE INDEX idx_user_follows_followed ON user_follows (followed_id);
