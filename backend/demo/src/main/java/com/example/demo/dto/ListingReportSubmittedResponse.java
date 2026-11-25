package com.example.demo.dto;

import java.time.Instant;

import com.example.demo.model.ListingReport;

public record ListingReportSubmittedResponse(Long id, String status, Instant createdAt) {
    public static ListingReportSubmittedResponse from(ListingReport report) {
        return new ListingReportSubmittedResponse(report.getId(), report.getStatus().name(), report.getCreatedAt());
    }
}
