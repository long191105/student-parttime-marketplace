package com.example.demo.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.dto.UserProfileResponse;
import com.example.demo.model.UserAccount;
import com.example.demo.model.UserFollow;
import com.example.demo.repository.UserAccountRepository;
import com.example.demo.repository.UserFollowRepository;

@Service
public class UserProfileService {

    private final UserAccountRepository userAccountRepository;
    private final UserFollowRepository userFollowRepository;
    private final CurrentUserService currentUserService;

    public UserProfileService(
            UserAccountRepository userAccountRepository,
            UserFollowRepository userFollowRepository,
            CurrentUserService currentUserService) {
        this.userAccountRepository = userAccountRepository;
        this.userFollowRepository = userFollowRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(Long userId, UserAccount currentUser) {
        UserAccount profileUser = findUser(userId);
        return toResponse(profileUser, currentUser);
    }

    @Transactional
    public UserProfileResponse follow(Long userId) {
        UserAccount follower = currentUserService.requireUser();
        UserAccount followed = findUser(userId);
        if (follower.getId().equals(followed.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn không thể theo dõi chính mình.");
        }
        if (!userFollowRepository.existsByFollowerIdAndFollowedId(follower.getId(), followed.getId())) {
            userFollowRepository.save(new UserFollow(follower, followed));
        }
        return toResponse(followed, follower);
    }

    @Transactional
    public UserProfileResponse unfollow(Long userId) {
        UserAccount follower = currentUserService.requireUser();
        UserAccount followed = findUser(userId);
        userFollowRepository.deleteByFollowerIdAndFollowedId(follower.getId(), followed.getId());
        return toResponse(followed, follower);
    }

    private UserAccount findUser(Long userId) {
        return userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ người dùng."));
    }

    private UserProfileResponse toResponse(UserAccount profileUser, UserAccount currentUser) {
        boolean isCurrentUser = currentUser != null && currentUser.getId().equals(profileUser.getId());
        boolean following = currentUser != null && !isCurrentUser
                && userFollowRepository.existsByFollowerIdAndFollowedId(currentUser.getId(), profileUser.getId());
        return new UserProfileResponse(
                profileUser.getId(),
                profileUser.getFullName(),
                userFollowRepository.countByFollowedId(profileUser.getId()),
                following,
                isCurrentUser);
    }
}
