package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.model.ChatConversation;

public interface ChatConversationRepository extends JpaRepository<ChatConversation, Long> {

    List<ChatConversation> findByBuyerIdOrSellerIdOrderByUpdatedAtDesc(Long buyerId, Long sellerId);

    Optional<ChatConversation> findByListingIdAndBuyerId(Long listingId, Long buyerId);
}
