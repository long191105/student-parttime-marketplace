package com.example.demo.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.junit.jupiter.api.Test;

class CallIceServerServiceTest {

    @Test
    void fallsBackToStunWhenTurnIsNotConfigured() {
        CallIceServerService service = new CallIceServerService("", "", 3600);

        assertEquals(
                List.of(Map.of("urls", "stun:stun.l.google.com:19302")),
                service.getIceServers(42L));
    }

    @Test
    void returnsStunAndShortLivedTurnCredentialsForUser() throws Exception {
        String secret = "coturn-shared-secret";
        CallIceServerService service = new CallIceServerService(
                "turn:turn.example.com:3478?transport=udp, turns:turn.example.com:5349?transport=tcp",
                secret,
                3600);

        List<Map<String, Object>> servers = service.getIceServers(42L);

        assertEquals(Map.of("urls", "stun:stun.l.google.com:19302"), servers.getFirst());
        Map<String, Object> turnServer = servers.get(1);
        assertEquals(List.of(
                "turn:turn.example.com:3478?transport=udp",
                "turns:turn.example.com:5349?transport=tcp"), turnServer.get("urls"));
        String username = (String) turnServer.get("username");
        assertTrue(username.matches("\\d+:42"));
        Mac mac = Mac.getInstance("HmacSHA1");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA1"));
        assertEquals(
                Base64.getEncoder().encodeToString(mac.doFinal(username.getBytes(StandardCharsets.UTF_8))),
                turnServer.get("credential"));
    }

    @Test
    void rejectsTurnUrlsWithoutSharedSecret() {
        assertThrows(IllegalArgumentException.class, () -> new CallIceServerService(
                "turn:turn.example.com:3478",
                "",
                3600));
    }
}
