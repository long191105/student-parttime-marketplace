package com.example.demo.security;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

class JwtAuthenticationFilterTest {

    @Test
    void lockedAccountsCanReadPublicPagesAndNotificationsOnly() {
        assertAllowed("GET", "/api/listings");
        assertAllowed("GET", "/api/listings/42");
        assertAllowed("GET", "/api/categories");
        assertAllowed("GET", "/api/users/12/profile");
        assertAllowed("GET", "/api/auth/me");
        assertAllowed("GET", "/api/notifications");
        assertAllowed("PATCH", "/api/notifications/15/read");
        assertAllowed("PATCH", "/api/notifications/read-all");

        assertDenied("GET", "/api/listings/mine");
        assertDenied("GET", "/api/listings/draft");
        assertDenied("POST", "/api/listings");
        assertDenied("GET", "/api/favorites");
        assertDenied("GET", "/api/chat/conversations");
        assertDenied("PATCH", "/api/notifications/invalid/read");
    }

    private static void assertAllowed(String method, String path) {
        assertTrue(JwtAuthenticationFilter.isAllowedForLockedUser(request(method, path)), method + " " + path);
    }

    private static void assertDenied(String method, String path) {
        assertFalse(JwtAuthenticationFilter.isAllowedForLockedUser(request(method, path)), method + " " + path);
    }

    private static MockHttpServletRequest request(String method, String path) {
        MockHttpServletRequest request = new MockHttpServletRequest(method, path);
        request.setServletPath(path);
        return request;
    }
}
