package com.example.demo.repository;

import java.time.Instant;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.model.Listing;
import com.example.demo.model.ListingStatus;

import jakarta.persistence.LockModeType;

public interface ListingRepository extends JpaRepository<Listing, Long>, JpaSpecificationExecutor<Listing> {

    Page<Listing> findAllBySellerId(Long sellerId, Pageable pageable);

    Page<Listing> findAllBySellerIdAndStatusNot(Long sellerId, ListingStatus excludedStatus, Pageable pageable);

    Page<Listing> findAllBySellerIdAndStatus(Long sellerId, ListingStatus status, Pageable pageable);

    Page<Listing> findAllByStatus(ListingStatus status, Pageable pageable);

    Optional<Listing> findByIdAndSellerId(Long id, Long sellerId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select listing from Listing listing where listing.id = :id")
    Optional<Listing> findByIdForUpdate(@Param("id") Long id);

    long countByStatus(ListingStatus status);
    long countBySellerIdAndStatusNot(Long sellerId, ListingStatus excludedStatus);

    long countByStatusAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
            ListingStatus status, Instant from, Instant to);
}
