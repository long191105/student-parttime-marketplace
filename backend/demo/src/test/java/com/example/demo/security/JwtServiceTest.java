package com.example.demo.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

import com.example.demo.model.UserAccount;
import com.example.demo.model.UserRole;

import io.jsonwebtoken.JwtException;

class JwtServiceTest {

    @Test
    void issuesTokenForTheAccountAndRejectsAnotherSubject() {
        JwtService jwtService = new JwtService("local-test-secret-with-at-least-32-bytes", false, 60_000);
        UserAccount user = new UserAccount("Nguyen Long", "long@example.com", "hashed", null, UserRole.MEMBER);

        String token = jwtService.issueToken(user);

        assertEquals(user.getEmail(), jwtService.extractSubject(token));
        assertTrue(jwtService.isValid(token, user.getEmail()));
        assertFalse(jwtService.isValid(token, "someone-else@example.com"));
    }

    @Test
    void refusesShortSigningSecrets() {
        assertThrows(IllegalArgumentException.class, () -> new JwtService("too-short", false, 60_000));
    }

    @Test
    void rejectsTamperedTokens() {
        JwtService jwtService = new JwtService("local-test-secret-with-at-least-32-bytes", false, 60_000);
        String token = jwtService.issueToken(new UserAccount("Nguyen Long", "long@example.com", "hashed", null, UserRole.MEMBER));

        assertThrows(JwtException.class, () -> jwtService.extractSubject(token + "tampered"));
    }
}
