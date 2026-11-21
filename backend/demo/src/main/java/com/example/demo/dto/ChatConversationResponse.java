package com.example.demo.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record ChatConversationResponse(
        String id,
        String listingId,
        String listingTitle,
        String listingImage,
        BigDecimal price,
        boolean giveaway,
        String participantName,
        String participantInitials,
        String lastMessage,
        Instant updatedAt,
        long unreadCount) {
}
