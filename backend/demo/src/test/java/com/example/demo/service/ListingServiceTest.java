package com.example.demo.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.dto.CreateListingRequest;
import com.example.demo.dto.ListingResponse;
import com.example.demo.dto.PhoneResponse;
import com.example.demo.model.Listing;
import com.example.demo.model.ListingCondition;
import com.example.demo.model.ListingStatus;
import com.example.demo.model.UserAccount;
import com.example.demo.model.UserRole;
import com.example.demo.repository.CategoryRepository;
import com.example.demo.repository.ListingRepository;

@ExtendWith(MockitoExtension.class)
class ListingServiceTest {

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private CurrentUserService currentUserService;

    private ListingService listingService;
    private UserAccount seller;
    private Listing pendingListing;

    @BeforeEach
    void setUp() {
        listingService = new ListingService(listingRepository, categoryRepository, currentUserService);
        seller = new UserAccount("Nguyen Long", "long@example.com", "hashed", null, UserRole.MEMBER);
        ReflectionTestUtils.setField(seller, "id", 7L);
        pendingListing = new Listing(
                "Máy ảnh film Canon AE-1",
                "Điện tử",
                BigDecimal.valueOf(3_900_000),
                ListingCondition.USED,
                "Quận 3, TP. Hồ Chí Minh",
                "0912345678",
                "https://example.com/camera.jpg",
                seller.getFullName(),
                "NL",
                "Máy ảnh còn hoạt động tốt, có bao da và dây đeo.",
                true,
                "Canon\n35mm",
                seller);
        ReflectionTestUtils.setField(pendingListing, "id", 41L);
    }

    @Test
    void memberCannotApproveOwnPendingListing() {
        when(currentUserService.requireUser()).thenReturn(seller);
        when(listingRepository.findByIdAndSellerId(41L, 7L)).thenReturn(java.util.Optional.of(pendingListing));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> listingService.updateStatus(41L, ListingStatus.ACTIVE));

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        assertEquals(ListingStatus.PENDING, pendingListing.getStatus());
    }

    @Test
    void memberCanMarkActiveListingAsSold() {
        when(currentUserService.requireUser()).thenReturn(seller);
        pendingListing.changeStatus(ListingStatus.ACTIVE, null);
        when(listingRepository.findByIdAndSellerId(41L, 7L)).thenReturn(java.util.Optional.of(pendingListing));

        listingService.updateStatus(41L, ListingStatus.SOLD);

        assertEquals(ListingStatus.SOLD, pendingListing.getStatus());
    }

    @Test
    void authenticatedMemberCanRetrieveActiveListingContactPhone() {
        when(currentUserService.requireUser()).thenReturn(seller);
        pendingListing.changeStatus(ListingStatus.ACTIVE, null);
        when(listingRepository.findById(41L)).thenReturn(java.util.Optional.of(pendingListing));

        PhoneResponse response = listingService.getSellerPhone(41L);

        assertEquals("0912345678", response.phone());
    }

    @Test
    void listingContactPhoneRequiresAuthenticationBeforeLookup() {
        ResponseStatusException unauthorized = new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        when(currentUserService.requireUser()).thenThrow(unauthorized);

        assertThrows(ResponseStatusException.class, () -> listingService.getSellerPhone(41L));
        verifyNoInteractions(listingRepository);
    }

    @Test
    void createListingPersistsCoverFirstImageGallery() {
        when(currentUserService.requireUser()).thenReturn(seller);
        when(categoryRepository.existsByNameIgnoreCase("Điện tử")).thenReturn(true);
        when(listingRepository.save(any(Listing.class))).thenAnswer(invocation -> {
            Listing saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 42L);
            return saved;
        });
        List<String> images = List.of(
                "https://example.com/cover.jpg",
                "https://example.com/detail.jpg");
        CreateListingRequest request = new CreateListingRequest(
                "Máy ảnh film Canon AE-1",
                "Điện tử",
                BigDecimal.valueOf(3_900_000),
                ListingCondition.USED,
                "Quận 3, TP. Hồ Chí Minh",
                "0912345678",
                images.getFirst(),
                images,
                "Máy ảnh còn hoạt động tốt, có bao da và dây đeo.",
                true,
                List.of("Canon", "35mm"));

        ListingResponse response = listingService.create(request);

        assertEquals(images, response.images());
        assertEquals(images.getFirst(), response.image());
        verify(listingRepository).save(any(Listing.class));
    }

    @Test
    void createListingRejectsMoreThanTenImages() {
        when(currentUserService.requireUser()).thenReturn(seller);
        when(categoryRepository.existsByNameIgnoreCase("Điện tử")).thenReturn(true);
        List<String> images = java.util.Collections.nCopies(11, "https://example.com/item.jpg");
        CreateListingRequest request = new CreateListingRequest(
                "Máy ảnh film Canon AE-1",
                "Điện tử",
                BigDecimal.valueOf(3_900_000),
                ListingCondition.USED,
                "Quận 3, TP. Hồ Chí Minh",
                "0912345678",
                images.getFirst(),
                images,
                "Máy ảnh còn hoạt động tốt, có bao da và dây đeo.",
                true,
                List.of("Canon", "35mm"));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> listingService.create(request));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
    }
}
