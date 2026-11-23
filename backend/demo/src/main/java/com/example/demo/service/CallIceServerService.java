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

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class CallIceServerService {

    private static final String STUN_URL = "stun:stun.l.google.com:19302";
    private static final String HMAC_ALGORITHM = "HmacSHA1";

    private final List<String> turnUrls;
    private final String turnSharedSecret;
    private final String turnUsername;
    private final String turnCredential;
    private final long credentialTtlSeconds;
    private static final String METERED_RELAY_DOMAIN = "global.relay.metered.ca";

    @Autowired
    public CallIceServerService(
            @Value("${app.rtc.turn.urls:}") String configuredTurnUrls,
            @Value("${app.rtc.turn.shared-secret:}") String turnSharedSecret,
            @Value("${app.rtc.turn.credential-ttl-seconds:3600}") long credentialTtlSeconds,
            @Value("${app.rtc.turn.username:}") String turnUsername,
            @Value("${app.rtc.turn.credential:}") String turnCredential,
            @Value("${app.rtc.turn.domain:}") String meteredDomain) {
        String effectiveTurnUrls = configuredTurnUrls;
        if (effectiveTurnUrls.isBlank() && !meteredDomain.isBlank()) {
            effectiveTurnUrls = String.join(",",
                    "turn:" + METERED_RELAY_DOMAIN + ":80",
                    "turn:" + METERED_RELAY_DOMAIN + ":80?transport=tcp",
                    "turn:" + METERED_RELAY_DOMAIN + ":443",
                    "turns:" + METERED_RELAY_DOMAIN + ":443?transport=tcp");
        }
        this.turnUrls = Arrays.stream(effectiveTurnUrls.split(","))
                .map(String::trim)
                .filter(url -> !url.isEmpty())
                .toList();
        this.turnSharedSecret = turnSharedSecret;
        this.turnUsername = turnUsername;
        this.turnCredential = turnCredential;
        this.credentialTtlSeconds = credentialTtlSeconds;

        if (this.turnUrls.stream().anyMatch(url -> !url.startsWith("turn:") && !url.startsWith("turns:"))) {
            throw new IllegalArgumentException("TURN_URLS must contain only turn: or turns: URLs.");
        }
        if (!this.turnUrls.isEmpty()) {
            boolean hasStaticCredentials = !turnUsername.isBlank() || !turnCredential.isBlank();
            if (hasStaticCredentials && (turnUsername.isBlank() || turnCredential.isBlank())) {
                throw new IllegalArgumentException("TURN_USERNAME and TURN_CREDENTIAL must both be configured.");
            }
            if (!hasStaticCredentials && turnSharedSecret.isBlank()) {
                throw new IllegalArgumentException("Configure TURN_SHARED_SECRET or TURN_USERNAME and TURN_CREDENTIAL when TURN_URLS is set.");
            }
        }
        if (credentialTtlSeconds < 1) {
            throw new IllegalArgumentException("TURN_CREDENTIAL_TTL_SECONDS must be greater than zero.");
        }
    }

    public CallIceServerService(String configuredTurnUrls, String turnSharedSecret, long credentialTtlSeconds) {
        this(configuredTurnUrls, turnSharedSecret, credentialTtlSeconds, "", "", "");
    }

    public CallIceServerService(
            String configuredTurnUrls,
            String turnSharedSecret,
            long credentialTtlSeconds,
            String turnUsername,
            String turnCredential) {
        this(configuredTurnUrls, turnSharedSecret, credentialTtlSeconds, turnUsername, turnCredential, "");
    }

    public List<Map<String, Object>> getIceServers(long userId) {
        List<Map<String, Object>> iceServers = new ArrayList<>();
        iceServers.add(Map.of("urls", STUN_URL));

        if (!turnUrls.isEmpty()) {
            if (!turnUsername.isBlank() && !turnCredential.isBlank()) {
                iceServers.add(Map.of(
                        "urls", turnUrls,
                        "username", turnUsername,
                        "credential", turnCredential));
                return iceServers;
            }
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
