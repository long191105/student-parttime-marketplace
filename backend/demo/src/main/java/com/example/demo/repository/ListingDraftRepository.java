package com.example.demo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.model.ListingDraft;

public interface ListingDraftRepository extends JpaRepository<ListingDraft, Long> {

    Optional<ListingDraft> findBySellerId(Long sellerId);

    void deleteBySellerId(Long sellerId);
}
