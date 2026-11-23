package com.example.demo.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

class OtpEmailServiceTest {

    private static final String MAILJET_URL = "https://api.mailjet.com/v3.1/send";

    private RestClient.Builder restClientBuilder;
    private MockRestServiceServer server;

    @BeforeEach
    void setUp() {
        restClientBuilder = RestClient.builder();
        server = MockRestServiceServer.bindTo(restClientBuilder).build();
    }

    @Test
    void sendsMailjetPayloadUsingBasicAuthentication() {
        String basicCredentials = Base64.getEncoder()
                .encodeToString("api-key:secret-key".getBytes(StandardCharsets.UTF_8));
        server.expect(requestTo(MAILJET_URL))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header(HttpHeaders.AUTHORIZATION, "Basic " + basicCredentials))
                .andExpect(content().json("""
                        {
                          "Messages": [{
                            "From": {"Email": "verified@example.com", "Name": "Chợ Hời"},
                            "To": [{"Email": "person@gmail.com"}],
                            "Subject": "Mã xác minh tài khoản Chợ Hời",
                            "TextPart": "Mã xác minh đăng ký Chợ Hời của bạn là: 123456\\nMã có hiệu lực trong 10 phút. Không chia sẻ mã này với người khác."
                          }]
                        }
                        """))
                .andRespond(withSuccess("{\"Messages\":[{\"Status\":\"success\"}]}",
                        MediaType.APPLICATION_JSON));

        service("api-key", "secret-key").sendVerificationCode("person@gmail.com", "123456");

        server.verify();
    }

    @Test
    void mapsMailjetRejectionToServiceUnavailable() {
        server.expect(requestTo(MAILJET_URL))
                .andRespond(withStatus(HttpStatus.UNAUTHORIZED)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("{\"ErrorMessage\":\"Invalid API key\"}"));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service("api-key", "secret-key").sendVerificationCode("person@gmail.com", "123456"));

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, exception.getStatusCode());
        server.verify();
    }

    private OtpEmailService service(String apiKey, String secretKey) {
        return new OtpEmailService(
                restClientBuilder,
                apiKey,
                secretKey,
                "verified@example.com",
                "Chợ Hời",
                10);
    }
}
