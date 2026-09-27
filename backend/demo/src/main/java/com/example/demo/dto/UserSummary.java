package com.example.demo.dto;

import com.example.demo.model.UserAccount;
import com.example.demo.model.UserRole;

public record UserSummary(Long id, String fullName, String email, UserRole role) {
	public static UserSummary from(UserAccount user) {
		return new UserSummary(user.getId(), user.getFullName(), user.getEmail(), user.getRole());
	}
}