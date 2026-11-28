package com.example.demo.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.ListingReportSubmittedResponse;
import com.example.demo.dto.UserReportSubmittedResponse;
import com.example.demo.model.UserReportSourceType;
import com.example.demo.service.ListingReportService;
import com.example.demo.service.UserReportService;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ListingReportService listingReportService;
    private final UserReportService userReportService;

    public ReportController(ListingReportService listingReportService, UserReportService userReportService) {
        this.listingReportService = listingReportService;
        this.userReportService = userReportService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Object create(@RequestBody CreateReportRequest request) {
        if (request.reportedUserId() != null || request.sourceType() != null) {
            return UserReportSubmittedResponse.from(userReportService.submit(
                    request.reportedUserId(),
                    request.sourceType(),
                    request.postId(),
                    request.chatRoomId(),
                    request.reason(),
                    request.description(),
                    request.evidenceUrls()));
        }
        if (request.listingId() == null || request.reason() == null
                || request.reason().isBlank() || request.reason().length() > 1000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã tin đăng và lý do báo cáo là bắt buộc.");
        }
        return ListingReportSubmittedResponse.from(
                listingReportService.submit(request.listingId(), request.reason()));
    }

    public record CreateReportRequest(
            Long listingId,
            Long reportedUserId,
            UserReportSourceType sourceType,
            Long postId,
            Long chatRoomId,
            String reason,
            String description,
            List<String> evidenceUrls) {
    }
}
