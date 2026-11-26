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

import com.example.demo.model.ListingStatus;

class BrevoEmailServiceTest {

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

    @Test
    void sendsListingModerationUpdateToSeller() {
        server.expect(requestTo(BREVO_URL))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("api-key", "brevo-api-key"))
                .andExpect(content().json("""
                        {
                          "sender": {"email": "verified@example.com", "name": "Chợ Hời"},
                          "to": [{"email": "person@gmail.com"}],
                          "subject": "Cập nhật trạng thái tin đăng trên Chợ Hời",
                          "textContent": "Xin chào Long,\\n\\nTin đăng \\"Máy ảnh\\" chưa được duyệt trên Chợ Hời.\\nLý do: Thiếu hình ảnh.\\n\\nBạn có thể đăng nhập Chợ Hời để xem chi tiết."
                        }
                        """))
                .andRespond(withSuccess("{\"messageId\":\"test-message-id\"}", MediaType.APPLICATION_JSON));

        service("brevo-api-key").sendListingModerationUpdate(
                "person@gmail.com",
                "Long",
                "Máy ảnh",
                ListingStatus.REJECTED,
                "Thiếu hình ảnh.");

        server.verify();
    }

    @Test
    void sendsApprovalEmailWithoutRejectionReason() {
        server.expect(requestTo(BREVO_URL))
                .andExpect(content().json("""
                        {
                          "to": [{"email": "person@gmail.com"}],
                          "subject": "Cập nhật trạng thái tin đăng trên Chợ Hời",
                          "textContent": "Xin chào Long,\\n\\nTin đăng \\"Máy ảnh\\" đã được duyệt trên Chợ Hời.\\n\\nBạn có thể đăng nhập Chợ Hời để xem chi tiết."
                        }
                        """))
                .andRespond(withSuccess("{\"messageId\":\"test-message-id\"}", MediaType.APPLICATION_JSON));

        service("brevo-api-key").sendListingModerationUpdate(
                "person@gmail.com",
                "Long",
                "Máy ảnh",
                ListingStatus.ACTIVE,
                null);

        server.verify();
    }

    private BrevoEmailService service(String apiKey) {
        return new BrevoEmailService(
                restClientBuilder,
                apiKey,
                "verified@example.com",
                "Chợ Hời",
                10);
    }
}
