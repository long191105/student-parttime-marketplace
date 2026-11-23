package com.example.demo.controller;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.test.util.ReflectionTestUtils;

import com.example.demo.model.Listing;
import com.example.demo.model.ListingCondition;
import com.example.demo.model.ListingStatus;
import com.example.demo.model.UserAccount;
import com.example.demo.model.UserRole;
import com.example.demo.repository.CategoryRepository;
import com.example.demo.repository.ListingRepository;
import com.example.demo.service.CurrentUserService;
import com.example.demo.service.ListingDraftService;
import com.example.demo.service.ListingService;

class ListingPhoneApiTest {

    private static final long LISTING_ID = 41L;
    private static final String PHONE = "0912345678";

    private final ListingRepository listingRepository = mock(ListingRepository.class);
    private final CurrentUserService currentUserService = mock(CurrentUserService.class);
    private final UserAccount member = new UserAccount("Nguyen Long", "long@example.com", "hashed", null, UserRole.MEMBER);

    private MockMvc mockMvc;
    private Listing listing;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(member, "id", 7L);
        listing = new Listing(
                "Máy ảnh film Canon AE-1",
                "Điện tử",
                BigDecimal.valueOf(3_900_000),
                ListingCondition.USED,
                "Quận 3, TP. Hồ Chí Minh",
                PHONE,
                "https://example.com/camera.jpg",
                member.getFullName(),
                "NL",
                "Máy ảnh còn hoạt động tốt.",
                true,
                "Canon",
                member);
        ReflectionTestUtils.setField(listing, "id", LISTING_ID);

        when(currentUserService.requireUser()).thenReturn(member);
        ListingService listingService = new ListingService(
                listingRepository,
                mock(CategoryRepository.class),
                currentUserService,
                mock(ListingDraftService.class));
        ListingController listingController = new ListingController(
                listingService,
                mock(ListingDraftService.class));
        mockMvc = MockMvcBuilders.standaloneSetup(listingController).build();
    }

    @Test
    void activeListingReturnsContactPhone() throws Exception {
        listing.changeStatus(ListingStatus.ACTIVE, null);
        when(listingRepository.findById(LISTING_ID)).thenReturn(Optional.of(listing));

        mockMvc.perform(get("/api/listings/{id}/phone", LISTING_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phone").value(PHONE));
    }

    @ParameterizedTest
    @EnumSource(value = ListingStatus.class, names = { "PENDING", "HIDDEN", "SOLD", "REJECTED" })
    void nonActiveListingDoesNotReturnContactPhone(ListingStatus status) throws Exception {
        listing.changeStatus(status, null);
        when(listingRepository.findById(LISTING_ID)).thenReturn(Optional.of(listing));

        mockMvc.perform(get("/api/listings/{id}/phone", LISTING_ID))
                .andExpect(status().isNotFound())
                .andExpect(content().string(not(containsString(PHONE))));
    }

    @Test
    void unknownListingDoesNotReturnContactPhone() throws Exception {
        when(listingRepository.findById(LISTING_ID)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/listings/{id}/phone", LISTING_ID))
                .andExpect(status().isNotFound())
                .andExpect(content().string(not(containsString(PHONE))));
    }
}
