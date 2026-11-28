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
import com.example.demo.model.UserReport;
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

    @Transactional
    public void notifyReportRejected(UserReport report, String reason) {
        notificationRepository.save(new UserNotification(
                report.getReporter(),
                UserNotificationType.REPORT_STATUS,
                "Báo cáo vi phạm đã bị từ chối",
                "Báo cáo #" + report.getId() + " về " + report.getReportedUser().getFullName()
                        + " đã bị từ chối. Lý do: " + reason,
                report.getId().toString()));
    }

    @Transactional
    public void notifyReportAccepted(UserReport report) {
        notificationRepository.save(new UserNotification(
                report.getReporter(),
                UserNotificationType.REPORT_STATUS,
                "Báo cáo vi phạm đã được tiếp nhận",
                "Báo cáo #" + report.getId() + " về " + report.getReportedUser().getFullName()
                        + " đã được tiếp nhận và đang được xem xét. Chúng tôi sẽ thông báo khi có kết quả.",
                report.getId().toString()));
    }

    @Transactional
    public void notifyInvestigationStarted(UserReport report) {
        notificationRepository.save(new UserNotification(
                report.getReporter(),
                UserNotificationType.REPORT_STATUS,
                "Báo cáo vi phạm đang được điều tra",
                "Báo cáo #" + report.getId() + " đã được xác nhận để điều tra. Tài khoản bị báo cáo "
                        + "đã được tạm khóa trong thời gian điều tra.",
                report.getId().toString()));
        notificationRepository.save(new UserNotification(
                report.getReportedUser(),
                UserNotificationType.ACCOUNT_STATUS,
                "Tài khoản tạm thời bị khóa để điều tra",
                "Chúng tôi đang điều tra báo cáo vi phạm liên quan đến tài khoản của bạn. Thời gian điều tra "
                        + "dự kiến tối đa 24 giờ; tài khoản sẽ tiếp tục bị hạn chế cho đến khi quản trị viên "
                        + "thông báo kết quả. Trong thời gian này, bạn chỉ có thể xem nội dung công khai và "
                        + "thông báo, không thể đăng tin hoặc sử dụng chat.",
                report.getId().toString()));
    }

    @Transactional
    public void notifyInvestigationResolved(UserReport report, boolean permanentlyLocked) {
        String result = permanentlyLocked
                ? "Kết quả điều tra xác nhận tài khoản đã vi phạm. Tài khoản của bạn bị khóa vĩnh viễn."
                : "Kết quả điều tra đã có: bạn không có vi phạm. Chúng tôi sẽ mở khóa tài khoản của bạn.";
        String reporterDetail = permanentlyLocked
                ? "Báo cáo #" + report.getId() + " đã được xử lý. Kết quả điều tra xác nhận có vi phạm "
                        + "và tài khoản đã bị khóa vĩnh viễn."
                : "Báo cáo #" + report.getId() + " đã được xử lý. Kết quả điều tra không xác nhận vi phạm "
                        + "và tài khoản đã được mở khóa.";
        notificationRepository.save(new UserNotification(
                report.getReportedUser(),
                UserNotificationType.ACCOUNT_STATUS,
                permanentlyLocked ? "Tài khoản bị khóa vĩnh viễn" : "Tài khoản đã được mở khóa",
                result + (permanentlyLocked
                        ? " Bạn vẫn có thể xem nội dung công khai và thông báo."
                        : ""),
                report.getId().toString()));
        notificationRepository.save(new UserNotification(
                report.getReporter(),
                UserNotificationType.REPORT_STATUS,
                "Báo cáo vi phạm đã có kết quả",
                reporterDetail,
                report.getId().toString()));
    }
}
