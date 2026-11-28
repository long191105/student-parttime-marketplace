package com.example.demo.repository;

import java.time.Instant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.model.UserReport;
import com.example.demo.model.UserReportStatus;

import jakarta.persistence.LockModeType;

public interface UserReportRepository extends JpaRepository<UserReport, Long> {

    @Query("""
            select count(report) > 0
            from UserReport report
            where report.reporter.id = :reporterId
              and report.reportedUser.id = :reportedUserId
              and report.sourceType = :sourceType
              and report.status = :status
              and ((:postId is null and report.post is null) or report.post.id = :postId)
              and ((:chatRoomId is null and report.chatRoom is null) or report.chatRoom.id = :chatRoomId)
            """)
    boolean existsPendingDuplicate(
            @Param("reporterId") Long reporterId,
            @Param("reportedUserId") Long reportedUserId,
            @Param("sourceType") com.example.demo.model.UserReportSourceType sourceType,
            @Param("postId") Long postId,
            @Param("chatRoomId") Long chatRoomId,
            @Param("status") UserReportStatus status);

    long countByReporter_IdAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
            Long reporterId, Instant start, Instant end);

    long countByStatusAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
            UserReportStatus status, Instant start, Instant end);

    long countByStatus(UserReportStatus status);

    Page<UserReport> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<UserReport> findAllByStatusOrderByCreatedAtDesc(UserReportStatus status, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select report from UserReport report where report.id = :id")
    java.util.Optional<UserReport> findByIdForUpdate(@Param("id") Long id);

    @Query("""
            select count(distinct report.reporter.id)
            from UserReport report
            where report.reportedUser.id = :reportedUserId
              and report.status = :status
            """)
    long countDistinctPendingReporters(
            @Param("reportedUserId") Long reportedUserId,
            @Param("status") UserReportStatus status);
}
