package com.example.demo.repository;

import java.time.Instant;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.model.UserAccount;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
    Optional<UserAccount> findByEmailIgnoreCase(String email);
    Optional<UserAccount> findByGoogleId(String googleId);
    boolean existsByEmailIgnoreCase(String email);
    long countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(Instant from, Instant to);
    Page<UserAccount> findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String fullName, String email, Pageable pageable);
}
