package com.example.demo.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.demo.model.UserAccount;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {
	private final SecretKey signingKey;
	private final long expirationMs;

	public JwtService(
			@Value("${app.jwt.secret}") String secret,
			@Value("${app.jwt.expiration-ms}") long expirationMs) {
		if (secret.getBytes(StandardCharsets.UTF_8).length < 32) {
			throw new IllegalArgumentException("JWT secret must be at least 32 bytes");
		}
		this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
		this.expirationMs = expirationMs;
	}

	public String createToken(UserAccount user) {
		Date issuedAt = new Date();
		return Jwts.builder()
				.subject(user.getEmail())
				.claim("role", user.getRole().name())
				.issuedAt(issuedAt)
				.expiration(new Date(issuedAt.getTime() + expirationMs))
				.signWith(signingKey)
				.compact();
	}

	public Claims parseToken(String token) {
		return Jwts.parser().verifyWith(signingKey).build().parseSignedClaims(token).getPayload();
	}
}