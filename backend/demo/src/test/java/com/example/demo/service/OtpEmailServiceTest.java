package com.example.demo.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

class OtpEmailServiceTest {

    private static final String BREVO_URL = "https://api.brevo.com/v3/smtp/email";

    private RestClient.Builder restClientBuilder;
    private MockRestServiceServer server;

    @BeforeEach
    void setUp() {
        restClientBuilder = RestClient.builder();
        server = MockRestServiceServer.bindTo(restClientBuilder).build();
    }

    @Test
    void sendsBrevoPayloadUsingApiKeyHeader() {
        server.expect(requestTo(BREVO_URL))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("api-key", "brevo-api-key"))
                .andExpect(content().json("""
                        {
                          "sender": {"email": "verified@example.com", "name": "Chợ Hời"},
                          "to": [{"email": "person@gmail.com"}],
                          "subject": "Mã xác minh tài khoản Chợ Hời",
                          "textContent": "Mã xác minh đăng ký Chợ Hời của bạn là: 123456\\nMã có hiệu lực trong 10 phút. Không chia sẻ mã này với người khác."
                        }
                        """))
                .andRespond(withSuccess("{\"messageId\":\"test-message-id\"}", MediaType.APPLICATION_JSON));

        service("brevo-api-key").sendVerificationCode("person@gmail.com", "123456");

        server.verify();
    }

    @Test
    void mapsBrevoRejectionToServiceUnavailable() {
        server.expect(requestTo(BREVO_URL))
                .andRespond(withStatus(HttpStatus.UNAUTHORIZED)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("{\"ErrorMessage\":\"Invalid API key\"}"));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service("brevo-api-key").sendVerificationCode("person@gmail.com", "123456"));

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, exception.getStatusCode());
        server.verify();
    }

    private OtpEmailService service(String apiKey) {
        return new OtpEmailService(
                restClientBuilder,
                apiKey,
                "verified@example.com",
                "Chợ Hời",
                10);
    }
}
