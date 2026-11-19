package com.example.demo.model;

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
@Table(name = "chat_messages")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private ChatConversation conversation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sender_id", nullable = false)
    private UserAccount sender;

    @Column(nullable = false, columnDefinition = "text")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", nullable = false, length = 12, columnDefinition = "varchar(12) not null default 'TEXT'")
    private ChatMessageType messageType = ChatMessageType.TEXT;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "map_url", columnDefinition = "text")
    private String mapUrl;

    @Column(name = "sent_at", nullable = false)
    private Instant sentAt = Instant.now();

    @Column(name = "read_at")
    private Instant readAt;

    protected ChatMessage() {
    }

    public ChatMessage(ChatConversation conversation, UserAccount sender, String content) {
        this(conversation, sender, content, ChatMessageType.TEXT, null, null, null);
    }

    public ChatMessage(
            ChatConversation conversation,
            UserAccount sender,
            String content,
            ChatMessageType messageType,
            Double latitude,
            Double longitude,
            String mapUrl) {
        this.conversation = conversation;
        this.sender = sender;
        this.content = content;
        this.messageType = messageType;
        this.latitude = latitude;
        this.longitude = longitude;
        this.mapUrl = mapUrl;
    }

    public Long getId() {
        return id;
    }

    public ChatConversation getConversation() {
        return conversation;
    }

    public UserAccount getSender() {
        return sender;
    }

    public String getContent() {
        return content;
    }

    public ChatMessageType getMessageType() {
        return messageType;
    }

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public String getMapUrl() {
        return mapUrl;
    }

    public Instant getSentAt() {
        return sentAt;
    }
}
