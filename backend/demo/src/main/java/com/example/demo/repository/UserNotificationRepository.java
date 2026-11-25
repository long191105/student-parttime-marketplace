package com.example.demo.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.model.UserNotification;

public interface UserNotificationRepository extends JpaRepository<UserNotification, Long> {

    List<UserNotification> findTop100ByRecipientIdOrderByCreatedAtDesc(Long recipientId);

    long countByRecipientIdAndReadAtIsNull(Long recipientId);

    Optional<UserNotification> findByIdAndRecipientId(Long id, Long recipientId);

    @Modifying
    @Query("""
            update UserNotification notification
            set notification.readAt = :readAt
            where notification.recipient.id = :recipientId
              and notification.readAt is null
            """)
    int markUnreadAsReadByRecipient(
            @Param("recipientId") Long recipientId,
            @Param("readAt") Instant readAt);
}
