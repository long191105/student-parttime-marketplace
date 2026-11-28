package com.example.demo.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "reports")
public class UserReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reporter_id", nullable = false)
    private UserAccount reporter;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reported_user_id", nullable = false)
    private UserAccount reportedUser;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false, length = 16)
    private UserReportSourceType sourceType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    private Listing post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_room_id")
    private ChatConversation chatRoom;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private UserReportReason reason;

    @Column(nullable = false, columnDefinition = "text")
    private String description;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "evidence_urls", nullable = false, columnDefinition = "jsonb")
    private List<String> evidenceUrls = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private UserReportStatus status = UserReportStatus.PENDING;

    @Column(name = "resolution_reason", columnDefinition = "text")
    private String resolutionReason;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected UserReport() {
    }

    public UserReport(
            UserAccount reporter,
            UserAccount reportedUser,
            UserReportSourceType sourceType,
            Listing post,
            ChatConversation chatRoom,
            UserReportReason reason,
            String description,
            List<String> evidenceUrls) {
        this.reporter = reporter;
        this.reportedUser = reportedUser;
        this.sourceType = sourceType;
        this.post = post;
        this.chatRoom = chatRoom;
        this.reason = reason;
        this.description = description;
        this.evidenceUrls = new ArrayList<>(evidenceUrls);
    }

    @PreUpdate
    void updateTimestamp() {
        updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public UserReportStatus getStatus() {
        return status;
    }

    public UserAccount getReporter() {
        return reporter;
    }

    public UserAccount getReportedUser() {
        return reportedUser;
    }

    public UserReportSourceType getSourceType() {
        return sourceType;
    }

    public Listing getPost() {
        return post;
    }

    public ChatConversation getChatRoom() {
        return chatRoom;
    }

    public UserReportReason getReason() {
        return reason;
    }

    public String getDescription() {
        return description;
    }

    public List<String> getEvidenceUrls() {
        return List.copyOf(evidenceUrls);
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public String getResolutionReason() {
        return resolutionReason;
    }

    public void setStatus(UserReportStatus status) {
        this.status = status;
    }

    public void setResolutionReason(String resolutionReason) {
        this.resolutionReason = resolutionReason;
    }
}
