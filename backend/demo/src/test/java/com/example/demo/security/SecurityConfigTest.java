package com.example.demo.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

class SecurityConfigTest {

    @Test
    void acceptsBothLocalViteOriginsForDeleteRequests() {
        SecurityConfig securityConfig = new SecurityConfig(
                mock(JwtAuthenticationFilter.class),
                mock(MarketplaceUserDetailsService.class));
        CorsConfigurationSource source = securityConfig
                .corsConfigurationSource("http://localhost:5173,http://127.0.0.1:5173");
        CorsConfiguration configuration = source.getCorsConfiguration(new MockHttpServletRequest());

        assertNotNull(configuration);
        assertEquals("http://127.0.0.1:5173", configuration.checkOrigin("http://127.0.0.1:5173"));
        assertTrue(configuration.getAllowedMethods().contains("DELETE"));
        assertNull(configuration.checkOrigin("http://127.0.0.2:5173"));
    }
}
