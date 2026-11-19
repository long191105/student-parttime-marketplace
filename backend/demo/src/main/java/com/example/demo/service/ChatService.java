package com.example.demo.service;

import java.time.Instant;
import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.dto.ChatConversationResponse;
import com.example.demo.dto.ChatMessageResponse;
import com.example.demo.model.ChatConversation;
import com.example.demo.model.ChatMessage;
import com.example.demo.model.Listing;
import com.example.demo.model.ListingStatus;
import com.example.demo.model.UserAccount;
import com.example.demo.repository.ChatConversationRepository;
import com.example.demo.repository.ChatMessageRepository;
import com.example.demo.repository.ListingRepository;

@Service
public class ChatService {

    private final ChatConversationRepository conversationRepository;
    private final ChatMessageRepository messageRepository;
    private final ListingRepository listingRepository;
    private final CurrentUserService currentUserService;

    public ChatService(
            ChatConversationRepository conversationRepository,
            ChatMessageRepository messageRepository,
            ListingRepository listingRepository,
            CurrentUserService currentUserService) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.listingRepository = listingRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public List<ChatConversationResponse> listConversations() {
        UserAccount user = currentUserService.requireUser();
        return conversationRepository.findByBuyerIdOrSellerIdOrderByUpdatedAtDesc(user.getId(), user.getId())
                .stream()
                .map(conversation -> toResponse(conversation, user))
                .toList();
    }

    @Transactional
    public ChatConversationResponse openForListing(Long listingId) {
        UserAccount buyer = currentUserService.requireUser();
        Listing listing = listingRepository.findById(listingId)
                .filter(item -> item.getStatus() == ListingStatus.ACTIVE)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tin đăng đang hiển thị."));
        UserAccount seller = listing.getSeller();
        if (seller.getId().equals(buyer.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bạn không thể tự bắt đầu cuộc trò chuyện với tin đăng của mình.");
        }

        ChatConversation conversation = conversationRepository.findByListingIdAndBuyerId(listingId, buyer.getId())
                .orElseGet(() -> conversationRepository.save(new ChatConversation(listing, buyer, seller)));
        return toResponse(conversation, buyer);
    }

    @Transactional
    public List<ChatMessageResponse> getMessages(Long conversationId) {
        UserAccount user = currentUserService.requireUser();
        ChatConversation conversation = requireParticipant(conversationId, user);
        messageRepository.markUnreadAsRead(conversation.getId(), user.getId(), Instant.now());
        return messageRepository.findByConversationIdOrderBySentAtAsc(conversationId)
                .stream()
                .map(ChatMessageResponse::from)
                .toList();
    }

    @Transactional
    public ChatMessageResponse sendMessage(Long conversationId, String content) {
        UserAccount sender = currentUserService.requireUser();
        String normalizedContent = content == null ? "" : content.trim();
        if (normalizedContent.isEmpty() || normalizedContent.length() > 2000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tin nhắn phải có từ 1 đến 2.000 ký tự.");
        }
        ChatConversation conversation = requireParticipant(conversationId, sender);
        ChatMessage message = messageRepository.save(new ChatMessage(conversation, sender, normalizedContent));
        conversation.touch();
        conversationRepository.save(conversation);
        return ChatMessageResponse.from(message);
    }

    @Transactional(readOnly = true)
    public Set<Long> getParticipantIds(Long conversationId) {
        ChatConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy cuộc trò chuyện."));
        return Set.of(conversation.getBuyer().getId(), conversation.getSeller().getId());
    }

    private ChatConversation requireParticipant(Long conversationId, UserAccount user) {
        ChatConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy cuộc trò chuyện."));
        if (!conversation.getBuyer().getId().equals(user.getId())
                && !conversation.getSeller().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy cuộc trò chuyện.");
        }
        return conversation;
    }

    private ChatConversationResponse toResponse(ChatConversation conversation, UserAccount currentUser) {
        UserAccount participant = conversation.getBuyer().getId().equals(currentUser.getId())
                ? conversation.getSeller()
                : conversation.getBuyer();
        String lastMessage = messageRepository.findFirstByConversationIdOrderBySentAtDesc(conversation.getId())
                .map(ChatMessage::getContent)
                .orElse("");
        long unreadCount = messageRepository.countUnreadByConversationAndUser(
                conversation.getId(),
                currentUser.getId());
        Listing listing = conversation.getListing();
        return new ChatConversationResponse(
                conversation.getId().toString(),
                listing.getId().toString(),
                listing.getTitle(),
                listing.getImageUrl(),
                listing.getPrice(),
                listing.isGiveaway(),
                participant.getFullName(),
                initials(participant.getFullName()),
                lastMessage,
                conversation.getUpdatedAt(),
                unreadCount);
    }

    private static String initials(String fullName) {
        String[] parts = fullName.trim().split("\\s+");
        if (parts.length == 1) return parts[0].substring(0, 1).toUpperCase();
        return (parts[parts.length - 2].substring(0, 1) + parts[parts.length - 1].substring(0, 1)).toUpperCase();
    }
}
