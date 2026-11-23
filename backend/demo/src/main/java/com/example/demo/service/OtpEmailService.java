package com.example.demo.service;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE;

@Service
public class OtpEmailService {

    private static final Logger LOGGER = LoggerFactory.getLogger(OtpEmailService.class);
    private static final String BREVO_SEND_URL = "https://api.brevo.com/v3/smtp/email";

    private final RestClient restClient;
    private final String apiKey;
    private final String senderEmail;
    private final String senderName;
    private final long expirationMinutes;

    public OtpEmailService(
            RestClient.Builder restClientBuilder,
            @Value("${app.brevo.api-key:}") String apiKey,
            @Value("${app.brevo.from-email:}") String senderEmail,
            @Value("${app.brevo.from-name:Chợ Hời}") String senderName,
            @Value("${app.otp.expiration-minutes:10}") long expirationMinutes) {
        this.restClient = restClientBuilder.build();
        this.apiKey = apiKey;
        this.senderEmail = senderEmail;
        this.senderName = senderName;
        this.expirationMinutes = expirationMinutes;
    }

    public void sendVerificationCode(String recipient, String code) {
        if (apiKey.isBlank() || senderEmail.isBlank()) {
            throw new ResponseStatusException(
                    SERVICE_UNAVAILABLE,
                    "Chưa cấu hình Brevo. Hãy đặt BREVO_API_KEY và BREVO_FROM_EMAIL.");
        }

        Map<String, Object> payload = Map.of(
                "sender", Map.of("email", senderEmail, "name", senderName),
                "to", List.of(Map.of("email", recipient)),
                "subject", "Mã xác minh tài khoản Chợ Hời",
                "textContent", "Mã xác minh đăng ký Chợ Hời của bạn là: " + code
                        + "\nMã có hiệu lực trong " + expirationMinutes
                        + " phút. Không chia sẻ mã này với người khác.");

        try {
            restClient.post()
                    .uri(BREVO_SEND_URL)
                    .header("api-key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException exception) {
            String response = redact(exception.getResponseBodyAsString(), recipient);
            LOGGER.error("Brevo returned HTTP {} while sending verification email: {}",
                    exception.getStatusCode().value(), response);
            throw deliveryException(exception);
        } catch (RestClientException exception) {
            Throwable rootCause = exception;
            while (rootCause.getCause() != null && rootCause.getCause() != rootCause) {
                rootCause = rootCause.getCause();
            }
            LOGGER.error("Brevo request failed: {}: {}",
                    rootCause.getClass().getSimpleName(),
                    redact(rootCause.getMessage() == null ? "" : rootCause.getMessage(), recipient));
            throw deliveryException(exception);
        }
    }

    private ResponseStatusException deliveryException(Exception cause) {
        return new ResponseStatusException(
                SERVICE_UNAVAILABLE,
                "Không gửi được email xác minh. Vui lòng thử lại sau.",
                cause);
    }

    private String redact(String message, String recipient) {
        String redacted = message
                .replace("\r", " ")
                .replace("\n", " ");
        for (String sensitiveValue : new String[]{apiKey, senderEmail, recipient}) {
            if (sensitiveValue != null && !sensitiveValue.isBlank()) {
                redacted = redacted.replace(sensitiveValue, "[redacted]");
            }
        }
        return redacted;
    }
}
