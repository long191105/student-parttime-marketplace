package com.example.demo.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "listing_drafts")
public class ListingDraft {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false, unique = true)
    private UserAccount seller;

    @Column(name = "content_json", nullable = false, columnDefinition = "text")
    private String contentJson;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ListingDraft() {
    }

    public ListingDraft(UserAccount seller, String contentJson, Instant updatedAt) {
        this.seller = seller;
        this.contentJson = contentJson;
        this.updatedAt = updatedAt;
    }

    public String getContentJson() {
        return contentJson;
    }

    public void replaceContent(String contentJson, Instant updatedAt) {
        this.contentJson = contentJson;
        this.updatedAt = updatedAt;
    }
}
