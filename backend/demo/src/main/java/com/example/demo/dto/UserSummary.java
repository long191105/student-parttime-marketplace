package com.example.demo.dto;

import com.example.demo.model.UserAccount;

public record UserSummary(Long id, String fullName, String email, String role) {
    public static UserSummary from(UserAccount user) {
        return new UserSummary(user.getId(), user.getFullName(), user.getEmail(), user.getRole().name());
    }
}
