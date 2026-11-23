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
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "chat_conversations",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_chat_conversation_listing_buyer",
                columnNames = {"listing_id", "buyer_id"}))
public class ChatConversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "buyer_id", nullable = false)
    private UserAccount buyer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seller_id", nullable = false)
    private UserAccount seller;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @Column(name = "sale_confirmed_at")
    private Instant saleConfirmedAt;

    protected ChatConversation() {
    }

    public ChatConversation(Listing listing, UserAccount buyer, UserAccount seller) {
        this.listing = listing;
        this.buyer = buyer;
        this.seller = seller;
    }

    public Long getId() {
        return id;
    }

    public Listing getListing() {
        return listing;
    }

    public UserAccount getBuyer() {
        return buyer;
    }

    public UserAccount getSeller() {
        return seller;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Instant getSaleConfirmedAt() {
        return saleConfirmedAt;
    }

    public void confirmSale() {
        saleConfirmedAt = Instant.now();
        touch();
    }

    public void touch() {
        updatedAt = Instant.now();
    }
}
