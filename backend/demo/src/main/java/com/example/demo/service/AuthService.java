package com.example.demo.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.dto.AuthResponse;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.RegisterRequest;
import com.example.demo.dto.UserSummary;
import com.example.demo.model.UserAccount;
import com.example.demo.model.UserRole;
import com.example.demo.repository.UserAccountRepository;
import com.example.demo.security.JwtService;

@Service
public class AuthService {
	private final UserAccountRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;
	private final AuthenticationManager authenticationManager;

	public AuthService(
			UserAccountRepository userRepository,
			PasswordEncoder passwordEncoder,
			JwtService jwtService,
			AuthenticationManager authenticationManager) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
		this.authenticationManager = authenticationManager;
	}

	@Transactional
	public AuthResponse register(RegisterRequest request) {
		if (request.role() == UserRole.ADMIN) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Không thể đăng ký tài khoản quản trị");
		}

		String email = request.email().trim().toLowerCase();
		if (userRepository.existsByEmailIgnoreCase(email)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Email đã được sử dụng");
		}

		UserAccount user = userRepository.save(new UserAccount(
				request.fullName().trim(),
				email,
				passwordEncoder.encode(request.password()),
				request.role()));
		return createAuthResponse(user);
	}

	@Transactional(readOnly = true)
	public AuthResponse login(LoginRequest request) {
		String email = request.email().trim();
		try {
			authenticationManager.authenticate(
					new UsernamePasswordAuthenticationToken(email, request.password()));
		} catch (AuthenticationException exception) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không đúng");
		}

		UserAccount user = userRepository.findByEmailIgnoreCase(email)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không đúng"));
		return createAuthResponse(user);
	}

	@Transactional(readOnly = true)
	public UserSummary getCurrentUser(String email) {
		return userRepository.findByEmailIgnoreCase(email)
				.map(UserSummary::from)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản"));
	}

	private AuthResponse createAuthResponse(UserAccount user) {
		return new AuthResponse(jwtService.createToken(user), "Bearer", UserSummary.from(user));
	}
}