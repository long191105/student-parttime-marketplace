package com.example.demo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class ListingModerationEmailListener {

    private static final Logger LOGGER = LoggerFactory.getLogger(ListingModerationEmailListener.class);

    private final BrevoEmailService emailService;

    public ListingModerationEmailListener(BrevoEmailService emailService) {
        this.emailService = emailService;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void sendModerationEmail(ListingModerationEmailEvent event) {
        try {
            emailService.sendListingModerationUpdate(
                    event.recipientEmail(),
                    event.recipientName(),
                    event.listingTitle(),
                    event.status(),
                    event.reason());
        } catch (RuntimeException exception) {
            LOGGER.error(
                    "Could not send moderation email for listing {} after status {}: {}",
                    event.listingId(),
                    event.status(),
                    exception.getMessage());
        }
    }
}
