package com.example.demo.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.service.AuthService;

class AuthControllerTest {

    @Test
    void currentUserRejectsMissingPrincipalAsUnauthorized() {
        AuthController controller = new AuthController(mock(AuthService.class));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> controller.currentUser(null));

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatusCode());
    }
}
