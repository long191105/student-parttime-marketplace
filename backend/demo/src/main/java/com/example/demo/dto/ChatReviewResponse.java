package com.example.demo.dto;

import java.time.Instant;
import java.util.List;

import com.example.demo.model.ChatReview;

public record ChatReviewResponse(
        String id,
        String reviewerId,
        String reviewerName,
        String listingTitle,
        int rating,
        String comment,
        List<String> tags,
        List<String> images,
        Instant createdAt) {

    public static ChatReviewResponse from(ChatReview review) {
        return new ChatReviewResponse(
                review.getId().toString(),
                review.getReviewer().getId().toString(),
                review.getReviewer().getFullName(),
                review.getConversation().getListing().getTitle(),
                review.getRating(),
                review.getComment(),
                review.getTags(),
                review.getImages(),
                review.getCreatedAt());
    }
}
