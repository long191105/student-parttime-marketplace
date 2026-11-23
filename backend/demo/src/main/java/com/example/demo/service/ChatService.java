package com.example.demo.service;

import java.net.URI;
import java.net.URISyntaxException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.dto.ChatConversationResponse;
import com.example.demo.dto.ChatMessageResponse;
import com.example.demo.dto.ChatReviewRequest;
import com.example.demo.dto.ChatReviewResponse;
import com.example.demo.dto.ChatReviewStatusResponse;
import com.example.demo.model.ChatConversation;
import com.example.demo.model.ChatMessage;
import com.example.demo.model.ChatMessageType;
import com.example.demo.model.ChatReview;
import com.example.demo.model.Listing;
import com.example.demo.model.ListingStatus;
import com.example.demo.model.UserAccount;
import com.example.demo.repository.ChatConversationRepository;
import com.example.demo.repository.ChatMessageRepository;
import com.example.demo.repository.ChatReviewRepository;
import com.example.demo.repository.ListingRepository;
import com.example.demo.repository.UserAccountRepository;

@Service
public class ChatService {

    private final ChatConversationRepository conversationRepository;
    private final ChatMessageRepository messageRepository;
    private final ChatReviewRepository reviewRepository;
    private final ListingRepository listingRepository;
    private final UserAccountRepository userAccountRepository;
    private final CurrentUserService currentUserService;

    public ChatService(
            ChatConversationRepository conversationRepository,
            ChatMessageRepository messageRepository,
            ChatReviewRepository reviewRepository,
            ListingRepository listingRepository,
            UserAccountRepository userAccountRepository,
            CurrentUserService currentUserService) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.reviewRepository = reviewRepository;
        this.listingRepository = listingRepository;
        this.userAccountRepository = userAccountRepository;
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
    public ChatConversationResponse confirmSale(Long conversationId) {
        UserAccount seller = currentUserService.requireUser();
        ChatConversation conversation = requireParticipant(conversationId, seller);
        if (!conversation.getSeller().getId().equals(seller.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ người đăng tin mới có thể xác nhận đã bán.");
        }
        Listing listing = listingRepository.findByIdForUpdate(conversation.getListing().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tin đăng."));
        if (!listing.getSeller().getId().equals(seller.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không phải người đăng tin này.");
        }
        if (conversation.getSaleConfirmedAt() != null || listing.getStatus() != ListingStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tin đăng đã được bán hoặc không còn hiển thị.");
        }
        listing.changeStatus(ListingStatus.SOLD, null);
        conversation.confirmSale();
        return toResponse(conversation, seller);
    }

    @Transactional(readOnly = true)
    public ChatReviewStatusResponse getReviewStatus(Long conversationId) {
        UserAccount reviewer = currentUserService.requireUser();
        ChatConversation conversation = requireParticipant(conversationId, reviewer);
        return toReviewStatus(conversation, reviewer);
    }

    @Transactional(readOnly = true)
    public List<ChatReviewResponse> getPublishedReviewsForUser(Long userId) {
        Instant unlockAt = Instant.now().minus(Duration.ofHours(48));
        return reviewRepository.findByRevieweeIdOrderByCreatedAtDesc(userId).stream()
                .filter(review -> !review.getCreatedAt().isAfter(unlockAt)
                        || reviewRepository.countByConversationId(review.getConversation().getId()) == 2)
                .map(ChatReviewResponse::from)
                .toList();
    }

    @Transactional
    public ChatReviewStatusResponse submitReview(Long conversationId, ChatReviewRequest request) {
        UserAccount reviewer = currentUserService.requireUser();
        ChatConversation conversation = requireParticipant(conversationId, reviewer);
        if (conversation.getSaleConfirmedAt() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Chỉ có thể đánh giá sau khi người bán xác nhận đã bán trong cuộc trò chuyện này.");
        }
        if (reviewRepository.findByConversationIdAndReviewerId(conversationId, reviewer.getId()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã gửi đánh giá cho giao dịch này.");
        }

        boolean isSeller = conversation.getSeller().getId().equals(reviewer.getId());
        int rating = request.rating();
        List<String> tags = request.tags() == null ? List.of() : new ArrayList<>(request.tags());
        List<String> images = request.images() == null ? List.of() : new ArrayList<>(request.images());
        String comment = request.comment() == null ? "" : request.comment().trim();
        validateReview(isSeller, rating, comment, tags, images);
        UserAccount reviewee = isSeller ? conversation.getBuyer() : conversation.getSeller();
        reviewRepository.save(new ChatReview(
                conversation,
                reviewer,
                reviewee,
                rating,
                comment,
                tags,
                images));
        return toReviewStatus(conversation, reviewer);
    }

    private ChatReviewStatusResponse toReviewStatus(ChatConversation conversation, UserAccount reviewer) {
        boolean eligible = conversation.getSaleConfirmedAt() != null;
        List<ChatReview> reviews = eligible
                ? reviewRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId())
                : List.of();
        ChatReview ownReview = reviews.stream()
                .filter(review -> review.getReviewer().getId().equals(reviewer.getId()))
                .findFirst()
                .orElse(null);
        boolean publishAll = reviews.size() == 2;
        Instant unlockAt = Instant.now().minus(Duration.ofHours(48));
        List<ChatReviewResponse> publishedReviews = reviews.stream()
                .filter(review -> publishAll || !review.getCreatedAt().isAfter(unlockAt))
                .map(ChatReviewResponse::from)
                .toList();
        return new ChatReviewStatusResponse(
                eligible,
                ownReview != null,
                ownReview == null ? null : ChatReviewResponse.from(ownReview),
                publishedReviews);
    }

    private static void validateReview(boolean isSeller, int rating, String comment, List<String> tags, List<String> images) {
        if (rating < 1 || rating > 5 || comment.length() > 500 || tags.size() > 3 || images.size() > 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nội dung đánh giá không hợp lệ.");
        }
        if (new HashSet<>(tags).size() != tags.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không thể chọn thẻ đánh giá trùng lặp.");
        }
        if (tags.stream().anyMatch(tag -> tag == null || tag.isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thẻ đánh giá không hợp lệ.");
        }
        Set<String> allowedTags;
        if (isSeller) {
            if (!images.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Người bán không thể đính kèm ảnh trong đánh giá người mua.");
            }
            allowedTags = rating < 3
                    ? Set.of("Bom hàng/Bùng kèo", "Trả giá quá đáng")
                    : Set.of("Mua nhanh gọn", "Lịch sự thiện chí", "Đến đúng hẹn");
        } else {
            allowedTags = rating < 3
                    ? Set.of("Hàng lỗi không báo trước", "Sai mô tả", "Hẹn không tới")
                    : Set.of("Mô tả đúng thực tế", "Giao hàng/Hẹn đúng giờ", "Nhiệt tình thân thiện", "Giá hợp lý");
        }
        if (!allowedTags.containsAll(tags)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thẻ đánh giá không phù hợp với vai trò hoặc số sao.");
        }
        if (images.stream().anyMatch(image -> image == null || !image.matches("(?i)^https://[^\\s]+$"))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ảnh đánh giá phải là liên kết HTTPS hợp lệ.");
        }
    }

    @Transactional
    public ChatMessageResponse recordMissedCall(Long conversationId, String callType) {
        return recordCallStatusMessage(conversationId, callType, "busy");
    }

    @Transactional
    public ChatMessageResponse recordCallStatusMessage(Long conversationId, String callType, String outcome) {
        return recordCallStatusMessage(conversationId, callType, outcome, null);
    }

    @Transactional
    public ChatMessageResponse recordCallStatusMessage(
            Long conversationId,
            String callType,
            String outcome,
            Long callInitiatorId) {
        UserAccount actor = currentUserService.requireUser();
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
        ChatConversation conversation = requireParticipant(conversationId, actor);
        UserAccount sender = resolveCallInitiator(conversation, actor, callInitiatorId);
        ChatMessage message = messageRepository.save(new ChatMessage(
                conversation,
                sender,
                content,
                ChatMessageType.MISSED_CALL,
                null,
                null,
                null));
        conversation.touch();
        conversationRepository.save(conversation);
        return ChatMessageResponse.from(message);
    }

    @Transactional
    public ChatMessageResponse recordCompletedCall(Long conversationId, String callType, long durationSeconds) {
        return recordCompletedCall(conversationId, callType, durationSeconds, null);
    }

    @Transactional
    public ChatMessageResponse recordCompletedCall(
            Long conversationId,
            String callType,
            long durationSeconds,
            Long callInitiatorId) {
        UserAccount actor = currentUserService.requireUser();
        if (!"audio".equals(callType) && !"video".equals(callType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Loại cuộc gọi không hợp lệ.");
        }
        if (durationSeconds < 0 || durationSeconds > 86_400) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thời lượng cuộc gọi không hợp lệ.");
        }
        ChatConversation conversation = requireParticipant(conversationId, actor);
        UserAccount sender = resolveCallInitiator(conversation, actor, callInitiatorId);
        String callLabel = "video".equals(callType) ? "video" : "thoại";
        String content = "Cuộc gọi " + callLabel + " đã kết thúc"
                + (durationSeconds == 0 ? "" : " • " + formatCallDuration(durationSeconds));
        ChatMessage message = messageRepository.save(new ChatMessage(
                conversation,
                sender,
                content,
                ChatMessageType.CALL,
                null,
                null,
                null));
        conversation.touch();
        conversationRepository.save(conversation);
        return ChatMessageResponse.from(message);
    }

    private UserAccount resolveCallInitiator(
            ChatConversation conversation,
            UserAccount actor,
            Long callInitiatorId) {
        if (callInitiatorId == null) {
            return actor;
        }
        if (conversation.getBuyer().getId().equals(callInitiatorId)) {
            return conversation.getBuyer();
        }
        if (conversation.getSeller().getId().equals(callInitiatorId)) {
            return conversation.getSeller();
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Người gọi không thuộc cuộc trò chuyện.");
    }

    @Transactional(readOnly = true)
    public Set<Long> getParticipantIds(Long conversationId) {
        ChatConversation conversation = requireParticipant(conversationId, currentUserService.requireUser());
        return Set.of(conversation.getBuyer().getId(), conversation.getSeller().getId());
    }

    @Transactional(readOnly = true)
    public Set<Long> getConversationPeerIds(Long userId) {
        return conversationRepository.findByBuyerIdOrSellerIdOrderByUpdatedAtDesc(userId, userId)
                .stream()
                .map(conversation -> conversation.getBuyer().getId().equals(userId)
                        ? conversation.getSeller().getId()
                        : conversation.getBuyer().getId())
                .collect(Collectors.toSet());
    }

    @Transactional(readOnly = true)
    public Map<Long, Instant> getLastActiveAt(Set<Long> userIds) {
        Map<Long, Instant> lastActiveAt = new HashMap<>();
        userAccountRepository.findAllById(userIds)
                .forEach(user -> lastActiveAt.put(user.getId(), user.getLastActiveAt()));
        return lastActiveAt;
    }

    @Transactional
    public void updateLastActiveAt(Long userId, Instant lastActiveAt) {
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("Cannot update activity for a missing user."));
        user.setLastActiveAt(lastActiveAt);
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
                participant.getId().toString(),
                participant.getFullName(),
                initials(participant.getFullName()),
                lastMessage,
                conversation.getUpdatedAt(),
                unreadCount,
                conversation.getSeller().getId().equals(currentUser.getId()),
                conversation.getSaleConfirmedAt() != null,
                listing.getStatus() == ListingStatus.SOLD);
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
