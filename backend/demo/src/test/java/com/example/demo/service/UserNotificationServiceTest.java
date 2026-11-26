package com.example.demo.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import java.math.BigDecimal;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.util.ReflectionTestUtils;

import com.example.demo.model.ChatConversation;
import com.example.demo.model.Listing;
import com.example.demo.model.ListingCondition;
import com.example.demo.model.ListingStatus;
import com.example.demo.model.UserAccount;
import com.example.demo.model.UserNotification;
import com.example.demo.model.UserNotificationType;
import com.example.demo.model.UserRole;
import com.example.demo.repository.UserNotificationRepository;

@ExtendWith(MockitoExtension.class)
class UserNotificationServiceTest {

    @Mock
    private UserNotificationRepository notificationRepository;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    private UserNotificationService notificationService;
    private UserAccount seller;
    private Listing listing;

    @BeforeEach
    void setUp() {
        notificationService = new UserNotificationService(
                notificationRepository,
                currentUserService,
                eventPublisher);
        seller = new UserAccount("Nguyen Long", "long@gmail.com", "hashed", null, UserRole.MEMBER);
        ReflectionTestUtils.setField(seller, "id", 7L);
        listing = new Listing(
                "Máy ảnh",
                "Điện tử",
                BigDecimal.valueOf(1200),
                ListingCondition.USED,
                "TP. Hồ Chí Minh",
                null,
                "https://example.com/image.jpg",
                "Nguyen Long",
                "NL",
                "Máy ảnh còn hoạt động tốt.",
                false,
                "",
                seller);
        ReflectionTestUtils.setField(listing, "id", 22L);
    }

    @Test
    void savesWebsiteNotificationAndPublishesEmailAfterModerationOutcome() {
        notificationService.notifyListingStatus(seller, listing, ListingStatus.REJECTED, "Thiếu hình ảnh.");

        ArgumentCaptor<UserNotification> notificationCaptor = ArgumentCaptor.forClass(UserNotification.class);
        verify(notificationRepository).save(notificationCaptor.capture());
        UserNotification notification = notificationCaptor.getValue();
        assertEquals(UserNotificationType.LISTING_REJECTED, notification.getType());
        assertEquals("22", notification.getTargetId());
        assertEquals("Tin “Máy ảnh” đã bị từ chối. Lý do: Thiếu hình ảnh.", notification.getDetail());

        ArgumentCaptor<ListingModerationEmailEvent> eventCaptor =
                ArgumentCaptor.forClass(ListingModerationEmailEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        ListingModerationEmailEvent event = eventCaptor.getValue();
        assertEquals(22L, event.listingId());
        assertEquals("long@gmail.com", event.recipientEmail());
        assertEquals(ListingStatus.REJECTED, event.status());
        assertEquals("Thiếu hình ảnh.", event.reason());
    }

    @Test
    void publishesEmailEventWhenListingIsApproved() {
        notificationService.notifyListingStatus(seller, listing, ListingStatus.ACTIVE, null);

        ArgumentCaptor<ListingModerationEmailEvent> eventCaptor =
                ArgumentCaptor.forClass(ListingModerationEmailEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        ListingModerationEmailEvent event = eventCaptor.getValue();
        assertEquals("long@gmail.com", event.recipientEmail());
        assertEquals(ListingStatus.ACTIVE, event.status());
    }

    @Test
    void doesNotPublishEmailEventsForNewMessageNotifications() {
        UserAccount buyer = new UserAccount("Mai Tran", "mai@gmail.com", "hashed", null, UserRole.MEMBER);
        ReflectionTestUtils.setField(buyer, "id", 8L);
        ChatConversation conversation = new ChatConversation(listing, buyer, seller);
        ReflectionTestUtils.setField(conversation, "id", 31L);

        notificationService.notifyNewMessage(
                buyer,
                conversation,
                seller,
                "Xin chào");

        verify(notificationRepository).save(any(UserNotification.class));
        verifyNoInteractions(eventPublisher);
    }
}
