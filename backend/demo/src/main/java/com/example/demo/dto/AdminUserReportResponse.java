package com.example.demo.dto;

import java.time.Instant;
import java.util.List;

import com.example.demo.model.UserReport;

public record AdminUserReportResponse(
        Long id,
        Long reporterId,
        String reporterName,
        Long reportedUserId,
        String reportedUserName,
        boolean reportedUserFlagged,
        String sourceType,
        Long postId,
        String postTitle,
        Long chatRoomId,
        String reason,
        String description,
        List<String> evidenceUrls,
        String status,
        String resolutionReason,
        Instant createdAt) {

    public static AdminUserReportResponse from(UserReport report) {
        return new AdminUserReportResponse(
                report.getId(),
                report.getReporter().getId(),
                report.getReporter().getFullName(),
                report.getReportedUser().getId(),
                report.getReportedUser().getFullName(),
                report.getReportedUser().isFlagged(),
                report.getSourceType().name(),
                report.getPost() == null ? null : report.getPost().getId(),
                report.getPost() == null ? null : report.getPost().getTitle(),
                report.getChatRoom() == null ? null : report.getChatRoom().getId(),
                report.getReason().name(),
                report.getDescription(),
                report.getEvidenceUrls(),
                report.getStatus().name(),
                report.getResolutionReason(),
                report.getCreatedAt());
    }
}
