ALTER TABLE listings
    ADD COLUMN giveaway BOOLEAN NOT NULL DEFAULT FALSE,
    ADD CONSTRAINT ck_listings_giveaway_price CHECK (NOT giveaway OR price = 0);
