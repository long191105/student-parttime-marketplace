package com.example.demo.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.dto.AuthResponse;
import com.example.demo.dto.RegisterRequest;
import com.example.demo.dto.VerifyRegistrationRequest;
import com.example.demo.model.PendingRegistration;
import com.example.demo.model.UserAccount;
import com.example.demo.repository.PendingRegistrationRepository;
import com.example.demo.repository.UserAccountRepository;
import com.example.demo.security.JwtService;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserAccountRepository userAccountRepository;

    @Mock
    private PendingRegistrationRepository pendingRegistrationRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private OtpEmailService otpEmailService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userAccountRepository,
                pendingRegistrationRepository,
                passwordEncoder,
                jwtService,
                otpEmailService,
                10,
                60,
                5);
    }

    @Test
    void registrationRejectsNonGmailAddresses() {
        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> authService.register(new RegisterRequest("Test User", "person@example.com", "password123", null)));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        verifyNoInteractions(userAccountRepository, pendingRegistrationRepository, otpEmailService);
    }

    @Test
    void registrationStoresPendingAccountAndEmailsOtpWithoutCreatingUser() {
        when(userAccountRepository.existsByEmailIgnoreCase("person@gmail.com")).thenReturn(false);
        when(pendingRegistrationRepository.findByEmailIgnoreCase("person@gmail.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenAnswer(invocation -> "hashed:" + invocation.getArgument(0));
        when(pendingRegistrationRepository.save(any(PendingRegistration.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        authService.register(new RegisterRequest(" Test User ", "Person@Gmail.com", "password123", "0912345678"));

        ArgumentCaptor<PendingRegistration> pendingCaptor = ArgumentCaptor.forClass(PendingRegistration.class);
        verify(pendingRegistrationRepository).save(pendingCaptor.capture());
        PendingRegistration pending = pendingCaptor.getValue();
        assertEquals("person@gmail.com", pending.getEmail());
        assertEquals("Test User", pending.getFullName());
        assertEquals("hashed:password123", pending.getPasswordHash());
        assertEquals(0, pending.getFailedAttempts());
        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        verify(otpEmailService).sendVerificationCode(org.mockito.ArgumentMatchers.eq("person@gmail.com"), otpCaptor.capture());
        assertEquals(6, otpCaptor.getValue().length());
        verify(userAccountRepository, never()).save(any(UserAccount.class));
    }

    @Test
    void validOtpCreatesUserAndRemovesPendingRegistration() {
        PendingRegistration pending = new PendingRegistration(
                "person@gmail.com",
                "Test User",
                "hashed-password",
                null,
                "hashed-otp",
                Instant.now().plusSeconds(600),
                Instant.now());
        UserAccount user = new UserAccount("Test User", "person@gmail.com", "hashed-password", null,
                com.example.demo.model.UserRole.MEMBER);
        when(pendingRegistrationRepository.findByEmailIgnoreCase("person@gmail.com")).thenReturn(Optional.of(pending));
        when(passwordEncoder.matches("123456", "hashed-otp")).thenReturn(true);
        when(userAccountRepository.save(any(UserAccount.class))).thenReturn(user);
        when(jwtService.issueToken(user)).thenReturn("jwt");
        when(jwtService.getExpirationSeconds()).thenReturn(3600L);

        AuthResponse response = authService.verifyRegistration(
                new VerifyRegistrationRequest("Person@gmail.com", "123456"));

        assertEquals("jwt", response.accessToken());
        assertEquals("person@gmail.com", response.user().email());
        verify(pendingRegistrationRepository).delete(pending);
    }

    @Test
    void invalidOtpIncrementsAttemptCounter() {
        PendingRegistration pending = new PendingRegistration(
                "person@gmail.com",
                "Test User",
                "hashed-password",
                null,
                "hashed-otp",
                Instant.now().plusSeconds(600),
                Instant.now());
        when(pendingRegistrationRepository.findByEmailIgnoreCase("person@gmail.com")).thenReturn(Optional.of(pending));
        when(passwordEncoder.matches("123456", "hashed-otp")).thenReturn(false);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> authService.verifyRegistration(new VerifyRegistrationRequest("person@gmail.com", "123456")));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        assertEquals(1, pending.getFailedAttempts());
        verify(pendingRegistrationRepository).save(pending);
        verify(userAccountRepository, never()).save(any(UserAccount.class));
    }
}
