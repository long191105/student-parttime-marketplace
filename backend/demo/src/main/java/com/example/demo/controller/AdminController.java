package com.example.demo.controller;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.dto.AdminStatsResponse;
import com.example.demo.dto.AdminReportResponse;
import com.example.demo.dto.AdminUserReportResponse;
import com.example.demo.dto.AdminUserResponse;
import com.example.demo.dto.CategoryResponse;
import com.example.demo.dto.ListingResponse;
import com.example.demo.dto.RejectListingRequest;
import com.example.demo.model.AccountStatus;
import com.example.demo.model.AdminReportAction;
import com.example.demo.model.ListingReportStatus;
import com.example.demo.model.ListingStatus;
import com.example.demo.model.UserAccount;
import com.example.demo.model.UserReportStatus;
import com.example.demo.model.UserRole;
import com.example.demo.repository.UserAccountRepository;
import com.example.demo.service.CategoryService;
import com.example.demo.service.ListingService;
import com.example.demo.service.ListingReportService;
import com.example.demo.service.UserReportService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private static final ZoneId MARKETPLACE_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final ListingService listingService;
    private final ListingReportService listingReportService;
    private final UserReportService userReportService;
    private final CategoryService categoryService;
    private final UserAccountRepository userAccountRepository;

    public AdminController(
            ListingService listingService,
            ListingReportService listingReportService,
            UserReportService userReportService,
            CategoryService categoryService,
            UserAccountRepository userAccountRepository) {
        this.listingService = listingService;
        this.listingReportService = listingReportService;
        this.userReportService = userReportService;
        this.categoryService = categoryService;
        this.userAccountRepository = userAccountRepository;
    }

    @GetMapping("/listings")
    public Page<ListingResponse> listings(
            @RequestParam(defaultValue = "PENDING") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return listingService.adminSearch(status, page, size);
    }

    @GetMapping("/users")
    public Page<AdminUserResponse> users(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        validatePaging(page, size);
        PageRequest pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.DESC, "flagged").and(Sort.by(Sort.Direction.DESC, "createdAt")));
        Page<UserAccount> users = keyword == null || keyword.isBlank()
                ? userAccountRepository.findAll(pageable)
                : userAccountRepository.findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                        keyword.trim(), keyword.trim(), pageable);
        return users.map(user -> AdminUserResponse.from(user, listingService.countListingsBySeller(user.getId())));
    }

    @PatchMapping("/users/{id}/status")
    public AdminUserResponse updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserStatusRequest request) {
        UserAccount user = userAccountRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng."));
        if (user.getRole() == UserRole.ADMIN && request.status() == AccountStatus.LOCKED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Không thể khóa tài khoản quản trị viên.");
        }
        user.setStatus(request.status());
        UserAccount updatedUser = userAccountRepository.save(user);
        return AdminUserResponse.from(updatedUser, listingService.countListingsBySeller(updatedUser.getId()));
    }

    @GetMapping("/reports")
    public Page<AdminReportResponse> reports(
            @RequestParam(required = false) ListingReportStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        return listingReportService.search(status, page, size);
    }

    @PatchMapping("/reports/{id}")
    public AdminReportResponse processReport(
            @PathVariable Long id,
            @Valid @RequestBody ProcessReportRequest request) {
        return listingReportService.process(id, request.action());
    }

    @GetMapping("/user-reports")
    public Page<AdminUserReportResponse> userReports(
            @RequestParam(required = false) UserReportStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        return userReportService.searchAdmin(status, page, size);
    }

    @PatchMapping("/user-reports/{id}")
    public AdminUserReportResponse updateUserReport(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserReportStatusRequest request) {
        return userReportService.updateAdminStatus(id, request.status(), request.reason());
    }

    @PostMapping("/listings/{id}/approve")
    public ListingResponse approve(@PathVariable String id) {
        return listingService.moderate(parseId(id), ListingStatus.ACTIVE, null);
    }

    @PostMapping("/listings/{id}/reject")
    public ListingResponse reject(@PathVariable String id, @Valid @RequestBody RejectListingRequest request) {
        return listingService.moderate(parseId(id), ListingStatus.REJECTED, request.reason().trim());
    }

    @GetMapping("/stats")
    public AdminStatsResponse stats(
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to) {
        if (from == null && to == null) {
            return new AdminStatsResponse(
                    listingService.countByStatus(ListingStatus.ACTIVE),
                    listingService.countByStatus(ListingStatus.PENDING),
                    userAccountRepository.count(),
                    listingReportService.countOpenReports());
        }
        if (from == null || to == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cần cung cấp cả ngày bắt đầu và ngày kết thúc.");
        }
        if (to.isBefore(from)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.");
        }
        Instant start = from.atStartOfDay(MARKETPLACE_ZONE).toInstant();
        Instant end = to.plusDays(1).atStartOfDay(MARKETPLACE_ZONE).toInstant();
        return new AdminStatsResponse(
                listingService.countByStatusAndCreatedAtBetween(ListingStatus.ACTIVE, start, end),
                listingService.countByStatusAndCreatedAtBetween(ListingStatus.PENDING, start, end),
                userAccountRepository.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(start, end),
                listingReportService.countOpenReportsCreatedBetween(start, end));
    }

    @PostMapping("/categories")
    public CategoryResponse createCategory(@Valid @RequestBody CreateCategoryRequest request) {
        return categoryService.create(request.name());
    }

    @GetMapping("/categories")
    public List<CategoryResponse> categories() {
        return categoryService.listActive();
    }

    private static Long parseId(String id) {
        try {
            long parsed = Long.parseLong(id);
            if (parsed < 1) throw new NumberFormatException("ID must be positive");
            return parsed;
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã tin đăng không hợp lệ.", exception);
        }
    }

    private static void validatePaging(int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phân trang không hợp lệ (size tối đa 100).");
        }
    }

    public record UpdateUserStatusRequest(@NotNull AccountStatus status) {
    }

    public record ProcessReportRequest(@NotNull AdminReportAction action) {
    }

    public record UpdateUserReportStatusRequest(@NotNull UserReportStatus status, String reason) {
    }

    public record CreateCategoryRequest(@NotBlank @Size(max = 80) String name) {
    }
}
