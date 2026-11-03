package com.example.demo.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.model.UserAccount;
import com.example.demo.model.UserRole;
import com.example.demo.repository.UserAccountRepository;

@Component
public class AdminAccountInitializer implements ApplicationRunner {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;
    private final String adminPassword;

    public AdminAccountInitializer(
            UserAccountRepository userAccountRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.email:}") String adminEmail,
            @Value("${app.admin.password:}") String adminPassword) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (adminEmail.isBlank() && adminPassword.isBlank()) return;
        if (adminEmail.isBlank() || adminPassword.length() < 12 || adminPassword.length() > 72) {
            throw new IllegalStateException("Set both ADMIN_EMAIL and ADMIN_PASSWORD (12 to 72 characters) to initialize an admin.");
        }
        if (userAccountRepository.existsByEmailIgnoreCase(adminEmail.trim())) return;
        userAccountRepository.save(new UserAccount(
                "Quản trị viên",
                adminEmail.trim().toLowerCase(),
                passwordEncoder.encode(adminPassword),
                null,
                UserRole.ADMIN));
    }
}
