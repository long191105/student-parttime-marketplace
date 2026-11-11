package com.example.demo.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.AuthResponse;
import com.example.demo.dto.EmailRequest;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.MessageResponse;
import com.example.demo.dto.RegisterRequest;
import com.example.demo.dto.UserSummary;
import com.example.demo.dto.VerifyRegistrationRequest;
import com.example.demo.model.UserAccount;
import com.example.demo.service.AuthService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public MessageResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/register/verify")
    public AuthResponse verifyRegistration(@Valid @RequestBody VerifyRegistrationRequest request) {
        return authService.verifyRegistration(request);
    }

    @PostMapping("/register/resend")
    public MessageResponse resendRegistrationCode(@Valid @RequestBody EmailRequest request) {
        return authService.resendRegistrationCode(request.email());
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public UserSummary currentUser(@AuthenticationPrincipal UserAccount user) {
        return authService.currentUser(user);
    }
}
