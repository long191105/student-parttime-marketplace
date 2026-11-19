package com.example.demo.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
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

import com.example.demo.model.ChatConversation;
import com.example.demo.model.ChatMessage;
import com.example.demo.model.Listing;
import com.example.demo.model.ListingCondition;
import com.example.demo.model.ListingStatus;
import com.example.demo.model.UserAccount;
import com.example.demo.model.UserRole;
import com.example.demo.repository.ChatConversationRepository;
import com.example.demo.repository.ChatMessageRepository;
import com.example.demo.repository.ListingRepository;
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
    private ListingRepository listingRepository;

    @Mock
    private CurrentUserService currentUserService;

    private ChatService chatService;
    private UserAccount buyer;
    private UserAccount seller;
    private Listing listing;
    private ChatConversation conversation;

    @BeforeEach
    void setUp() {
        chatService = new ChatService(conversationRepository, messageRepository, listingRepository, currentUserService);
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
        assertEquals("Tran Mai", response.participantName());
        verify(conversationRepository).save(any(ChatConversation.class));
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

    private static UserAccount user(Long id, String name) {
        UserAccount user = new UserAccount(name, name.replace(" ", ".").toLowerCase() + "@example.com", "hashed", null, UserRole.MEMBER);
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }
}
