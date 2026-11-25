package com.example.demo.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.dto.AdminReportResponse;
import com.example.demo.model.AccountStatus;
import com.example.demo.model.AdminReportAction;
import com.example.demo.model.Listing;
import com.example.demo.model.ListingReport;
import com.example.demo.model.ListingReportStatus;
import com.example.demo.model.ListingStatus;
import com.example.demo.model.UserAccount;
import com.example.demo.model.UserRole;
import com.example.demo.repository.ListingReportRepository;
import com.example.demo.repository.ListingRepository;

@ExtendWith(MockitoExtension.class)
class ListingReportServiceTest {

    @Mock
    private ListingReportRepository reportRepository;

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private Listing listing;

    @Mock
    private UserAccount reporter;

    @Mock
    private UserAccount seller;

    private ListingReportService service;

    @BeforeEach
    void setUp() {
        service = new ListingReportService(reportRepository, listingRepository, currentUserService);
        lenient().when(currentUserService.requireUser()).thenReturn(reporter);
        lenient().when(reporter.getId()).thenReturn(7L);
        lenient().when(reporter.getFullName()).thenReturn("Reporter");
        lenient().when(listing.getId()).thenReturn(41L);
        lenient().when(listing.getTitle()).thenReturn("Listing");
        lenient().when(listing.getStatus()).thenReturn(ListingStatus.ACTIVE);
        lenient().when(listing.getSeller()).thenReturn(seller);
        lenient().when(seller.getId()).thenReturn(8L);
        lenient().when(seller.getFullName()).thenReturn("Seller");
        lenient().when(seller.getRole()).thenReturn(UserRole.MEMBER);
    }

    @Test
    void submitPersistsTrimmedReasonForActiveListing() {
        when(listingRepository.findById(41L)).thenReturn(Optional.of(listing));
        when(reportRepository.existsByReporterIdAndListingId(7L, 41L)).thenReturn(false);
        when(reportRepository.save(any(ListingReport.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ListingReport saved = service.submit(41L, "  Vi phạm quy định  ");

        assertEquals("Vi phạm quy định", saved.getReason());
        assertEquals(ListingReportStatus.OPEN, saved.getStatus());
        verify(reportRepository).save(any(ListingReport.class));
    }

    @Test
    void submitRejectsDuplicateReports() {
        when(listingRepository.findById(41L)).thenReturn(Optional.of(listing));
        when(reportRepository.existsByReporterIdAndListingId(7L, 41L)).thenReturn(true);

        assertThrows(ResponseStatusException.class, () -> service.submit(41L, "Vi phạm"));

        verify(reportRepository, never()).save(any(ListingReport.class));
    }

    @Test
    void removeListingResolvesReportAndRejectsListing() {
        ListingReport report = openReport();
        when(reportRepository.findById(12L)).thenReturn(Optional.of(report));
        when(reportRepository.save(report)).thenReturn(report);

        AdminReportResponse response = service.process(12L, AdminReportAction.REMOVE_LISTING);

        assertEquals(ListingReportStatus.RESOLVED.name(), response.status());
        verify(listing).changeStatus(ListingStatus.REJECTED, "Tin đã bị gỡ sau khi xử lý báo cáo vi phạm.");
    }

    @Test
    void lockUserResolvesReportAndLocksListingOwner() {
        ListingReport report = openReport();
        when(reportRepository.findById(12L)).thenReturn(Optional.of(report));
        when(reportRepository.save(report)).thenReturn(report);

        AdminReportResponse response = service.process(12L, AdminReportAction.LOCK_USER);

        assertEquals(ListingReportStatus.RESOLVED.name(), response.status());
        verify(seller).setStatus(AccountStatus.LOCKED);
    }

    private ListingReport openReport() {
        ListingReport report = new ListingReport(reporter, listing, "Vi phạm");
        ReflectionTestUtils.setField(report, "id", 12L);
        return report;
    }
}
