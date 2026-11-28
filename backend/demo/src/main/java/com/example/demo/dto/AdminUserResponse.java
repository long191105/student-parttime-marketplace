package com.example.demo.dto;

import java.time.Instant;

import com.example.demo.model.UserAccount;

public record AdminUserResponse(
        Long id,
        String fullName,
        String email,
        String role,
        String status,
        long listingCount,
        boolean isFlagged,
        Instant createdAt) {

    public static AdminUserResponse from(UserAccount user, long listingCount) {
        return new AdminUserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                user.getStatus().name(),
                listingCount,
                user.isFlagged(),
                user.getCreatedAt());
    }
}
