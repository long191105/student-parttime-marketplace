package com.example.demo.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.model.ChatMessage;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByConversationIdOrderBySentAtAsc(Long conversationId);

    Optional<ChatMessage> findFirstByConversationIdOrderBySentAtDesc(Long conversationId);

    @Query("""
            select count(message)
            from ChatMessage message
            where message.conversation.id = :conversationId
              and message.sender.id <> :userId
              and message.readAt is null
            """)
    long countUnreadByConversationAndUser(
            @Param("conversationId") Long conversationId,
            @Param("userId") Long userId);

    @Modifying
    @Query("""
            update ChatMessage message
            set message.readAt = :readAt
            where message.conversation.id = :conversationId
              and message.sender.id <> :userId
              and message.readAt is null
            """)
    int markUnreadAsRead(
            @Param("conversationId") Long conversationId,
            @Param("userId") Long userId,
            @Param("readAt") Instant readAt);
}
