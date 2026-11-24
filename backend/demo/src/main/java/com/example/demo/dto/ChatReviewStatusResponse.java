package com.example.demo.dto;

import java.util.List;

public record ChatReviewStatusResponse(
        boolean eligible,
        boolean ownReviewSubmitted,
        ChatReviewResponse ownReview,
        List<ChatReviewResponse> publishedReviews) {
}
