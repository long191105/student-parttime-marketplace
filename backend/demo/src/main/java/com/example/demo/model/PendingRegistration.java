package com.example.demo.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "pending_registrations", uniqueConstraints = @UniqueConstraint(
        name = "uk_pending_registrations_email", columnNames = "email"))
public class PendingRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 254)
    private String email;

    @Column(name = "full_name", nullable = false, length = 120)
    private String fullName;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Column(length = 20)
    private String phone;

    @Column(name = "otp_hash", nullable = false, length = 100)
    private String otpHash;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "last_sent_at", nullable = false)
    private Instant lastSentAt;

    @Column(name = "failed_attempts", nullable = false)
    private int failedAttempts;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected PendingRegistration() {
    }

    public PendingRegistration(
            String email,
            String fullName,
            String passwordHash,
            String phone,
            String otpHash,
            Instant expiresAt,
            Instant now) {
        this.email = email;
        this.fullName = fullName;
        this.passwordHash = passwordHash;
        this.phone = phone;
        this.otpHash = otpHash;
        this.expiresAt = expiresAt;
        this.lastSentAt = now;
        this.createdAt = now;
    }

    public void renew(
            String fullName,
            String passwordHash,
            String phone,
            String otpHash,
            Instant expiresAt,
            Instant now) {
        this.fullName = fullName;
        this.passwordHash = passwordHash;
        this.phone = phone;
        this.otpHash = otpHash;
        this.expiresAt = expiresAt;
        this.lastSentAt = now;
        this.failedAttempts = 0;
    }

    public void recordFailedAttempt() {
        failedAttempts++;
    }

    public String getEmail() {
        return email;
    }

    public String getFullName() {
        return fullName;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public String getPhone() {
        return phone;
    }

    public String getOtpHash() {
        return otpHash;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public Instant getLastSentAt() {
        return lastSentAt;
    }

    public int getFailedAttempts() {
        return failedAttempts;
    }
}
