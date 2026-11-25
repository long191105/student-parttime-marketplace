package com.example.demo.dto;

import java.time.Instant;

import com.example.demo.model.ListingReport;

public record AdminReportResponse(
        Long id,
        String reporterName,
        String listingId,
        String listingTitle,
        String sellerName,
        String reason,
        String status,
        Instant createdAt) {

    public static AdminReportResponse from(ListingReport report) {
        return new AdminReportResponse(
                report.getId(),
                report.getReporter().getFullName(),
                report.getListing().getId().toString(),
                report.getListing().getTitle(),
                report.getListing().getSeller().getFullName(),
                report.getReason(),
                report.getStatus().name(),
                report.getCreatedAt());
    }
}
