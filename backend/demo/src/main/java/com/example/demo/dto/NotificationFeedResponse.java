package com.example.demo.dto;

import java.util.List;

public record NotificationFeedResponse(List<UserNotificationResponse> notifications, long unreadCount) {
}
