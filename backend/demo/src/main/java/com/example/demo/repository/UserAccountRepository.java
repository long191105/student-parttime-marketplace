package com.example.demo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.model.UserAccount;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
	boolean existsByEmailIgnoreCase(String email);

	Optional<UserAccount> findByEmailIgnoreCase(String email);
}