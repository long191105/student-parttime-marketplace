package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.model.ChatReview;

public interface ChatReviewRepository extends JpaRepository<ChatReview, Long> {

    List<ChatReview> findByConversationIdOrderByCreatedAtAsc(Long conversationId);

    Optional<ChatReview> findByConversationIdAndReviewerId(Long conversationId, Long reviewerId);

    List<ChatReview> findByRevieweeIdOrderByCreatedAtDesc(Long revieweeId);

    long countByConversationId(Long conversationId);
}
