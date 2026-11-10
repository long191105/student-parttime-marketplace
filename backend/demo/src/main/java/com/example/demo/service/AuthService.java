package com.example.demo.service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.AuthResponse;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.MessageResponse;
import com.example.demo.dto.RegisterRequest;
import com.example.demo.dto.UserSummary;
import com.example.demo.dto.VerifyRegistrationRequest;
import com.example.demo.model.PendingRegistration;
import com.example.demo.model.UserAccount;
import com.example.demo.model.UserRole;
import com.example.demo.repository.PendingRegistrationRepository;
import com.example.demo.repository.UserAccountRepository;
import com.example.demo.security.JwtService;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.TOO_MANY_REQUESTS;

import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private static final SecureRandom OTP_RANDOM = new SecureRandom();

    private final UserAccountRepository userAccountRepository;
    private final PendingRegistrationRepository pendingRegistrationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final OtpEmailService otpEmailService;
    private final long expirationMinutes;
    private final long resendCooldownSeconds;
    private final int maxAttempts;

    public AuthService(
            UserAccountRepository userAccountRepository,
            PendingRegistrationRepository pendingRegistrationRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            OtpEmailService otpEmailService,
            @Value("${app.otp.expiration-minutes:10}") long expirationMinutes,
            @Value("${app.otp.resend-cooldown-seconds:60}") long resendCooldownSeconds,
            @Value("${app.otp.max-attempts:5}") int maxAttempts) {
        this.userAccountRepository = userAccountRepository;
        this.pendingRegistrationRepository = pendingRegistrationRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.otpEmailService = otpEmailService;
        this.expirationMinutes = expirationMinutes;
        this.resendCooldownSeconds = resendCooldownSeconds;
        this.maxAttempts = maxAttempts;
    }

    @Transactional
    public MessageResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (!email.endsWith("@gmail.com")) {
            throw new ResponseStatusException(BAD_REQUEST, "Chỉ chấp nhận địa chỉ email @gmail.com.");
        }
        if (userAccountRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(CONFLICT, "Email này đã được đăng ký.");
        }

        Instant now = Instant.now();
        PendingRegistration pending = pendingRegistrationRepository.findByEmailIgnoreCase(email).orElse(null);
        if (pending != null && !canResend(pending, now)) {
            throw resendCooldownException(pending, now);
        }

        String code = generateOtp();
        String passwordHash = passwordEncoder.encode(request.password());
        String otpHash = passwordEncoder.encode(code);
        Instant expiresAt = now.plus(Duration.ofMinutes(expirationMinutes));
        String phone = normalizePhone(request.phone());
        if (pending == null) {
            pending = new PendingRegistration(
                    email, request.fullName().trim(), passwordHash, phone, otpHash, expiresAt, now);
        } else {
            pending.renew(request.fullName().trim(), passwordHash, phone, otpHash, expiresAt, now);
        }

        pendingRegistrationRepository.save(pending);
        otpEmailService.sendVerificationCode(email, code);
        return new MessageResponse("Mã xác minh đã được gửi đến email của bạn.");
    }

    @Transactional(noRollbackFor = ResponseStatusException.class)
    public AuthResponse verifyRegistration(VerifyRegistrationRequest request) {
        String email = normalizeEmail(request.email());
        PendingRegistration pending = pendingRegistrationRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Không tìm thấy yêu cầu đăng ký. Hãy đăng ký lại."));
        Instant now = Instant.now();
        if (pending.getFailedAttempts() >= maxAttempts) {
            throw new ResponseStatusException(TOO_MANY_REQUESTS, "Bạn đã nhập sai quá số lần cho phép. Hãy đăng ký lại.");
        }
        if (!pending.getExpiresAt().isAfter(now)) {
            throw new ResponseStatusException(BAD_REQUEST, "Mã xác minh đã hết hạn. Hãy gửi lại mã.");
        }
        if (!passwordEncoder.matches(request.otp(), pending.getOtpHash())) {
            pending.recordFailedAttempt();
            pendingRegistrationRepository.save(pending);
            throw new ResponseStatusException(BAD_REQUEST, "Mã xác minh không chính xác.");
        }

        UserAccount user = userAccountRepository.save(new UserAccount(
                pending.getFullName(),
                pending.getEmail(),
                pending.getPasswordHash(),
                pending.getPhone(),
                UserRole.MEMBER));
        pendingRegistrationRepository.delete(pending);
        return response(user);
    }

    @Transactional
    public MessageResponse resendRegistrationCode(String requestedEmail) {
        String email = normalizeEmail(requestedEmail);
        PendingRegistration pending = pendingRegistrationRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Không tìm thấy yêu cầu đăng ký. Hãy đăng ký lại."));
        Instant now = Instant.now();
        if (!canResend(pending, now)) {
            throw resendCooldownException(pending, now);
        }

        String code = generateOtp();
        pending.renew(
                pending.getFullName(),
                pending.getPasswordHash(),
                pending.getPhone(),
                passwordEncoder.encode(code),
                now.plus(Duration.ofMinutes(expirationMinutes)),
                now);
        pendingRegistrationRepository.save(pending);
        otpEmailService.sendVerificationCode(email, code);
        return new MessageResponse("Mã xác minh mới đã được gửi đến email của bạn.");
    }

    @Scheduled(fixedDelayString = "${app.otp.cleanup-interval-ms:3600000}")
    @Transactional
    public void deleteExpiredRegistrations() {
        pendingRegistrationRepository.deleteByExpiresAtBefore(Instant.now());
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        UserAccount user = userAccountRepository.findByEmailIgnoreCase(request.email().trim())
                .filter(account -> passwordEncoder.matches(request.password(), account.getPassword()))
                .filter(UserAccount::isEnabled)
                .orElseThrow(() -> new BadCredentialsException("Email hoặc mật khẩu không chính xác."));
        return response(user);
    }

    @Transactional(readOnly = true)
    public UserSummary currentUser(UserAccount user) {
        return UserSummary.from(user);
    }

    private AuthResponse response(UserAccount user) {
        return new AuthResponse(jwtService.issueToken(user), "Bearer", jwtService.getExpirationSeconds(), UserSummary.from(user));
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static String normalizePhone(String phone) {
        return phone == null || phone.isBlank() ? null : phone.trim();
    }

    private static String generateOtp() {
        return String.format(Locale.ROOT, "%06d", OTP_RANDOM.nextInt(1_000_000));
    }

    private boolean canResend(PendingRegistration pending, Instant now) {
        return !pending.getLastSentAt().plusSeconds(resendCooldownSeconds).isAfter(now);
    }

    private ResponseStatusException resendCooldownException(PendingRegistration pending, Instant now) {
        long secondsRemaining = Math.max(1,
                Duration.between(now, pending.getLastSentAt().plusSeconds(resendCooldownSeconds)).toSeconds());
        return new ResponseStatusException(
                TOO_MANY_REQUESTS,
                "Vui lòng đợi " + secondsRemaining + " giây trước khi gửi mã mới.");
    }
}
