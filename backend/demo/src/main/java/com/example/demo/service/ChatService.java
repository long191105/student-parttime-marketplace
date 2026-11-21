package com.example.demo.service;

import java.time.Instant;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.dto.ChatConversationResponse;
import com.example.demo.dto.ChatMessageResponse;
import com.example.demo.model.ChatConversation;
import com.example.demo.model.ChatMessage;
import com.example.demo.model.ChatMessageType;
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
        String normalizedContent = validateContent(content == null ? "" : content.trim());
        ChatConversation conversation = requireParticipant(conversationId, sender);
        ChatMessage message = messageRepository.save(new ChatMessage(
                conversation,
                sender,
                normalizedContent,
                ChatMessageType.TEXT,
                null,
                null,
                null));
        conversation.touch();
        conversationRepository.save(conversation);
        return ChatMessageResponse.from(message);
    }

    @Transactional
    public ChatMessageResponse sendLocationMessage(
            Long conversationId,
            String content,
            Double latitude,
            Double longitude,
            String mapUrl) {
        UserAccount sender = currentUserService.requireUser();
        String normalizedMapUrl = validateMapUrl(mapUrl);
        String normalizedContent = validateContent(content == null || content.isBlank() ? "Vị trí được chia sẻ" : content.trim());
        if ((latitude == null) != (longitude == null)
                || (latitude != null && (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tọa độ vị trí không hợp lệ.");
        }
        ChatConversation conversation = requireParticipant(conversationId, sender);
        ChatMessage message = messageRepository.save(new ChatMessage(
                conversation,
                sender,
                normalizedContent,
                ChatMessageType.LOCATION,
                latitude,
                longitude,
                normalizedMapUrl));
        conversation.touch();
        conversationRepository.save(conversation);
        return ChatMessageResponse.from(message);
    }

    @Transactional
    public ChatMessageResponse recordMissedCall(Long conversationId, String callType) {
        return recordCallStatusMessage(conversationId, callType, "busy");
    }

    @Transactional
    public ChatMessageResponse recordCallStatusMessage(Long conversationId, String callType, String outcome) {
        UserAccount sender = currentUserService.requireUser();
        if (!"audio".equals(callType) && !"video".equals(callType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Loại cuộc gọi không hợp lệ.");
        }
        String callLabel = "video".equals(callType) ? "video" : "thoại";
        String content = switch (outcome) {
            case "busy" -> "Người nhận đang bận. Đã nhỡ cuộc gọi " + callLabel;
            case "declined" -> "Người nhận đã từ chối cuộc gọi " + callLabel;
            case "unavailable" -> "Người nhận hiện không trực tuyến để nhận cuộc gọi " + callLabel;
            case "cancelled" -> "Cuộc gọi " + callLabel + " đã bị hủy";
            case "no-answer" -> "Không có phản hồi cho cuộc gọi " + callLabel;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái cuộc gọi không hợp lệ.");
        };
        ChatConversation conversation = requireParticipant(conversationId, sender);
        ChatMessage message = messageRepository.save(new ChatMessage(
                conversation,
                sender,
                content,
                ChatMessageType.TEXT,
                null,
                null,
                null));
        conversation.touch();
        conversationRepository.save(conversation);
        return ChatMessageResponse.from(message);
    }

    @Transactional
    public ChatMessageResponse recordCompletedCall(Long conversationId, String callType, long durationSeconds) {
        UserAccount sender = currentUserService.requireUser();
        if (!"audio".equals(callType) && !"video".equals(callType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Loại cuộc gọi không hợp lệ.");
        }
        if (durationSeconds < 0 || durationSeconds > 86_400) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thời lượng cuộc gọi không hợp lệ.");
        }
        ChatConversation conversation = requireParticipant(conversationId, sender);
        String callLabel = "video".equals(callType) ? "video" : "thoại";
        String content = "Cuộc gọi " + callLabel + " đã kết thúc"
                + (durationSeconds == 0 ? "" : " • " + formatCallDuration(durationSeconds));
        ChatMessage message = messageRepository.save(new ChatMessage(
                conversation,
                sender,
                content,
                ChatMessageType.TEXT,
                null,
                null,
                null));
        conversation.touch();
        conversationRepository.save(conversation);
        return ChatMessageResponse.from(message);
    }

    @Transactional(readOnly = true)
    public Set<Long> getParticipantIds(Long conversationId) {
        ChatConversation conversation = requireParticipant(conversationId, currentUserService.requireUser());
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

    private static String validateContent(String content) {
        if (content.isEmpty() || content.length() > 2000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tin nhắn phải có từ 1 đến 2.000 ký tự.");
        }
        return content;
    }

    private static String formatCallDuration(long seconds) {
        long minutes = seconds / 60;
        long remainingSeconds = seconds % 60;
        if (minutes == 0) return seconds + " giây";
        if (remainingSeconds == 0) return minutes + " phút";
        return minutes + " phút " + remainingSeconds + " giây";
    }

    private static String validateMapUrl(String value) {
        if (value == null || value.isBlank() || value.length() > 2000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Liên kết Google Maps không hợp lệ.");
        }
        try {
            URI uri = new URI(value.trim());
            String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase(Locale.ROOT);
            String path = uri.getPath() == null ? "" : uri.getPath();
            boolean secure = "https".equalsIgnoreCase(uri.getScheme())
                    && uri.getUserInfo() == null
                    && uri.getPort() == -1;
            boolean googleMapsLink = (host.equals("google.com") || host.equals("www.google.com"))
                    && path.startsWith("/maps");
            boolean mapsSubdomain = host.equals("maps.google.com");
            boolean shortGoogleMapsLink = host.equals("maps.app.goo.gl") && !path.equals("/");
            boolean legacyGoogleMapsLink = host.equals("goo.gl") && path.startsWith("/maps");
            if (!secure || !(googleMapsLink || mapsSubdomain || shortGoogleMapsLink || legacyGoogleMapsLink)) {
                throw new URISyntaxException(value, "URL is not a trusted Google Maps link");
            }
            return uri.toASCIIString();
        } catch (URISyntaxException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ hỗ trợ liên kết Google Maps an toàn (HTTPS).", exception);
        }
    }
}
