package com.example.demo.repository;

import java.time.Instant;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.model.ListingReport;
import com.example.demo.model.ListingReportStatus;

public interface ListingReportRepository extends JpaRepository<ListingReport, Long> {
    boolean existsByReporterIdAndListingId(Long reporterId, Long listingId);

    Page<ListingReport> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<ListingReport> findAllByStatusOrderByCreatedAtDesc(ListingReportStatus status, Pageable pageable);

    long countByStatus(ListingReportStatus status);

    long countByStatusAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
            ListingReportStatus status, Instant from, Instant to);
}
