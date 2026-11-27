package com.example.demo.dto;

public record UserProfileResponse(
        Long id,
        String fullName,
        String avatarUrl,
        long followerCount,
        boolean following,
        boolean currentUser) {
}
