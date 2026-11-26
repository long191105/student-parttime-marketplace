package com.example.demo.controller;

import java.math.BigDecimal;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.dto.CreateListingRequest;
import com.example.demo.dto.ListingDraftRequest;
import com.example.demo.dto.ListingResponse;
import com.example.demo.dto.PhoneResponse;
import com.example.demo.dto.StatusRequest;
import com.example.demo.model.ListingStatus;
import com.example.demo.service.ListingDraftService;
import com.example.demo.service.ListingService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/listings")
public class ListingController {

    private final ListingService listingService;
    private final ListingDraftService listingDraftService;

    public ListingController(ListingService listingService, ListingDraftService listingDraftService) {
        this.listingService = listingService;
        this.listingDraftService = listingDraftService;
    }

    @GetMapping
    public Page<ListingResponse> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String condition,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return listingService.search(keyword, category, location, condition, minPrice, maxPrice, sort, page, size);
    }

    @GetMapping("/mine")
    public Page<ListingResponse> myListings(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return listingService.getMyListings(status, page, size);
    }

    @GetMapping("/draft")
    public ResponseEntity<ListingDraftRequest> getDraft() {
        ListingDraftRequest draft = listingDraftService.getCurrentDraft();
        return draft == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(draft);
    }

    @PutMapping("/draft")
    public ResponseEntity<Void> saveDraft(@Valid @RequestBody ListingDraftRequest request) {
        listingDraftService.saveCurrentDraft(request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/draft")
    public ResponseEntity<Void> deleteDraft() {
        listingDraftService.deleteCurrentDraft();
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ListingResponse detail(@PathVariable String id) {
        return listingService.getActiveListing(parseId(id));
    }

    @GetMapping("/{id}/phone")
    public PhoneResponse sellerPhone(@PathVariable String id) {
        return listingService.getSellerPhone(parseId(id));
    }

    @PostMapping
    public ResponseEntity<ListingResponse> create(@Valid @RequestBody CreateListingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(listingService.create(request));
    }

    @PatchMapping("/{id}/status")
    public ListingResponse updateStatus(@PathVariable String id, @Valid @RequestBody StatusRequest request) {
        return listingService.updateStatus(parseId(id), request.status());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHiddenListing(@PathVariable String id) {
        listingService.deleteHiddenListing(parseId(id));
        return ResponseEntity.noContent().build();
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
}
