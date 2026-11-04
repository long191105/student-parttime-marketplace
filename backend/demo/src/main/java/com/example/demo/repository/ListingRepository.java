package com.example.demo.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.example.demo.model.Listing;
import com.example.demo.model.ListingStatus;

public interface ListingRepository extends JpaRepository<Listing, Long>, JpaSpecificationExecutor<Listing> {

    Page<Listing> findAllBySellerId(Long sellerId, Pageable pageable);

    Page<Listing> findAllBySellerIdAndStatus(Long sellerId, ListingStatus status, Pageable pageable);

    Page<Listing> findAllByStatus(ListingStatus status, Pageable pageable);

    Optional<Listing> findByIdAndSellerId(Long id, Long sellerId);

    long countByStatus(ListingStatus status);
}
