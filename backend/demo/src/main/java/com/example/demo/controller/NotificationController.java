package com.example.demo.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.NotificationFeedResponse;
import com.example.demo.service.UserNotificationService;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final UserNotificationService notificationService;

    public NotificationController(UserNotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public NotificationFeedResponse list() {
        return notificationService.listForCurrentUser();
    }

    @PatchMapping("/{id}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markRead(@PathVariable Long id) {
        notificationService.markRead(id);
    }

    @PatchMapping("/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAllRead() {
        notificationService.markAllRead();
    }
}
