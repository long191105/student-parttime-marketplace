package com.example.demo.service;

import java.time.Instant;
import java.util.List;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.dto.NotificationFeedResponse;
import com.example.demo.dto.UserNotificationResponse;
import com.example.demo.model.ChatConversation;
import com.example.demo.model.Listing;
import com.example.demo.model.ListingStatus;
import com.example.demo.model.UserAccount;
import com.example.demo.model.UserNotification;
import com.example.demo.model.UserNotificationType;
import com.example.demo.repository.UserNotificationRepository;

@Service
public class UserNotificationService {

    private static final int MESSAGE_PREVIEW_LENGTH = 240;

    private final UserNotificationRepository notificationRepository;
    private final CurrentUserService currentUserService;
    private final ApplicationEventPublisher eventPublisher;

    public UserNotificationService(
            UserNotificationRepository notificationRepository,
            CurrentUserService currentUserService,
            ApplicationEventPublisher eventPublisher) {
        this.notificationRepository = notificationRepository;
        this.currentUserService = currentUserService;
        this.eventPublisher = eventPublisher;
    }

    @Transactional(readOnly = true)
    public NotificationFeedResponse listForCurrentUser() {
        UserAccount recipient = currentUserService.requireUser();
        List<UserNotificationResponse> notifications = notificationRepository
                .findTop100ByRecipientIdOrderByCreatedAtDesc(recipient.getId())
                .stream()
                .map(UserNotificationResponse::from)
                .toList();
        return new NotificationFeedResponse(
                notifications,
                notificationRepository.countByRecipientIdAndReadAtIsNull(recipient.getId()));
    }

    @Transactional
    public void markRead(Long id) {
        UserAccount recipient = currentUserService.requireUser();
        UserNotification notification = notificationRepository.findByIdAndRecipientId(id, recipient.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy thông báo."));
        notification.markRead(Instant.now());
    }

    @Transactional
    public void markAllRead() {
        UserAccount recipient = currentUserService.requireUser();
        notificationRepository.markUnreadAsReadByRecipient(recipient.getId(), Instant.now());
    }

    @Transactional
    public void notifyListingStatus(
            UserAccount recipient,
            Listing listing,
            ListingStatus status,
            String reason) {
        UserNotificationType type;
        String title;
        String detail;
        if (status == ListingStatus.ACTIVE) {
            type = UserNotificationType.LISTING_APPROVED;
            title = "Tin đăng đã được duyệt";
            detail = "Tin “" + listing.getTitle() + "” hiện đã hiển thị trên Chợ Hời.";
        } else if (status == ListingStatus.REJECTED) {
            type = UserNotificationType.LISTING_REJECTED;
            title = "Tin đăng chưa được duyệt";
            detail = "Tin “" + listing.getTitle() + "” đã bị từ chối."
                    + (reason == null || reason.isBlank() ? "" : " Lý do: " + reason.trim());
        } else {
            throw new IllegalArgumentException("Only moderation outcomes can create listing notifications.");
        }
        notificationRepository.save(new UserNotification(recipient, type, title, detail, listing.getId().toString()));
        eventPublisher.publishEvent(new ListingModerationEmailEvent(
                listing.getId(),
                recipient.getEmail(),
                recipient.getFullName(),
                listing.getTitle(),
                status,
                reason));
    }

    @Transactional
    public void notifyNewMessage(
            UserAccount recipient,
            ChatConversation conversation,
            UserAccount sender,
            String content) {
        String detail = content.length() <= MESSAGE_PREVIEW_LENGTH
                ? content
                : content.substring(0, MESSAGE_PREVIEW_LENGTH) + "…";
        notificationRepository.save(new UserNotification(
                recipient,
                UserNotificationType.NEW_MESSAGE,
                "Tin nhắn mới từ " + sender.getFullName(),
                detail,
                conversation.getId().toString()));
    }
}
