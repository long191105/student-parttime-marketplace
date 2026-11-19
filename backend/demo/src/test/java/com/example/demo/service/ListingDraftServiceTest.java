package com.example.demo.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import com.example.demo.dto.ListingDraftRequest;
import com.example.demo.model.ListingDraft;
import com.example.demo.model.UserAccount;
import com.example.demo.model.UserRole;
import com.example.demo.repository.ListingDraftRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import tools.jackson.databind.ObjectMapper;

@ExtendWith(MockitoExtension.class)
class ListingDraftServiceTest {

    @Mock
    private ListingDraftRepository listingDraftRepository;

    @Mock
    private CurrentUserService currentUserService;

    private ListingDraftService listingDraftService;
    private UserAccount seller;

    @BeforeEach
    void setUp() {
        listingDraftService = new ListingDraftService(listingDraftRepository, currentUserService, new ObjectMapper());
        seller = new UserAccount("Nguyen Long", "long@example.com", "hashed", null, UserRole.MEMBER);
        ReflectionTestUtils.setField(seller, "id", 7L);
    }

    @Test
    void savesAndRestoresAnIncompleteDraftForTheCurrentUser() {
        ListingDraftRequest request = new ListingDraftRequest(
                "Máy ảnh",
                "Điện tử",
                "",
                null,
                "TP. Hồ Chí Minh",
                "",
                "",
                "",
                "",
                "",
                "",
                true,
                List.of(),
                null,
                1);
        when(currentUserService.requireUser()).thenReturn(seller);
        when(listingDraftRepository.findBySellerId(7L)).thenReturn(Optional.empty());

        listingDraftService.saveCurrentDraft(request);

        ArgumentCaptor<ListingDraft> savedDraft = ArgumentCaptor.forClass(ListingDraft.class);
        verify(listingDraftRepository).save(savedDraft.capture());
        when(listingDraftRepository.findBySellerId(7L)).thenReturn(Optional.of(savedDraft.getValue()));

        assertEquals(request, listingDraftService.getCurrentDraft());
    }

    @Test
    void removesTheUsersDraftAfterPublishing() {
        listingDraftService.deleteForSeller(7L);

        verify(listingDraftRepository).deleteBySellerId(7L);
    }

    @Test
    void deletesTheCurrentUsersDraft() {
        when(currentUserService.requireUser()).thenReturn(seller);

        listingDraftService.deleteCurrentDraft();

        verify(listingDraftRepository).deleteBySellerId(7L);
    }
}
