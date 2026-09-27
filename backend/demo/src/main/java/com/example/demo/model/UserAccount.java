package com.example.demo.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_accounts")
public class UserAccount {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 100)
	private String fullName;

	@Column(nullable = false, unique = true, length = 254)
	private String email;

	@Column(nullable = false)
	private String passwordHash;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private UserRole role;

	protected UserAccount() {
	}

	public UserAccount(String fullName, String email, String passwordHash, UserRole role) {
		this.fullName = fullName;
		this.email = email;
		this.passwordHash = passwordHash;
		this.role = role;
	}

	public Long getId() {
		return id;
	}

	public String getFullName() {
		return fullName;
	}

	public String getEmail() {
		return email;
	}

	public String getPasswordHash() {
		return passwordHash;
	}

	public UserRole getRole() {
		return role;
	}
}