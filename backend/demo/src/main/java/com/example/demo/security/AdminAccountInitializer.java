package com.example.demo.security;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.example.demo.model.UserAccount;
import com.example.demo.model.UserRole;
import com.example.demo.repository.UserAccountRepository;

@Component
public class AdminAccountInitializer implements ApplicationRunner {
	private final UserAccountRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final String adminEmail;
	private final String adminPassword;

	public AdminAccountInitializer(
			UserAccountRepository userRepository,
			PasswordEncoder passwordEncoder,
			@Value("${app.admin.email}") String adminEmail,
			@Value("${app.admin.password}") String adminPassword) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.adminEmail = adminEmail;
		this.adminPassword = adminPassword;
	}

	@Override
	public void run(ApplicationArguments arguments) {
		boolean emailProvided = !adminEmail.isBlank();
		boolean passwordProvided = !adminPassword.isBlank();
		if (!emailProvided && !passwordProvided) {
			return;
		}
		if (!emailProvided || !passwordProvided) {
			throw new IllegalStateException("Set both ADMIN_EMAIL and ADMIN_PASSWORD to initialize an admin account");
		}
		int passwordBytes = adminPassword.getBytes(StandardCharsets.UTF_8).length;
		if (passwordBytes < 8 || passwordBytes > 72) {
			throw new IllegalStateException("ADMIN_PASSWORD must be between 8 and 72 UTF-8 bytes");
		}

		String normalizedEmail = adminEmail.trim().toLowerCase(Locale.ROOT);
		userRepository.findByEmailIgnoreCase(normalizedEmail).ifPresentOrElse(existing -> {
			if (existing.getRole() != UserRole.ADMIN) {
				throw new IllegalStateException("ADMIN_EMAIL is already used by a non-admin account");
			}
		}, () -> userRepository.save(new UserAccount(
				"Administrator",
			normalizedEmail,
			passwordEncoder.encode(adminPassword),
			UserRole.ADMIN)));
	}
}