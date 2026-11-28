package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.model.ChatConversation;

public interface ChatConversationRepository extends JpaRepository<ChatConversation, Long> {

    List<ChatConversation> findByBuyerIdOrSellerIdOrderByUpdatedAtDesc(Long buyerId, Long sellerId);

    List<ChatConversation> findAllByListingId(Long listingId);

    Optional<ChatConversation> findByListingIdAndBuyerId(Long listingId, Long buyerId);

    @Query("""
            select count(conversation) > 0
            from ChatConversation conversation
            where ((conversation.buyer.id = :firstUserId and conversation.seller.id = :secondUserId)
                or (conversation.buyer.id = :secondUserId and conversation.seller.id = :firstUserId))
              and conversation.saleConfirmedAt is not null
            """)
    boolean existsCompletedTransactionBetweenUsers(
            @Param("firstUserId") Long firstUserId,
            @Param("secondUserId") Long secondUserId);
}
