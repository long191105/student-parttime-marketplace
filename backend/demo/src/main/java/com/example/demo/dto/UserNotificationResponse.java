package com.example.demo.dto;

import java.time.Instant;

import com.example.demo.model.UserNotification;

public record UserNotificationResponse(
        Long id,
        String type,
        String title,
        String detail,
        String targetId,
        Instant createdAt,
        boolean read) {

    public static UserNotificationResponse from(UserNotification notification) {
        return new UserNotificationResponse(
                notification.getId(),
                notification.getType().name(),
                notification.getTitle(),
                notification.getDetail(),
                notification.getTargetId(),
                notification.getCreatedAt(),
                notification.getReadAt() != null);
    }
}
