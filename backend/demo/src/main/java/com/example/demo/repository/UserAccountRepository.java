package com.example.demo.repository;

import java.time.Instant;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.model.UserAccount;

import jakarta.persistence.LockModeType;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
    Optional<UserAccount> findByEmailIgnoreCase(String email);
    Optional<UserAccount> findByGoogleId(String googleId);
    boolean existsByEmailIgnoreCase(String email);
    long countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(Instant from, Instant to);
    Page<UserAccount> findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String fullName, String email, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select user from UserAccount user where user.id = :id")
    java.util.Optional<UserAccount> findByIdForUpdate(@Param("id") Long id);
}
