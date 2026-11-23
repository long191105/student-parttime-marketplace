package com.example.demo.service;

import java.time.Instant;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.dto.ListingDraftRequest;
import com.example.demo.model.ListingDraft;
import com.example.demo.model.UserAccount;
import com.example.demo.repository.ListingDraftRepository;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

@Service
public class ListingDraftService {

    private final ListingDraftRepository listingDraftRepository;
    private final CurrentUserService currentUserService;
    private final ObjectMapper objectMapper;

    public ListingDraftService(
            ListingDraftRepository listingDraftRepository,
            CurrentUserService currentUserService,
            ObjectMapper objectMapper) {
        this.listingDraftRepository = listingDraftRepository;
        this.currentUserService = currentUserService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public ListingDraftRequest getCurrentDraft() {
        return listingDraftRepository.findBySellerId(currentUserService.requireUser().getId())
                .map(this::deserialize)
                .orElse(null);
    }

    @Transactional
    public void saveCurrentDraft(ListingDraftRequest request) {
        UserAccount seller = currentUserService.requireUser();
        for (ListingDraftRequest.DraftPhoto photo : request.photos() == null ? java.util.List.<ListingDraftRequest.DraftPhoto>of() : request.photos()) {
            String src = photo.src().trim();
            if (!src.startsWith("https://")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Không lưu ảnh Base64 trong bản nháp. Hãy upload ảnh lên Cloudinary.");
            }
        }
        String content = serialize(request);
        ListingDraft draft = listingDraftRepository.findBySellerId(seller.getId())
                .orElseGet(() -> new ListingDraft(seller, content, Instant.now()));
        draft.replaceContent(content, Instant.now());
        listingDraftRepository.save(draft);
    }

    @Transactional
    public void deleteCurrentDraft() {
        listingDraftRepository.deleteBySellerId(currentUserService.requireUser().getId());
    }

    @Transactional
    public void deleteForSeller(Long sellerId) {
        listingDraftRepository.deleteBySellerId(sellerId);
    }

    private String serialize(ListingDraftRequest request) {
        try {
            return objectMapper.writeValueAsString(request);
        } catch (JacksonException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể lưu bản nháp.", exception);
        }
    }

    private ListingDraftRequest deserialize(ListingDraft draft) {
        try {
            return objectMapper.readValue(draft.getContentJson(), ListingDraftRequest.class);
        } catch (JacksonException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể đọc bản nháp đã lưu.", exception);
        }
    }
}
