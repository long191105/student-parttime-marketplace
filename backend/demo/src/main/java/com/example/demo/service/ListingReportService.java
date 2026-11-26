package com.example.demo.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.dto.AdminReportResponse;
import com.example.demo.model.AccountStatus;
import com.example.demo.model.AdminReportAction;
import com.example.demo.model.Listing;
import com.example.demo.model.ListingReport;
import com.example.demo.model.ListingReportStatus;
import com.example.demo.model.ListingStatus;
import com.example.demo.model.UserRole;
import com.example.demo.repository.ListingReportRepository;
import com.example.demo.repository.ListingRepository;

@Service
public class ListingReportService {

    private final ListingReportRepository reportRepository;
    private final ListingRepository listingRepository;
    private final CurrentUserService currentUserService;
    private final ListingService listingService;

    public ListingReportService(
            ListingReportRepository reportRepository,
            ListingRepository listingRepository,
            CurrentUserService currentUserService,
            ListingService listingService) {
        this.reportRepository = reportRepository;
        this.listingRepository = listingRepository;
        this.currentUserService = currentUserService;
        this.listingService = listingService;
    }

    @Transactional
    public ListingReport submit(Long listingId, String reason) {
        var reporter = currentUserService.requireUser();
        Listing listing = listingRepository.findById(listingId)
                .filter(item -> item.getStatus() == ListingStatus.ACTIVE)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tin đang hiển thị."));
        if (listing.getSeller().getId().equals(reporter.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bạn không thể báo cáo tin đăng của chính mình.");
        }
        if (reportRepository.existsByReporterIdAndListingId(reporter.getId(), listingId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã gửi báo cáo cho tin này rồi.");
        }
        ListingReport report = reportRepository.save(new ListingReport(reporter, listing, reason.trim()));
        return report;
    }

    @Transactional(readOnly = true)
    public Page<AdminReportResponse> search(ListingReportStatus status, int page, int size) {
        validatePaging(page, size);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<ListingReport> reports = status == null
                ? reportRepository.findAllByOrderByCreatedAtDesc(pageable)
                : reportRepository.findAllByStatusOrderByCreatedAtDesc(status, pageable);
        return reports.map(AdminReportResponse::from);
    }

    @Transactional
    public AdminReportResponse process(Long id, AdminReportAction action) {
        ListingReport report = reportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy báo cáo."));
        if (report.getStatus() != ListingReportStatus.OPEN) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Báo cáo này đã được xử lý.");
        }

        Listing listing = report.getListing();
        switch (action) {
            case DISMISS -> report.setStatus(ListingReportStatus.DISMISSED);
            case REMOVE_LISTING -> {
                listing.changeStatus(ListingStatus.REJECTED, "Tin đã bị gỡ sau khi xử lý báo cáo vi phạm.");
                report.setStatus(ListingReportStatus.RESOLVED);
            }
            case LOCK_USER -> {
                if (listing.getSeller().getRole() == UserRole.ADMIN) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Không thể khóa tài khoản quản trị viên.");
                }
                listing.getSeller().setStatus(AccountStatus.LOCKED);
                report.setStatus(ListingReportStatus.RESOLVED);
            }
        }
        AdminReportResponse response = AdminReportResponse.from(reportRepository.save(report));
        if (action == AdminReportAction.REMOVE_LISTING) {
            listingService.deleteRejectedListingAndRelatedData(listing);
        }
        return response;
    }

    @Transactional(readOnly = true)
    public long countOpenReports() {
        return reportRepository.countByStatus(ListingReportStatus.OPEN);
    }

    @Transactional(readOnly = true)
    public long countOpenReportsCreatedBetween(java.time.Instant from, java.time.Instant to) {
        return reportRepository.countByStatusAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                ListingReportStatus.OPEN, from, to);
    }

    private static void validatePaging(int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phân trang không hợp lệ (size tối đa 100).");
        }
    }
}
