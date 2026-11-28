package com.example.demo.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.model.AccountStatus;
import com.example.demo.model.UserAccount;
import com.example.demo.model.UserReport;
import com.example.demo.model.UserReportReason;
import com.example.demo.model.UserReportSourceType;
import com.example.demo.model.UserReportStatus;
import com.example.demo.repository.ChatConversationRepository;
import com.example.demo.repository.ChatMessageRepository;
import com.example.demo.repository.ListingReportRepository;
import com.example.demo.repository.ListingRepository;
import com.example.demo.repository.UserAccountRepository;
import com.example.demo.repository.UserReportRepository;

@ExtendWith(MockitoExtension.class)
class UserReportServiceTest {

    @Mock
    private UserReportRepository reportRepository;

    @Mock
    private UserAccountRepository userAccountRepository;

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private ListingReportRepository listingReportRepository;

    @Mock
    private ChatConversationRepository conversationRepository;

    @Mock
    private ChatMessageRepository messageRepository;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private UserAccount reporter;

    @Mock
    private UserAccount reportedUser;

    private UserReportService service;

    @BeforeEach
    void setUp() {
        service = new UserReportService(
                reportRepository,
                userAccountRepository,
                listingRepository,
                listingReportRepository,
                conversationRepository,
                messageRepository,
                currentUserService);
        lenient().when(currentUserService.requireUser()).thenReturn(reporter);
        when(reporter.getId()).thenReturn(7L);
        lenient().when(reporter.getStatus()).thenReturn(AccountStatus.ACTIVE);
        lenient().when(userAccountRepository.findByIdForUpdate(7L)).thenReturn(Optional.of(reporter));
        lenient().when(userAccountRepository.findByIdForUpdate(8L)).thenReturn(Optional.of(reportedUser));
    }

    @Test
    void submitPersistsProfileReportAndFlagsTargetAfterThreeDistinctPendingReporters() {
        when(reportRepository.countByReporter_IdAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                org.mockito.ArgumentMatchers.eq(7L), any(Instant.class), any(Instant.class))).thenReturn(0L);
        when(reportRepository.existsPendingDuplicate(
                7L, 8L, UserReportSourceType.PROFILE, null, null, UserReportStatus.PENDING)).thenReturn(false);
        when(reportRepository.save(any(UserReport.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(reportRepository.countDistinctPendingReporters(8L, UserReportStatus.PENDING)).thenReturn(3L);

        UserReport result = service.submit(
                8L, UserReportSourceType.PROFILE, null, null, "HARASSMENT",
                "Có lời lẽ xúc phạm và quấy rối tôi qua nhiều lần.", List.of());

        assertEquals(UserReportStatus.PENDING, result.getStatus());
        verify(reportedUser).setFlagged(true);
        verify(userAccountRepository).save(reportedUser);
    }

    @Test
    void submitRejectsLockedReporter() {
        when(reporter.getStatus()).thenReturn(AccountStatus.LOCKED);

        assertThrows(ResponseStatusException.class, () -> service.submit(
                8L, UserReportSourceType.PROFILE, null, null, "SPAM",
                "Tài khoản này liên tục gửi nội dung quảng cáo.", List.of()));

        verify(reportRepository, never()).save(any(UserReport.class));
    }

    @Test
    void submitRejectsScamReportWithoutEvidence() {
        assertThrows(ResponseStatusException.class, () -> service.submit(
                8L, UserReportSourceType.PROFILE, null, null, "SCAM",
                "Người này lừa đảo và yêu cầu chuyển tiền trước.", List.of()));

        verify(userAccountRepository, never()).findByIdForUpdate(any());
        verify(reportRepository, never()).save(any(UserReport.class));
    }

    @Test
    void submitRejectsDuplicatePendingContext() {
        when(reportRepository.countByReporter_IdAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                org.mockito.ArgumentMatchers.eq(7L), any(Instant.class), any(Instant.class))).thenReturn(0L);
        when(reportRepository.existsPendingDuplicate(
                7L, 8L, UserReportSourceType.PROFILE, null, null, UserReportStatus.PENDING)).thenReturn(true);

        assertThrows(ResponseStatusException.class, () -> service.submit(
                8L, UserReportSourceType.PROFILE, null, null, "SPAM",
                "Tài khoản này liên tục gửi nội dung quảng cáo.", List.of()));

        verify(reportRepository, never()).save(any(UserReport.class));
    }

    @Test
    void submitRejectsReportWhenDailyLimitHasBeenReached() {
        when(reportRepository.countByReporter_IdAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                org.mockito.ArgumentMatchers.eq(7L), any(Instant.class), any(Instant.class))).thenReturn(5L);

        assertThrows(ResponseStatusException.class, () -> service.submit(
                8L, UserReportSourceType.PROFILE, null, null, "SPAM",
                "Tài khoản này liên tục gửi nội dung quảng cáo.", List.of()));

        verify(reportRepository, never()).save(any(UserReport.class));
    }

    @Test
    void updateAdminStatusResolvesReportAndRecalculatesFlag() {
        when(reporter.getFullName()).thenReturn("Reporter");
        when(reportedUser.getId()).thenReturn(8L);
        when(reportedUser.getFullName()).thenReturn("Reported user");
        when(reportedUser.isFlagged()).thenReturn(true);
        UserReport report = new UserReport(
                reporter,
                reportedUser,
                UserReportSourceType.PROFILE,
                null,
                null,
                UserReportReason.OTHER,
                "Mô tả chi tiết vi phạm đủ để quản trị viên xem xét.",
                List.of());
        ReflectionTestUtils.setField(report, "id", 12L);
        when(reportRepository.findByIdForUpdate(12L)).thenReturn(Optional.of(report));
        when(reportRepository.save(report)).thenReturn(report);
        when(reportRepository.countDistinctPendingReporters(8L, UserReportStatus.PENDING)).thenReturn(2L);

        var result = service.updateAdminStatus(12L, UserReportStatus.RESOLVED);

        assertEquals("RESOLVED", result.status());
        verify(reportedUser).setFlagged(false);
        verify(userAccountRepository).save(reportedUser);
    }
}
