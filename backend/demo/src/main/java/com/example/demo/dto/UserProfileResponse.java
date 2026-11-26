package com.example.demo.dto;

public record UserProfileResponse(
        Long id,
        String fullName,
        long followerCount,
        boolean following,
        boolean currentUser) {
}
