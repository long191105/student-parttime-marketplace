package com.example.demo.service;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class CallIceServerService {

    private static final String STUN_URL = "stun:stun.l.google.com:19302";
    private static final String HMAC_ALGORITHM = "HmacSHA1";

    private final List<String> turnUrls;
    private final String turnSharedSecret;
    private final long credentialTtlSeconds;

    public CallIceServerService(
            @Value("${app.rtc.turn.urls:}") String configuredTurnUrls,
            @Value("${app.rtc.turn.shared-secret:}") String turnSharedSecret,
            @Value("${app.rtc.turn.credential-ttl-seconds:3600}") long credentialTtlSeconds) {
        this.turnUrls = Arrays.stream(configuredTurnUrls.split(","))
                .map(String::trim)
                .filter(url -> !url.isEmpty())
                .toList();
        this.turnSharedSecret = turnSharedSecret;
        this.credentialTtlSeconds = credentialTtlSeconds;

        if (this.turnUrls.stream().anyMatch(url -> !url.startsWith("turn:") && !url.startsWith("turns:"))) {
            throw new IllegalArgumentException("TURN_URLS must contain only turn: or turns: URLs.");
        }
        if (!this.turnUrls.isEmpty() && turnSharedSecret.isBlank()) {
            throw new IllegalArgumentException("TURN_SHARED_SECRET is required when TURN_URLS is configured.");
        }
        if (credentialTtlSeconds < 1) {
            throw new IllegalArgumentException("TURN_CREDENTIAL_TTL_SECONDS must be greater than zero.");
        }
    }

    public List<Map<String, Object>> getIceServers(long userId) {
        List<Map<String, Object>> iceServers = new ArrayList<>();
        iceServers.add(Map.of("urls", STUN_URL));

        if (!turnUrls.isEmpty()) {
            String username = (Instant.now().getEpochSecond() + credentialTtlSeconds) + ":" + userId;
            iceServers.add(Map.of(
                    "urls", turnUrls,
                    "username", username,
                    "credential", createCredential(username)));
        }
        return iceServers;
    }

    private String createCredential(String username) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(turnSharedSecret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
            return Base64.getEncoder().encodeToString(mac.doFinal(username.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Unable to create TURN credentials.", exception);
        }
    }
}
