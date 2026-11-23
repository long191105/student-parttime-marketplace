package com.example.demo.dto;

import java.util.List;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record ChatReviewRequest(
        @Min(1) @Max(5) int rating,
        @Size(max = 500) String comment,
        @Size(max = 5) List<String> tags,
        @Size(max = 3) List<String> images) {
}
