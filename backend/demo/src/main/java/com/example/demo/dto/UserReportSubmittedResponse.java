package com.example.demo.dto;

import java.time.Instant;

import com.example.demo.model.UserReport;

public record UserReportSubmittedResponse(Long id, String status, Instant createdAt) {

    public static UserReportSubmittedResponse from(UserReport report) {
        return new UserReportSubmittedResponse(report.getId(), report.getStatus().name(), report.getCreatedAt());
    }
}
