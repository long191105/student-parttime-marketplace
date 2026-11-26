package com.example.demo.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.model.ListingStatus;

@ExtendWith(MockitoExtension.class)
class ListingModerationEmailListenerTest {

    @Mock
    private BrevoEmailService emailService;

    private ListingModerationEmailListener listener;

    @BeforeEach
    void setUp() {
        listener = new ListingModerationEmailListener(emailService);
    }

    @Test
    void doesNotPropagateEmailFailureAfterModerationCommit() {
        ListingModerationEmailEvent event = new ListingModerationEmailEvent(
                22L,
                "seller@gmail.com",
                "Nguyen Long",
                "Máy ảnh",
                ListingStatus.REJECTED,
                "Thiếu hình ảnh.");
        doThrow(new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Email unavailable"))
                .when(emailService)
                .sendListingModerationUpdate(
                        event.recipientEmail(),
                        event.recipientName(),
                        event.listingTitle(),
                        event.status(),
                        event.reason());

        assertDoesNotThrow(() -> listener.sendModerationEmail(event));

        verify(emailService).sendListingModerationUpdate(
                event.recipientEmail(),
                event.recipientName(),
                event.listingTitle(),
                event.status(),
                event.reason());
    }
}
