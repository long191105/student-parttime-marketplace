package com.example.demo.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;

import com.example.demo.model.ChatConversation;
import com.example.demo.model.ChatMessage;
import com.example.demo.model.ChatReview;
import com.example.demo.model.Listing;
import com.example.demo.model.ListingCondition;
import com.example.demo.model.ListingStatus;
import com.example.demo.model.UserAccount;
import com.example.demo.model.UserRole;
import com.example.demo.repository.ChatConversationRepository;
import com.example.demo.repository.ChatMessageRepository;
import com.example.demo.repository.ChatReviewRepository;
import com.example.demo.repository.ListingRepository;
import com.example.demo.repository.UserAccountRepository;
import com.example.demo.dto.ChatReviewRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock
    private ChatConversationRepository conversationRepository;

    @Mock
    private ChatMessageRepository messageRepository;

    @Mock
    private ChatReviewRepository reviewRepository;

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private UserAccountRepository userAccountRepository;

    @Mock
    private CurrentUserService currentUserService;

    private ChatService chatService;
    private UserAccount buyer;
    private UserAccount seller;
    private Listing listing;
    private ChatConversation conversation;

    @BeforeEach
    void setUp() {
        chatService = new ChatService(
                conversationRepository,
                messageRepository,
                reviewRepository,
                listingRepository,
                userAccountRepository,
                currentUserService);
        buyer = user(11L, "Nguyen Long");
        seller = user(12L, "Tran Mai");
        listing = new Listing(
                "Máy ảnh cần trao đổi",
                "Điện tử",
                BigDecimal.valueOf(1200),
                ListingCondition.USED,
                "TP. Hồ Chí Minh",
                null,
                "https://example.com/image.jpg",
                "Tran Mai",
                "TM",
                "Mô tả sản phẩm cần trao đổi.",
                false,
                "",
                seller);
        listing.changeStatus(ListingStatus.ACTIVE, null);
        ReflectionTestUtils.setField(listing, "id", 22L);
        conversation = new ChatConversation(listing, buyer, seller);
        ReflectionTestUtils.setField(conversation, "id", 31L);
    }

    @Test
    void opensOneConversationForTheBuyerAndListing() {
        when(currentUserService.requireUser()).thenReturn(buyer);
        when(listingRepository.findById(22L)).thenReturn(Optional.of(listing));
        when(conversationRepository.findByListingIdAndBuyerId(22L, 11L)).thenReturn(Optional.empty());
        when(conversationRepository.save(any(ChatConversation.class))).thenAnswer(invocation -> {
            ChatConversation saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 31L);
            return saved;
        });
        when(messageRepository.findFirstByConversationIdOrderBySentAtDesc(31L)).thenReturn(Optional.empty());
        when(messageRepository.countUnreadByConversationAndUser(31L, 11L)).thenReturn(0L);

        var response = chatService.openForListing(22L);

        assertEquals("31", response.id());
        assertEquals("22", response.listingId());
        assertEquals("12", response.participantId());
        assertEquals("Tran Mai", response.participantName());
        verify(conversationRepository).save(any(ChatConversation.class));
    }

    @Test
    void listsChatPeersAndTheirLastActiveTimes() {
        Instant lastActiveAt = Instant.parse("2026-11-23T06:00:00Z");
        seller.setLastActiveAt(lastActiveAt);
        when(conversationRepository.findByBuyerIdOrSellerIdOrderByUpdatedAtDesc(11L, 11L))
                .thenReturn(List.of(conversation));
        when(userAccountRepository.findAllById(Set.of(12L))).thenReturn(List.of(seller));

        assertEquals(Set.of(12L), chatService.getConversationPeerIds(11L));
        assertEquals(lastActiveAt, chatService.getLastActiveAt(Set.of(12L)).get(12L));
    }

    @Test
    void updatesUserLastActiveTime() {
        Instant lastActiveAt = Instant.parse("2026-11-23T06:00:00Z");
        when(userAccountRepository.findById(12L)).thenReturn(Optional.of(seller));

        chatService.updateLastActiveAt(12L, lastActiveAt);

        assertEquals(lastActiveAt, seller.getLastActiveAt());
    }

    @Test
    void reusesAnExistingConversationForTheSameBuyerAndListing() {
        when(currentUserService.requireUser()).thenReturn(buyer);
        when(listingRepository.findById(22L)).thenReturn(Optional.of(listing));
        when(conversationRepository.findByListingIdAndBuyerId(22L, 11L)).thenReturn(Optional.of(conversation));
        when(messageRepository.findFirstByConversationIdOrderBySentAtDesc(31L)).thenReturn(Optional.empty());
        when(messageRepository.countUnreadByConversationAndUser(31L, 11L)).thenReturn(0L);

        var response = chatService.openForListing(22L);

        assertEquals("31", response.id());
        verify(conversationRepository, never()).save(any(ChatConversation.class));
    }

    @Test
    void persistsMessagesFromConversationParticipants() {
        when(currentUserService.requireUser()).thenReturn(buyer);
        when(conversationRepository.findById(31L)).thenReturn(Optional.of(conversation));
        when(messageRepository.save(any(ChatMessage.class))).thenAnswer(invocation -> {
            ChatMessage saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 45L);
            return saved;
        });

        var response = chatService.sendMessage(31L, "  Chào bạn!  ");

        assertEquals("45", response.id());
        assertEquals("Chào bạn!", response.content());
        assertEquals("11", response.senderId());
        verify(conversationRepository).save(conversation);
    }

    @Test
    void recordsBusyCallAsAMissedCallMessage() {
        when(currentUserService.requireUser()).thenReturn(buyer);
        when(conversationRepository.findById(31L)).thenReturn(Optional.of(conversation));
        when(messageRepository.save(any(ChatMessage.class))).thenAnswer(invocation -> {
            ChatMessage saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 48L);
            return saved;
        });

        var response = chatService.recordMissedCall(31L, "video");

        assertEquals("48", response.id());
        assertEquals("Người nhận đang bận. Đã nhỡ cuộc gọi video", response.content());
        assertEquals("MISSED_CALL", response.messageType());
        verify(conversationRepository).save(conversation);
    }

    @Test
    void rejectsUnsupportedMissedCallTypes() {
        when(currentUserService.requireUser()).thenReturn(buyer);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> chatService.recordMissedCall(31L, "screen-share"));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        verify(conversationRepository, never()).findById(31L);
    }

    @Test
    void recordsCallFailuresInTheConversation() {
        when(currentUserService.requireUser()).thenReturn(buyer);
        when(conversationRepository.findById(31L)).thenReturn(Optional.of(conversation));
        when(messageRepository.save(any(ChatMessage.class))).thenAnswer(invocation -> {
            ChatMessage saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 49L);
            return saved;
        });

        var declined = chatService.recordCallStatusMessage(31L, "audio", "declined");
        var unavailable = chatService.recordCallStatusMessage(31L, "video", "unavailable");
        var cancelled = chatService.recordCallStatusMessage(31L, "audio", "cancelled");
        var noAnswer = chatService.recordCallStatusMessage(31L, "video", "no-answer");

        assertEquals("Người nhận đã từ chối cuộc gọi thoại", declined.content());
        assertEquals("Người nhận hiện không trực tuyến để nhận cuộc gọi video", unavailable.content());
        assertEquals("Cuộc gọi thoại đã bị hủy", cancelled.content());
        assertEquals("Không có phản hồi cho cuộc gọi video", noAnswer.content());
        assertEquals("MISSED_CALL", declined.messageType());
        assertEquals("MISSED_CALL", unavailable.messageType());
    }

    @Test
    void attributesDeclinedCallToTheInitiatorWhenRecipientDeclines() {
        when(currentUserService.requireUser()).thenReturn(seller);
        when(conversationRepository.findById(31L)).thenReturn(Optional.of(conversation));
        when(messageRepository.save(any(ChatMessage.class))).thenAnswer(invocation -> {
            ChatMessage saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 51L);
            return saved;
        });

        var response = chatService.recordCallStatusMessage(31L, "video", "declined", 11L);

        assertEquals("11", response.senderId());
        assertEquals("Nguyen Long", response.senderName());
        assertEquals("MISSED_CALL", response.messageType());
    }

    @Test
    void recordsCompletedCallWithItsDuration() {
        when(currentUserService.requireUser()).thenReturn(seller);
        when(conversationRepository.findById(31L)).thenReturn(Optional.of(conversation));
        when(messageRepository.save(any(ChatMessage.class))).thenAnswer(invocation -> {
            ChatMessage saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 50L);
            return saved;
        });

        var response = chatService.recordCompletedCall(31L, "video", 125, 11L);

        assertEquals("Cuộc gọi video đã kết thúc • 2 phút 5 giây", response.content());
        assertEquals("11", response.senderId());
        assertEquals("CALL", response.messageType());
        verify(conversationRepository).save(conversation);
    }

    @Test
    void persistsGpsCoordinatesAsARestrictedGoogleMapsLocation() {
        when(currentUserService.requireUser()).thenReturn(buyer);
        when(conversationRepository.findById(31L)).thenReturn(Optional.of(conversation));
        when(messageRepository.save(any(ChatMessage.class))).thenAnswer(invocation -> {
            ChatMessage saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 46L);
            return saved;
        });

        var response = chatService.sendLocationMessage(
                31L,
                "Vị trí hiện tại",
                10.7769,
                106.7009,
                "https://www.google.com/maps/search/?api=1&query=10.7769%2C106.7009");

        assertEquals("LOCATION", response.messageType());
        assertEquals(Double.valueOf(10.7769), response.latitude());
        assertEquals(Double.valueOf(106.7009), response.longitude());
        assertEquals("https://www.google.com/maps/search/?api=1&query=10.7769%2C106.7009", response.mapUrl());
    }

    @Test
    void persistsPinnedGoogleMapsPlacesWithoutSharingDeviceCoordinates() {
        when(currentUserService.requireUser()).thenReturn(buyer);
        when(conversationRepository.findById(31L)).thenReturn(Optional.of(conversation));
        when(messageRepository.save(any(ChatMessage.class))).thenAnswer(invocation -> {
            ChatMessage saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 47L);
            return saved;
        });

        var response = chatService.sendLocationMessage(
                31L,
                "Vị trí ghim: Chợ Bến Thành",
                null,
                null,
                "https://www.google.com/maps/search/?api=1&query=Ch%E1%BB%A3+B%E1%BA%BFn+Th%C3%A0nh");

        assertEquals("LOCATION", response.messageType());
        assertNull(response.latitude());
        assertNull(response.longitude());
        assertTrue(response.mapUrl().startsWith("https://www.google.com/maps/"));
    }

    @Test
    void rejectsInvalidLocationCoordinatesAndNonGoogleLinks() {
        when(currentUserService.requireUser()).thenReturn(buyer);

        ResponseStatusException invalidCoordinates = assertThrows(
                ResponseStatusException.class,
                () -> chatService.sendLocationMessage(
                        31L,
                        "Vị trí ghim",
                        91.0,
                        106.0,
                        "https://www.google.com/maps/search/?api=1&query=10%2C106"));
        ResponseStatusException untrustedLink = assertThrows(
                ResponseStatusException.class,
                () -> chatService.sendLocationMessage(
                        31L,
                        "Vị trí ghim",
                        null,
                        null,
                        "https://example.com/maps"));

        assertEquals(HttpStatus.BAD_REQUEST, invalidCoordinates.getStatusCode());
        assertEquals(HttpStatus.BAD_REQUEST, untrustedLink.getStatusCode());
        verify(conversationRepository, never()).findById(31L);
        verify(messageRepository, never()).save(any(ChatMessage.class));
    }

    @Test
    void doesNotAllowUsersOutsideTheConversationToReadOrSendMessages() {
        UserAccount outsider = user(13L, "Le An");
        when(currentUserService.requireUser()).thenReturn(outsider);
        when(conversationRepository.findById(31L)).thenReturn(Optional.of(conversation));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> chatService.sendMessage(31L, "Tin nhắn riêng tư"));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        verify(messageRepository, never()).save(any(ChatMessage.class));
    }

    @Test
    void returnsParticipantIdsOnlyToConversationMembers() {
        when(currentUserService.requireUser()).thenReturn(buyer);
        when(conversationRepository.findById(31L)).thenReturn(Optional.of(conversation));

        assertEquals(Set.of(11L, 12L), chatService.getParticipantIds(31L));
    }

    @Test
    void doesNotRevealParticipantIdsToUsersOutsideTheConversation() {
        UserAccount outsider = user(13L, "Le An");
        when(currentUserService.requireUser()).thenReturn(outsider);
        when(conversationRepository.findById(31L)).thenReturn(Optional.of(conversation));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> chatService.getParticipantIds(31L));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }

    @Test
    void marksMessagesAsReadWhenAConversationIsOpened() {
        when(currentUserService.requireUser()).thenReturn(buyer);
        when(conversationRepository.findById(31L)).thenReturn(Optional.of(conversation));
        when(messageRepository.findByConversationIdOrderBySentAtAsc(31L)).thenReturn(List.of());

        assertTrue(chatService.getMessages(31L).isEmpty());

        verify(messageRepository).markUnreadAsRead(
                eq(31L),
                eq(11L),
                any(Instant.class));
    }

    @Test
    void rejectsBlankMessages() {
        when(currentUserService.requireUser()).thenReturn(buyer);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> chatService.sendMessage(31L, "   "));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        assertTrue(exception.getReason().contains("2.000"));
        verify(conversationRepository, never()).findById(31L);
    }

    @Test
    void onlySellerCanConfirmSaleForTheCurrentConversation() {
        when(currentUserService.requireUser()).thenReturn(seller);
        when(conversationRepository.findById(31L)).thenReturn(Optional.of(conversation));
        when(listingRepository.findByIdForUpdate(22L)).thenReturn(Optional.of(listing));
        when(messageRepository.findFirstByConversationIdOrderBySentAtDesc(31L)).thenReturn(Optional.empty());
        when(messageRepository.countUnreadByConversationAndUser(31L, 12L)).thenReturn(0L);

        var response = chatService.confirmSale(31L);

        assertEquals(ListingStatus.SOLD, listing.getStatus());
        assertTrue(conversation.getSaleConfirmedAt() != null);
        assertTrue(response.saleConfirmed());
        assertTrue(response.currentUserIsSeller());

        when(currentUserService.requireUser()).thenReturn(buyer);
        assertThrows(ResponseStatusException.class, () -> chatService.confirmSale(31L));
        verify(listingRepository, org.mockito.Mockito.times(1)).findByIdForUpdate(22L);
    }

    @Test
    void buyerCanReviewOnlyAfterSaleAndReviewStaysHiddenUntilSecondReview() {
        when(currentUserService.requireUser()).thenReturn(buyer);
        when(conversationRepository.findById(31L)).thenReturn(Optional.of(conversation));

        ResponseStatusException beforeSale = assertThrows(
                ResponseStatusException.class,
                () -> chatService.submitReview(31L, new ChatReviewRequest(5, "Tốt", List.of("Mô tả đúng thực tế"), List.of())));
        assertEquals(HttpStatus.CONFLICT, beforeSale.getStatusCode());

        conversation.confirmSale();
        AtomicReference<ChatReview> savedReview = new AtomicReference<>();
        when(reviewRepository.findByConversationIdAndReviewerId(31L, 11L)).thenReturn(Optional.empty());
        when(reviewRepository.save(any(ChatReview.class))).thenAnswer(invocation -> {
            ChatReview review = invocation.getArgument(0);
            ReflectionTestUtils.setField(review, "id", 61L);
            savedReview.set(review);
            return review;
        });
        when(reviewRepository.findByConversationIdOrderByCreatedAtAsc(31L)).thenAnswer(invocation ->
                savedReview.get() == null ? List.of() : List.of(savedReview.get()));

        var status = chatService.submitReview(
                31L,
                new ChatReviewRequest(5, "Tốt", List.of("Mô tả đúng thực tế"), List.of("https://example.com/item.jpg")));

        assertTrue(status.ownReviewSubmitted());
        assertEquals("61", status.ownReview().id());
        assertTrue(status.publishedReviews().isEmpty());
    }

    private static UserAccount user(Long id, String name) {
        UserAccount user = new UserAccount(name, name.replace(" ", ".").toLowerCase() + "@example.com", "hashed", null, UserRole.MEMBER);
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }
}
