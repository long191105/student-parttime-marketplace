CREATE TABLE listing_images (
    listing_id BIGINT NOT NULL,
    image_order INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    CONSTRAINT pk_listing_images PRIMARY KEY (listing_id, image_order),
    CONSTRAINT fk_listing_images_listing FOREIGN KEY (listing_id) REFERENCES listings (id) ON DELETE CASCADE
);
