package com.example.demo.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.dto.UserProfileResponse;
import com.example.demo.model.UserAccount;
import com.example.demo.service.UserProfileService;

@RestController
@RequestMapping("/api/users")
public class UserProfileController {

    private final UserProfileService userProfileService;

    public UserProfileController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    @GetMapping("/{id}/profile")
    public UserProfileResponse profile(
            @PathVariable String id,
            @AuthenticationPrincipal UserAccount currentUser) {
        return userProfileService.getProfile(parseId(id), currentUser);
    }

    @PutMapping("/{id}/follow")
    public UserProfileResponse follow(@PathVariable String id) {
        return userProfileService.follow(parseId(id));
    }

    @DeleteMapping("/{id}/follow")
    public UserProfileResponse unfollow(@PathVariable String id) {
        return userProfileService.unfollow(parseId(id));
    }

    private static Long parseId(String value) {
        try {
            long id = Long.parseLong(value);
            if (id < 1) throw new NumberFormatException("ID must be positive");
            return id;
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã người dùng không hợp lệ.", exception);
        }
    }
}
