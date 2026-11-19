package com.example.demo.dto;

import java.time.Instant;

import com.example.demo.model.ChatMessage;

public record ChatMessageResponse(
        String id,
        String conversationId,
        String senderId,
        String senderName,
        String content,
        String messageType,
        Double latitude,
        Double longitude,
        String mapUrl,
        Instant sentAt) {

    public static ChatMessageResponse from(ChatMessage message) {
        return new ChatMessageResponse(
                message.getId().toString(),
                message.getConversation().getId().toString(),
                message.getSender().getId().toString(),
                message.getSender().getFullName(),
                message.getContent(),
                message.getMessageType().name(),
                message.getLatitude(),
                message.getLongitude(),
                message.getMapUrl(),
                message.getSentAt());
    }
}
