package com.example.demo.controller;

import java.util.List;

import org.springframework.data.domain.Page;
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
import com.example.demo.dto.CategoryResponse;
import com.example.demo.dto.ListingResponse;
import com.example.demo.dto.RejectListingRequest;
import com.example.demo.model.ListingStatus;
import com.example.demo.repository.UserAccountRepository;
import com.example.demo.service.CategoryService;
import com.example.demo.service.ListingService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final ListingService listingService;
    private final CategoryService categoryService;
    private final UserAccountRepository userAccountRepository;

    public AdminController(
            ListingService listingService,
            CategoryService categoryService,
            UserAccountRepository userAccountRepository) {
        this.listingService = listingService;
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

    @PostMapping("/listings/{id}/approve")
    public ListingResponse approve(@PathVariable String id) {
        return listingService.moderate(parseId(id), ListingStatus.ACTIVE, null);
    }

    @PostMapping("/listings/{id}/reject")
    public ListingResponse reject(@PathVariable String id, @Valid @RequestBody RejectListingRequest request) {
        return listingService.moderate(parseId(id), ListingStatus.REJECTED, request.reason().trim());
    }

    @GetMapping("/stats")
    public AdminStatsResponse stats() {
        return new AdminStatsResponse(
                listingService.countByStatus(ListingStatus.ACTIVE),
                listingService.countByStatus(ListingStatus.PENDING),
                userAccountRepository.count());
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

    public record CreateCategoryRequest(@NotBlank @Size(max = 80) String name) {
    }
}
