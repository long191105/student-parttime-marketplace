package com.example.demo.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
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
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.dto.AuthResponse;
import com.example.demo.dto.RegisterRequest;
import com.example.demo.dto.VerifyRegistrationRequest;
import com.example.demo.model.PendingRegistration;
import com.example.demo.model.UserAccount;
import com.example.demo.repository.PendingRegistrationRepository;
import com.example.demo.repository.UserAccountRepository;
import com.example.demo.security.GoogleIdentity;
import com.example.demo.security.GoogleIdentityTokenVerifier;
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
    private GoogleIdentityTokenVerifier googleIdentityTokenVerifier;

    @Mock
    private BrevoEmailService emailService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userAccountRepository,
                pendingRegistrationRepository,
                passwordEncoder,
                jwtService,
                googleIdentityTokenVerifier,
                emailService,
                10,
                60,
                5);
    }

    @Test
    void googleLoginLinksAnExistingAccountAndPreservesItsProfileAndPassword() {
        UserAccount user = new UserAccount(
                "Test User", "person@gmail.com", "hashed-password", null,
                com.example.demo.model.UserRole.MEMBER);
        user.setAvatarUrl("https://existing.example/avatar.png");
        when(googleIdentityTokenVerifier.verify("google-id-token"))
                .thenReturn(new GoogleIdentity("google-sub", "person@gmail.com", "Google Name", "https://google.example/avatar.png"));
        when(userAccountRepository.findByGoogleId("google-sub")).thenReturn(Optional.empty());
        when(userAccountRepository.findByEmailIgnoreCase("person@gmail.com")).thenReturn(Optional.of(user));
        when(userAccountRepository.save(user)).thenReturn(user);
        when(jwtService.issueToken(user)).thenReturn("jwt");
        when(jwtService.getExpirationSeconds()).thenReturn(3600L);

        AuthResponse response = authService.loginWithGoogle("google-id-token");

        assertEquals("jwt", response.accessToken());
        assertEquals("person@gmail.com", response.user().email());
        assertEquals("google-sub", user.getGoogleId());
        assertEquals("local", user.getAuthProvider());
        assertEquals("Test User", user.getFullName());
        assertEquals("hashed-password", user.getPassword());
        assertEquals("https://existing.example/avatar.png", user.getAvatarUrl());
        assertTrue(user.isEmailVerified());
        verify(userAccountRepository).save(user);
    }

    @Test
    void googleLoginCreatesAVerifiedGoogleAccountWhenEmailIsNew() {
        GoogleIdentity identity = new GoogleIdentity(
                "google-sub", "newperson@gmail.com", "New Person", "https://google.example/avatar.png");
        PendingRegistration pending = new PendingRegistration(
                "newperson@gmail.com",
                "Pending Person",
                "hashed-password",
                null,
                "hashed-otp",
                Instant.now().plusSeconds(600),
                Instant.now());
        when(googleIdentityTokenVerifier.verify("google-id-token")).thenReturn(identity);
        when(userAccountRepository.findByGoogleId("google-sub")).thenReturn(Optional.empty());
        when(userAccountRepository.findByEmailIgnoreCase("newperson@gmail.com")).thenReturn(Optional.empty());
        when(pendingRegistrationRepository.findByEmailIgnoreCase("newperson@gmail.com"))
                .thenReturn(Optional.of(pending));
        when(userAccountRepository.save(any(UserAccount.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtService.issueToken(any(UserAccount.class))).thenReturn("jwt");
        when(jwtService.getExpirationSeconds()).thenReturn(3600L);

        AuthResponse response = authService.loginWithGoogle("google-id-token");

        ArgumentCaptor<UserAccount> accountCaptor = ArgumentCaptor.forClass(UserAccount.class);
        verify(userAccountRepository).save(accountCaptor.capture());
        UserAccount created = accountCaptor.getValue();
        assertNull(created.getPassword());
        assertEquals("google-sub", created.getGoogleId());
        assertEquals("google", created.getAuthProvider());
        assertTrue(created.isEmailVerified());
        assertEquals("https://google.example/avatar.png", created.getAvatarUrl());
        assertEquals("jwt", response.accessToken());
        verify(pendingRegistrationRepository).delete(pending);
    }

    @Test
    void googleLoginRejectsALockedExistingAccount() {
        UserAccount user = new UserAccount(
                "Test User", "person@gmail.com", "hashed-password", null,
                com.example.demo.model.UserRole.MEMBER);
        user.setStatus(com.example.demo.model.AccountStatus.LOCKED);
        when(googleIdentityTokenVerifier.verify("google-id-token"))
                .thenReturn(new GoogleIdentity("google-sub", "person@gmail.com", "Google Name", null));
        when(userAccountRepository.findByGoogleId("google-sub")).thenReturn(Optional.empty());
        when(userAccountRepository.findByEmailIgnoreCase("person@gmail.com")).thenReturn(Optional.of(user));

        assertThrows(
                org.springframework.security.authentication.BadCredentialsException.class,
                () -> authService.loginWithGoogle("google-id-token"));

        verifyNoInteractions(jwtService);
    }

    @Test
    void googleLoginRejectsLinkingAnEmailAlreadyBoundToAnotherGoogleAccount() {
        UserAccount user = new UserAccount(
                "Test User", "person@gmail.com", "hashed-password", null,
                com.example.demo.model.UserRole.MEMBER);
        user.setGoogleId("different-google-sub");
        when(googleIdentityTokenVerifier.verify("google-id-token"))
                .thenReturn(new GoogleIdentity("google-sub", "person@gmail.com", "Google Name", null));
        when(userAccountRepository.findByGoogleId("google-sub")).thenReturn(Optional.empty());
        when(userAccountRepository.findByEmailIgnoreCase("person@gmail.com")).thenReturn(Optional.of(user));

        assertThrows(
                org.springframework.security.authentication.BadCredentialsException.class,
                () -> authService.loginWithGoogle("google-id-token"));

        verify(userAccountRepository, never()).save(any(UserAccount.class));
        verifyNoInteractions(jwtService);
    }

    @Test
    void passwordLoginRejectsGoogleOnlyAccountWithoutCallingPasswordEncoder() {
        UserAccount user = UserAccount.googleAccount(
                "Google User", "person@gmail.com", "google-sub", null,
                com.example.demo.model.UserRole.MEMBER);
        when(userAccountRepository.findByEmailIgnoreCase("person@gmail.com")).thenReturn(Optional.of(user));

        assertThrows(
                org.springframework.security.authentication.BadCredentialsException.class,
                () -> authService.login(new com.example.demo.dto.LoginRequest("person@gmail.com", "password")));

        verifyNoInteractions(passwordEncoder, jwtService);
    }

    @Test
    void registrationRejectsNonGmailAddresses() {
        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> authService.register(new RegisterRequest("Test User", "person@example.com", "password123", null)));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        verifyNoInteractions(userAccountRepository, pendingRegistrationRepository, emailService);
    }

    @Test
    void registrationRejectsAnEmailThatAlreadyHasAnAccount() {
        when(userAccountRepository.existsByEmailIgnoreCase("person@gmail.com")).thenReturn(true);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> authService.register(new RegisterRequest("Test User", "person@gmail.com", "password123", null)));

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        verifyNoInteractions(pendingRegistrationRepository, passwordEncoder, emailService);
    }

    @Test
    void registrationCannotResendOtpDuringCooldown() {
        Instant now = Instant.now();
        PendingRegistration pending = new PendingRegistration(
                "person@gmail.com",
                "Test User",
                "hashed-password",
                null,
                "hashed-otp",
                now.plusSeconds(600),
                now);
        when(userAccountRepository.existsByEmailIgnoreCase("person@gmail.com")).thenReturn(false);
        when(pendingRegistrationRepository.findByEmailIgnoreCase("person@gmail.com")).thenReturn(Optional.of(pending));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> authService.register(new RegisterRequest("Test User", "person@gmail.com", "password123", null)));

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, exception.getStatusCode());
        verify(pendingRegistrationRepository, never()).save(any(PendingRegistration.class));
        verifyNoInteractions(passwordEncoder, emailService);
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
        verify(emailService).sendVerificationCode(org.mockito.ArgumentMatchers.eq("person@gmail.com"), otpCaptor.capture());
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
    void expiredOtpCannotCreateAnAccount() {
        Instant now = Instant.now();
        PendingRegistration pending = new PendingRegistration(
                "person@gmail.com",
                "Test User",
                "hashed-password",
                null,
                "hashed-otp",
                now.minusSeconds(1),
                now.minusSeconds(601));
        when(pendingRegistrationRepository.findByEmailIgnoreCase("person@gmail.com")).thenReturn(Optional.of(pending));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> authService.verifyRegistration(new VerifyRegistrationRequest("person@gmail.com", "123456")));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        verify(passwordEncoder, never()).matches(anyString(), anyString());
        verify(pendingRegistrationRepository, never()).save(pending);
        verify(userAccountRepository, never()).save(any(UserAccount.class));
    }

    @Test
    void otpVerificationIsBlockedAfterMaximumFailedAttempts() {
        Instant now = Instant.now();
        PendingRegistration pending = new PendingRegistration(
                "person@gmail.com",
                "Test User",
                "hashed-password",
                null,
                "hashed-otp",
                now.plusSeconds(600),
                now.minusSeconds(60));
        ReflectionTestUtils.setField(pending, "failedAttempts", 5);
        when(pendingRegistrationRepository.findByEmailIgnoreCase("person@gmail.com")).thenReturn(Optional.of(pending));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> authService.verifyRegistration(new VerifyRegistrationRequest("person@gmail.com", "123456")));

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, exception.getStatusCode());
        verify(passwordEncoder, never()).matches(anyString(), anyString());
        verify(pendingRegistrationRepository, never()).save(pending);
        verify(userAccountRepository, never()).save(any(UserAccount.class));
    }

    @Test
    void resendAfterCooldownRenewsOtpAndResetsFailedAttempts() {
        Instant lastSentAt = Instant.now().minusSeconds(61);
        PendingRegistration pending = new PendingRegistration(
                "person@gmail.com",
                "Test User",
                "hashed-password",
                null,
                "old-hashed-otp",
                Instant.now().minusSeconds(1),
                lastSentAt);
        ReflectionTestUtils.setField(pending, "failedAttempts", 2);
        when(pendingRegistrationRepository.findByEmailIgnoreCase("person@gmail.com")).thenReturn(Optional.of(pending));
        when(passwordEncoder.encode(anyString())).thenAnswer(invocation -> "hashed:" + invocation.getArgument(0));
        when(pendingRegistrationRepository.save(pending)).thenReturn(pending);

        authService.resendRegistrationCode("Person@gmail.com");

        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendVerificationCode(org.mockito.ArgumentMatchers.eq("person@gmail.com"), otpCaptor.capture());
        assertEquals(6, otpCaptor.getValue().length());
        assertEquals("hashed:" + otpCaptor.getValue(), pending.getOtpHash());
        assertEquals(0, pending.getFailedAttempts());
        assertTrue(pending.getExpiresAt().isAfter(Instant.now()));
        assertTrue(pending.getLastSentAt().isAfter(lastSentAt));
        verify(pendingRegistrationRepository).save(pending);
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
