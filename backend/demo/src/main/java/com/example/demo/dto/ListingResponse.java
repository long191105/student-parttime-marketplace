package com.example.demo.dto;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;

import com.example.demo.model.Listing;

public record ListingResponse(
        String id,
        String title,
        String category,
        BigDecimal price,
        String condition,
        String location,
        String postedAt,
        String image,
        String seller,
        String sellerId,
        String sellerInitials,
        double sellerRating,
        int sellerReviews,
        String description,
        String status,
        long views,
        boolean negotiable,
        List<String> specs,
        String reviewReason,
        List<String> images) {

    public static ListingResponse from(Listing listing) {
        String specsText = listing.getSpecsText();
        List<String> specs = specsText.isBlank()
                ? List.of()
                : Arrays.stream(specsText.split("\\R")).filter(value -> !value.isBlank()).toList();
        return new ListingResponse(
                listing.getId().toString(),
                listing.getTitle(),
                listing.getCategory(),
                listing.getPrice(),
                listing.getCondition().name(),
                listing.getLocation(),
                relativeTime(listing.getCreatedAt()),
                listing.getImageUrl(),
                listing.getSellerName(),
                listing.getSeller().getId().toString(),
                listing.getSellerInitials(),
                listing.getSellerRating().doubleValue(),
                listing.getSellerReviews(),
                listing.getDescription(),
                listing.getStatus().name(),
                listing.getViews(),
                listing.isNegotiable(),
                specs,
                listing.getReviewReason(),
                listing.getImages());
    }

    private static String relativeTime(Instant createdAt) {
        Duration age = Duration.between(createdAt, Instant.now());
        if (age.toMinutes() < 1) return "Vừa xong";
        if (age.toHours() < 1) return age.toMinutes() + " phút trước";
        if (age.toDays() < 1) return age.toHours() + " giờ trước";
        if (age.toDays() == 1) return "Hôm qua";
        return age.toDays() + " ngày trước";
    }
}
