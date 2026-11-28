package com.example.demo.service;

import java.net.URI;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.model.AccountStatus;
import com.example.demo.model.ChatConversation;
import com.example.demo.model.Listing;
import com.example.demo.model.ListingStatus;
import com.example.demo.model.UserAccount;
import com.example.demo.model.UserReport;
import com.example.demo.model.UserReportReason;
import com.example.demo.model.UserReportSourceType;
import com.example.demo.model.UserReportStatus;
import com.example.demo.dto.AdminUserReportResponse;
import com.example.demo.repository.ChatConversationRepository;
import com.example.demo.repository.ChatMessageRepository;
import com.example.demo.repository.ListingReportRepository;
import com.example.demo.repository.ListingRepository;
import com.example.demo.repository.UserAccountRepository;
import com.example.demo.repository.UserReportRepository;

@Service
public class UserReportService {

    private static final ZoneId MARKETPLACE_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final int DAILY_REPORT_LIMIT = 5;

    private final UserReportRepository reportRepository;
    private final UserAccountRepository userAccountRepository;
    private final ListingRepository listingRepository;
    private final ListingReportRepository listingReportRepository;
    private final ChatConversationRepository conversationRepository;
    private final ChatMessageRepository messageRepository;
    private final CurrentUserService currentUserService;

    public UserReportService(
            UserReportRepository reportRepository,
            UserAccountRepository userAccountRepository,
            ListingRepository listingRepository,
            ListingReportRepository listingReportRepository,
            ChatConversationRepository conversationRepository,
            ChatMessageRepository messageRepository,
            CurrentUserService currentUserService) {
        this.reportRepository = reportRepository;
        this.userAccountRepository = userAccountRepository;
        this.listingRepository = listingRepository;
        this.listingReportRepository = listingReportRepository;
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional
    public UserReport submit(
            Long reportedUserId,
            UserReportSourceType sourceType,
            Long postId,
            Long chatRoomId,
            String reasonValue,
            String description,
            List<String> evidenceUrls) {
        UserAccount authenticatedReporter = currentUserService.requireUser();
        if (reportedUserId == null || reportedUserId < 1 || sourceType == null) {
            throw badRequest("Thông tin người dùng hoặc nguồn báo cáo không hợp lệ.");
        }
        if (authenticatedReporter.getId().equals(reportedUserId)) {
            throw badRequest("Bạn không thể báo cáo chính mình.");
        }

        UserReportReason reason = parseReason(reasonValue);
        String normalizedDescription = description == null ? "" : description.trim();
        if (normalizedDescription.length() < 20 || normalizedDescription.length() > 500) {
            throw badRequest("Mô tả báo cáo phải có từ 20 đến 500 ký tự.");
        }
        List<String> normalizedEvidence = validateEvidence(evidenceUrls);
        if (reason == UserReportReason.SCAM && normalizedEvidence.isEmpty()) {
            throw badRequest("Vui lòng đính kèm ít nhất một ảnh bằng chứng cho báo cáo lừa đảo.");
        }

        Map<Long, UserAccount> lockedAccounts = new java.util.HashMap<>();
        for (Long accountId : new TreeSet<>(List.of(authenticatedReporter.getId(), reportedUserId))) {
            UserAccount account = userAccountRepository.findByIdForUpdate(accountId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng."));
            lockedAccounts.put(accountId, account);
        }
        UserAccount reporter = lockedAccounts.get(authenticatedReporter.getId());
        UserAccount reportedUser = lockedAccounts.get(reportedUserId);
        if (reporter.getStatus() != AccountStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản của bạn không ở trạng thái hoạt động.");
        }

        Instant now = Instant.now();
        LocalDate today = now.atZone(MARKETPLACE_ZONE).toLocalDate();
        Instant startOfDay = today.atStartOfDay(MARKETPLACE_ZONE).toInstant();
        Instant startOfTomorrow = today.plusDays(1).atStartOfDay(MARKETPLACE_ZONE).toInstant();
        long reportsToday = reportRepository.countByReporter_IdAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                reporter.getId(), startOfDay, startOfTomorrow)
                + listingReportRepository.countByReporter_IdAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                        reporter.getId(), startOfDay, startOfTomorrow);
        if (reportsToday >= DAILY_REPORT_LIMIT) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Bạn chỉ có thể gửi tối đa 5 báo cáo mỗi ngày.");
        }

        Listing post = null;
        ChatConversation chatRoom = null;
        switch (sourceType) {
            case PROFILE -> {
                if (postId != null || chatRoomId != null) {
                    throw badRequest("Báo cáo hồ sơ không được chứa mã tin đăng hoặc cuộc trò chuyện.");
                }
            }
            case POST -> {
                if (postId == null || chatRoomId != null) {
                    throw badRequest("Báo cáo tin đăng cần có mã tin hợp lệ.");
                }
                post = listingRepository.findById(postId)
                        .filter(listing -> listing.getStatus() == ListingStatus.ACTIVE)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tin đăng đang hiển thị."));
                if (post.getSeller() == null || !post.getSeller().getId().equals(reportedUserId)) {
                    throw badRequest("Tin đăng không thuộc về người dùng được báo cáo.");
                }
            }
            case CHAT -> {
                if (chatRoomId == null || postId != null) {
                    throw badRequest("Báo cáo cuộc trò chuyện cần có mã phòng chat hợp lệ.");
                }
                chatRoom = conversationRepository.findById(chatRoomId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy cuộc trò chuyện."));
                boolean reporterIsParticipant = chatRoom.getBuyer().getId().equals(reporter.getId())
                        || chatRoom.getSeller().getId().equals(reporter.getId());
                boolean targetIsParticipant = chatRoom.getBuyer().getId().equals(reportedUserId)
                        || chatRoom.getSeller().getId().equals(reportedUserId);
                if (!reporterIsParticipant || !targetIsParticipant) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn chỉ có thể báo cáo người tham gia cuộc trò chuyện này.");
                }
                requireChatOrTransactionHistory(reporter.getId(), reportedUserId, chatRoomId);
            }
        }

        if (reason == UserReportReason.SCAM
                && sourceType != UserReportSourceType.CHAT
                && !hasInteractionHistory(reporter.getId(), reportedUserId)) {
            throw badRequest("Chỉ có thể báo cáo lừa đảo khi đã có tin nhắn hoặc giao dịch với người dùng này.");
        }

        if (reportRepository.existsPendingDuplicate(
                reporter.getId(), reportedUserId, sourceType, postId, chatRoomId, UserReportStatus.PENDING)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã gửi báo cáo đang chờ xử lý cho nội dung này.");
        }

        UserReport report = reportRepository.save(new UserReport(
                reporter, reportedUser, sourceType, post, chatRoom, reason, normalizedDescription, normalizedEvidence));
        if (reportRepository.countDistinctPendingReporters(reportedUserId, UserReportStatus.PENDING) >= 3) {
            reportedUser.setFlagged(true);
            userAccountRepository.save(reportedUser);
        }
        return report;
    }

    @Transactional(readOnly = true)
    public Page<AdminUserReportResponse> searchAdmin(UserReportStatus status, int page, int size) {
        validatePaging(page, size);
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<UserReport> reports = status == null
                ? reportRepository.findAllByOrderByCreatedAtDesc(pageable)
                : reportRepository.findAllByStatusOrderByCreatedAtDesc(status, pageable);
        return reports.map(AdminUserReportResponse::from);
    }

    @Transactional
    public AdminUserReportResponse updateAdminStatus(Long reportId, UserReportStatus status) {
        if (status == null || status == UserReportStatus.PENDING) {
            throw badRequest("Trạng thái xử lý báo cáo không hợp lệ.");
        }
        UserReport report = reportRepository.findByIdForUpdate(reportId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy báo cáo."));
        if (report.getStatus() == UserReportStatus.RESOLVED || report.getStatus() == UserReportStatus.REJECTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Báo cáo này đã được xử lý.");
        }
        report.setStatus(status);
        UserReport updatedReport = reportRepository.save(report);
        UserAccount reportedUser = report.getReportedUser();
        reportedUser.setFlagged(reportRepository.countDistinctPendingReporters(
                reportedUser.getId(), UserReportStatus.PENDING) >= 3);
        userAccountRepository.save(reportedUser);
        return AdminUserReportResponse.from(updatedReport);
    }

    private void requireChatOrTransactionHistory(Long reporterId, Long reportedUserId, Long chatRoomId) {
        if (messageRepository.countByConversationId(chatRoomId) == 0
                && !conversationRepository.existsCompletedTransactionBetweenUsers(reporterId, reportedUserId)) {
            throw badRequest("Cần có tin nhắn hoặc giao dịch trong cuộc trò chuyện trước khi gửi báo cáo.");
        }
    }

    private boolean hasInteractionHistory(Long firstUserId, Long secondUserId) {
        return messageRepository.existsMessageBetweenUsers(firstUserId, secondUserId)
                || conversationRepository.existsCompletedTransactionBetweenUsers(firstUserId, secondUserId);
    }

    private static UserReportReason parseReason(String value) {
        if (value == null || value.isBlank()) {
            throw badRequest("Vui lòng chọn lý do báo cáo.");
        }
        try {
            return UserReportReason.valueOf(value.trim());
        } catch (IllegalArgumentException exception) {
            throw badRequest("Lý do báo cáo không hợp lệ.");
        }
    }

    private static List<String> validateEvidence(List<String> evidenceUrls) {
        if (evidenceUrls == null || evidenceUrls.isEmpty()) return List.of();
        if (evidenceUrls.size() > 3) {
            throw badRequest("Bạn chỉ có thể đính kèm tối đa 3 ảnh bằng chứng.");
        }
        List<String> validated = new ArrayList<>();
        for (String value : evidenceUrls) {
            if (value == null || value.length() > 2048) {
                throw badRequest("Đường dẫn ảnh bằng chứng không hợp lệ.");
            }
            try {
                URI uri = URI.create(value);
                if (!"https".equalsIgnoreCase(uri.getScheme())
                        || !"res.cloudinary.com".equalsIgnoreCase(uri.getHost())
                        || uri.getRawUserInfo() != null) {
                    throw badRequest("Ảnh bằng chứng phải là URL HTTPS hợp lệ từ Cloudinary.");
                }
            } catch (IllegalArgumentException exception) {
                throw badRequest("Đường dẫn ảnh bằng chứng không hợp lệ.");
            }
            validated.add(value);
        }
        return List.copyOf(validated);
    }

    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private static void validatePaging(int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw badRequest("Phân trang không hợp lệ (size tối đa 100).");
        }
    }
}
