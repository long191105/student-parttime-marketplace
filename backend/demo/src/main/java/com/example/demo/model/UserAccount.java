package com.example.demo.model;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.hibernate.annotations.ColumnDefault;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "user_accounts", uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_accounts_email", columnNames = "email"),
        @UniqueConstraint(name = "uk_user_accounts_google_id", columnNames = "google_id")
})
public class UserAccount implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false, length = 120)
    private String fullName;

    @Column(nullable = false, length = 254)
    private String email;

    @Column(name = "password_hash", length = 100)
    private String passwordHash;

    @Column(name = "google_id", length = 255)
    private String googleId;

    @Column(length = 20)
    private String phone;

    @Column(name = "avatar_url", length = 2048)
    private String avatarUrl;

    @Column(name = "auth_provider", nullable = false, length = 20)
    @ColumnDefault("'local'")
    private String authProvider = "local";

    @Column(name = "email_verified", nullable = false)
    @ColumnDefault("true")
    private boolean emailVerified = true;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserRole role = UserRole.MEMBER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AccountStatus status = AccountStatus.ACTIVE;

    @Column(name = "is_flagged", nullable = false, columnDefinition = "boolean not null default false")
    private boolean flagged;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "last_active_at")
    private Instant lastActiveAt;

    protected UserAccount() {
    }

    public UserAccount(String fullName, String email, String passwordHash, String phone, UserRole role) {
        this.fullName = fullName;
        this.email = email;
        this.passwordHash = passwordHash;
        this.phone = phone;
        this.role = role;
        this.status = AccountStatus.ACTIVE;
        this.createdAt = Instant.now();
    }

    public static UserAccount googleAccount(
            String fullName, String email, String googleId, String avatarUrl, UserRole role) {
        UserAccount user = new UserAccount(fullName, email, null, null, role);
        user.googleId = googleId;
        user.avatarUrl = avatarUrl;
        user.authProvider = "google";
        user.emailVerified = true;
        return user;
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

    public String getGoogleId() {
        return googleId;
    }

    public String getPhone() {
        return phone;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public String getAuthProvider() {
        return authProvider;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public UserRole getRole() {
        return role;
    }

    public AccountStatus getStatus() {
        return status;
    }

    public boolean isFlagged() {
        return flagged;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getLastActiveAt() {
        return lastActiveAt;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public void setStatus(AccountStatus status) {
        this.status = status;
    }

    public void setFlagged(boolean flagged) {
        this.flagged = flagged;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public void setGoogleId(String googleId) {
        this.googleId = googleId;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public void setLastActiveAt(Instant lastActiveAt) {
        this.lastActiveAt = lastActiveAt;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return status != AccountStatus.LOCKED;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return status == AccountStatus.ACTIVE;
    }
}
