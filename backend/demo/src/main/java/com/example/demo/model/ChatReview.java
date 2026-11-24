package com.example.demo.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "chat_reviews",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_chat_reviews_conversation_reviewer",
                columnNames = {"conversation_id", "reviewer_id"}))
public class ChatReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private ChatConversation conversation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private UserAccount reviewer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reviewee_id", nullable = false)
    private UserAccount reviewee;

    @Column(nullable = false)
    private int rating;

    @Column(nullable = false, length = 500)
    private String comment;

    @ElementCollection
    @CollectionTable(name = "chat_review_tags", joinColumns = @JoinColumn(name = "review_id"))
    @Column(name = "tag", nullable = false, length = 80)
    private List<String> tags = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "chat_review_images", joinColumns = @JoinColumn(name = "review_id"))
    @OrderColumn(name = "image_order")
    @Column(name = "image_url", nullable = false, columnDefinition = "text")
    private List<String> images = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected ChatReview() {
    }

    public ChatReview(
            ChatConversation conversation,
            UserAccount reviewer,
            UserAccount reviewee,
            int rating,
            String comment,
            List<String> tags,
            List<String> images) {
        this.conversation = conversation;
        this.reviewer = reviewer;
        this.reviewee = reviewee;
        this.rating = rating;
        this.comment = comment;
        this.tags = new ArrayList<>(tags);
        this.images = new ArrayList<>(images);
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public ChatConversation getConversation() {
        return conversation;
    }

    public UserAccount getReviewer() {
        return reviewer;
    }

    public UserAccount getReviewee() {
        return reviewee;
    }

    public int getRating() {
        return rating;
    }

    public String getComment() {
        return comment;
    }

    public List<String> getTags() {
        return List.copyOf(tags);
    }

    public List<String> getImages() {
        return List.copyOf(images);
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
