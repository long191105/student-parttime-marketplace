package com.example.demo.service;

import com.example.demo.model.ListingStatus;

public record ListingModerationEmailEvent(
        Long listingId,
        String recipientEmail,
        String recipientName,
        String listingTitle,
        ListingStatus status,
        String reason) {
}
