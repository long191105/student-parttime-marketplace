package com.example.demo.service;

import java.net.URI;

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

    @Transactional
    public UserProfileResponse updateAvatar(Long userId, String avatarUrl) {
        UserAccount currentUser = currentUserService.requireUser();
        if (!currentUser.getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn chỉ có thể thay đổi ảnh đại diện của mình.");
        }
        if (!isSecureImageUrl(avatarUrl)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đường dẫn ảnh đại diện phải là URL HTTPS hợp lệ.");
        }

        UserAccount profileUser = findUser(userId);
        profileUser.setAvatarUrl(avatarUrl);
        userAccountRepository.save(profileUser);
        return toResponse(profileUser, currentUser);
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
                profileUser.getAvatarUrl(),
                userFollowRepository.countByFollowedId(profileUser.getId()),
                following,
                isCurrentUser);
    }

    private static boolean isSecureImageUrl(String value) {
        if (value == null || value.length() > 2048) return false;
        try {
            URI uri = URI.create(value);
            return "https".equalsIgnoreCase(uri.getScheme())
                    && uri.getHost() != null
                    && uri.getRawUserInfo() == null;
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }
}
