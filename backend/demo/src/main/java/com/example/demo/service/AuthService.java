package com.example.demo.service;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.AuthResponse;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.RegisterRequest;
import com.example.demo.dto.UserSummary;
import com.example.demo.model.UserAccount;
import com.example.demo.model.UserRole;
import com.example.demo.repository.UserAccountRepository;
import com.example.demo.security.JwtService;

import static org.springframework.http.HttpStatus.CONFLICT;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserAccountRepository userAccountRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userAccountRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(CONFLICT, "Email này đã được đăng ký.");
        }
        UserAccount user = userAccountRepository.save(new UserAccount(
                request.fullName().trim(),
                email,
                passwordEncoder.encode(request.password()),
                request.phone() == null || request.phone().isBlank() ? null : request.phone().trim(),
                UserRole.MEMBER));
        return response(user);
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
}
