package com.example.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.model.UserFollow;

public interface UserFollowRepository extends JpaRepository<UserFollow, Long> {

    long countByFollowedId(Long followedId);

    boolean existsByFollowerIdAndFollowedId(Long followerId, Long followedId);

    void deleteByFollowerIdAndFollowedId(Long followerId, Long followedId);
}
