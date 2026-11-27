package com.example.demo.security;

import java.io.IOException;
import java.net.URI;
import java.security.GeneralSecurityException;
import java.util.List;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

import static org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE;

@Component
public class GoogleIdentityTokenVerifier {

    private final String clientId;
    private final GsonFactory jsonFactory;
    private final GoogleIdTokenVerifier verifier;

    public GoogleIdentityTokenVerifier(@Value("${app.google.client-id:}") String clientId) {
        this.clientId = clientId.trim();
        this.jsonFactory = GsonFactory.getDefaultInstance();
        this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), jsonFactory)
                .setAudience(this.clientId.isBlank() ? List.of() : List.of(this.clientId))
                .build();
    }

    public GoogleIdentity verify(String credential) {
        if (clientId.isBlank() || credential == null || credential.isBlank()) {
            throw invalidCredentials();
        }

        GoogleIdToken token;
        try {
            token = GoogleIdToken.parse(jsonFactory, credential);
        } catch (IOException exception) {
            throw new BadCredentialsException("Thông tin xác thực Google không hợp lệ.", exception);
        }
        try {
            if (token == null || !verifier.verify(token)) {
                throw invalidCredentials();
            }
            GoogleIdToken.Payload payload = token.getPayload();
            String email = payload.getEmail();
            String issuer = payload.getIssuer();
            if (!payload.getEmailVerified()
                    || payload.getSubject() == null
                    || payload.getSubject().isBlank()
                    || (!"accounts.google.com".equals(issuer)
                            && !"https://accounts.google.com".equals(issuer))
                    || email == null || email.isBlank() || email.length() > 254
                    || email.lastIndexOf('@') <= 0 || email.lastIndexOf('@') == email.length() - 1
                    || payload.getSubject().length() > 255) {
                throw invalidCredentials();
            }
            String name = stringClaim(payload, "name");
            return new GoogleIdentity(
                    payload.getSubject(),
                    email.trim().toLowerCase(Locale.ROOT),
                    name == null ? null : name.substring(0, Math.min(name.length(), 120)),
                    safeAvatarUrl(stringClaim(payload, "picture")));
        } catch (IOException exception) {
            throw new ResponseStatusException(
                    SERVICE_UNAVAILABLE, "Tạm thời không thể xác minh tài khoản Google. Vui lòng thử lại.", exception);
        } catch (GeneralSecurityException exception) {
            throw new BadCredentialsException("Thông tin xác thực Google không hợp lệ.", exception);
        }
    }

    private static BadCredentialsException invalidCredentials() {
        return new BadCredentialsException("Thông tin xác thực Google không hợp lệ.");
    }

    private static String stringClaim(GoogleIdToken.Payload payload, String claim) {
        Object value = payload.get(claim);
        return value instanceof String text && !text.isBlank() ? text.trim() : null;
    }

    private static String safeAvatarUrl(String value) {
        if (value == null || value.length() > 2048) return null;
        try {
            URI uri = URI.create(value);
            return "https".equalsIgnoreCase(uri.getScheme())
                    && uri.getHost() != null
                    && uri.getRawUserInfo() == null
                    ? value
                    : null;
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }
}
