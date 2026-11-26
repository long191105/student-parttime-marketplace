package com.example.demo.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.dto.UserProfileResponse;
import com.example.demo.model.UserAccount;
import com.example.demo.model.UserFollow;
import com.example.demo.model.UserRole;
import com.example.demo.repository.UserAccountRepository;
import com.example.demo.repository.UserFollowRepository;

@ExtendWith(MockitoExtension.class)
class UserProfileServiceTest {

    @Mock
    private UserAccountRepository userAccountRepository;

    @Mock
    private UserFollowRepository userFollowRepository;

    @Mock
    private CurrentUserService currentUserService;

    private UserProfileService service;
    private UserAccount follower;
    private UserAccount profileUser;

    @BeforeEach
    void setUp() {
        service = new UserProfileService(userAccountRepository, userFollowRepository, currentUserService);
        follower = user("Follower", 7L);
        profileUser = user("Profile", 8L);
    }

    @Test
    void publicProfileReturnsActualFollowerCountWithoutFollowingStatusForGuest() {
        when(userAccountRepository.findById(8L)).thenReturn(Optional.of(profileUser));
        when(userFollowRepository.countByFollowedId(8L)).thenReturn(12L);

        UserProfileResponse response = service.getProfile(8L, null);

        assertEquals(12L, response.followerCount());
        assertFalse(response.following());
        assertFalse(response.currentUser());
    }

    @Test
    void followingAnotherUserCreatesFollowAndReturnsUpdatedCount() {
        when(currentUserService.requireUser()).thenReturn(follower);
        when(userAccountRepository.findById(8L)).thenReturn(Optional.of(profileUser));
        when(userFollowRepository.existsByFollowerIdAndFollowedId(7L, 8L)).thenReturn(false, true);
        when(userFollowRepository.countByFollowedId(8L)).thenReturn(1L);

        UserProfileResponse response = service.follow(8L);

        verify(userFollowRepository).save(any(UserFollow.class));
        assertEquals(1L, response.followerCount());
        assertTrue(response.following());
    }

    @Test
    void ownProfileIsMarkedSoTheFollowControlCanBeHidden() {
        when(userAccountRepository.findById(7L)).thenReturn(Optional.of(follower));
        when(userFollowRepository.countByFollowedId(7L)).thenReturn(3L);

        UserProfileResponse response = service.getProfile(7L, follower);

        assertTrue(response.currentUser());
        assertFalse(response.following());
        assertEquals(3L, response.followerCount());
    }

    @Test
    void followingOwnProfileIsRejected() {
        when(currentUserService.requireUser()).thenReturn(follower);
        when(userAccountRepository.findById(7L)).thenReturn(Optional.of(follower));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.follow(7L));

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        verify(userFollowRepository, never()).save(any(UserFollow.class));
    }

    private static UserAccount user(String name, long id) {
        UserAccount user = new UserAccount(name, name.toLowerCase() + "@example.com", "hashed", null, UserRole.MEMBER);
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }
}
