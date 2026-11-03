package com.example.demo.model;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "listings")
public class Listing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, length = 80)
    private String category;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ListingCondition condition;

    @Column(nullable = false, length = 160)
    private String location;

    @Column(name = "contact_phone", length = 20)
    private String contactPhone;

    @Column(name = "image_url", nullable = false, columnDefinition = "text")
    private String imageUrl;

    @Column(nullable = false, length = 120)
    private String sellerName;

    @Column(name = "seller_initials", nullable = false, length = 4)
    private String sellerInitials;

    @Column(name = "seller_rating", nullable = false, precision = 3, scale = 2)
    private BigDecimal sellerRating = BigDecimal.valueOf(5);

    @Column(name = "seller_reviews", nullable = false)
    private int sellerReviews;

    @Column(nullable = false, columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private ListingStatus status = ListingStatus.PENDING;

    @Column(name = "review_reason", columnDefinition = "text")
    private String reviewReason;

    @Column(nullable = false)
    private long views;

    @Column(nullable = false)
    private boolean negotiable;

    @Column(name = "specs_text", nullable = false, columnDefinition = "text")
    private String specsText = "";

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id")
    private UserAccount seller;

    protected Listing() {
    }

    public Listing(
            String title,
            String category,
            BigDecimal price,
            ListingCondition condition,
            String location,
            String contactPhone,
            String imageUrl,
            String sellerName,
            String sellerInitials,
            String description,
            boolean negotiable,
            String specsText,
            UserAccount seller) {
        this.title = title;
        this.category = category;
        this.price = price;
        this.condition = condition;
        this.location = location;
        this.contactPhone = contactPhone;
        this.imageUrl = imageUrl;
        this.sellerName = sellerName;
        this.sellerInitials = sellerInitials;
        this.description = description;
        this.negotiable = negotiable;
        this.specsText = specsText;
        this.seller = seller;
        this.status = ListingStatus.PENDING;
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getCategory() {
        return category;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public ListingCondition getCondition() {
        return condition;
    }

    public String getLocation() {
        return location;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public String getSellerName() {
        return sellerName;
    }

    public String getSellerInitials() {
        return sellerInitials;
    }

    public BigDecimal getSellerRating() {
        return sellerRating;
    }

    public int getSellerReviews() {
        return sellerReviews;
    }

    public String getDescription() {
        return description;
    }

    public ListingStatus getStatus() {
        return status;
    }

    public String getReviewReason() {
        return reviewReason;
    }

    public long getViews() {
        return views;
    }

    public boolean isNegotiable() {
        return negotiable;
    }

    public String getSpecsText() {
        return specsText;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public UserAccount getSeller() {
        return seller;
    }

    public void incrementViews() {
        views++;
    }

    public void changeStatus(ListingStatus status, String reviewReason) {
        this.status = status;
        this.reviewReason = reviewReason;
    }
}
