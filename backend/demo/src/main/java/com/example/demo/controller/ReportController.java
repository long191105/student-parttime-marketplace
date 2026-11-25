package com.example.demo.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.ListingReportSubmittedResponse;
import com.example.demo.service.ListingReportService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ListingReportService listingReportService;

    public ReportController(ListingReportService listingReportService) {
        this.listingReportService = listingReportService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ListingReportSubmittedResponse create(@Valid @RequestBody CreateListingReportRequest request) {
        return ListingReportSubmittedResponse.from(
                listingReportService.submit(request.listingId(), request.reason()));
    }

    public record CreateListingReportRequest(
            @NotNull Long listingId,
            @NotBlank @Size(max = 1000) String reason) {
    }
}
