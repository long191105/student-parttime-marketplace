package com.example.demo.service;

import java.nio.charset.StandardCharsets;
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
    private static final String MAILJET_SEND_URL = "https://api.mailjet.com/v3.1/send";

    private final RestClient restClient;
    private final String apiKey;
    private final String secretKey;
    private final String senderEmail;
    private final String senderName;
    private final long expirationMinutes;

    public OtpEmailService(
            RestClient.Builder restClientBuilder,
            @Value("${app.mailjet.api-key:}") String apiKey,
            @Value("${app.mailjet.secret-key:}") String secretKey,
            @Value("${app.mailjet.from-email:}") String senderEmail,
            @Value("${app.mailjet.from-name:Chợ Hời}") String senderName,
            @Value("${app.otp.expiration-minutes:10}") long expirationMinutes) {
        this.restClient = restClientBuilder.build();
        this.apiKey = apiKey;
        this.secretKey = secretKey;
        this.senderEmail = senderEmail;
        this.senderName = senderName;
        this.expirationMinutes = expirationMinutes;
    }

    public void sendVerificationCode(String recipient, String code) {
        if (apiKey.isBlank() || secretKey.isBlank() || senderEmail.isBlank()) {
            throw new ResponseStatusException(
                    SERVICE_UNAVAILABLE,
                    "Chưa cấu hình Mailjet. Hãy đặt MAILJET_API_KEY, MAILJET_SECRET_KEY và MAILJET_FROM_EMAIL.");
        }

        Map<String, Object> payload = Map.of(
                "Messages", List.of(Map.of(
                        "From", Map.of("Email", senderEmail, "Name", senderName),
                        "To", List.of(Map.of("Email", recipient)),
                        "Subject", "Mã xác minh tài khoản Chợ Hời",
                        "TextPart", "Mã xác minh đăng ký Chợ Hời của bạn là: " + code
                                + "\nMã có hiệu lực trong " + expirationMinutes
                                + " phút. Không chia sẻ mã này với người khác.")));

        try {
            restClient.post()
                    .uri(MAILJET_SEND_URL)
                    .headers(headers -> headers.setBasicAuth(apiKey, secretKey, StandardCharsets.UTF_8))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException exception) {
            String response = redact(exception.getResponseBodyAsString(), recipient);
            LOGGER.error("Mailjet returned HTTP {} while sending verification email: {}",
                    exception.getStatusCode().value(), response);
            throw deliveryException(exception);
        } catch (RestClientException exception) {
            Throwable rootCause = exception;
            while (rootCause.getCause() != null && rootCause.getCause() != rootCause) {
                rootCause = rootCause.getCause();
            }
            LOGGER.error("Mailjet request failed: {}: {}",
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
        for (String sensitiveValue : new String[]{apiKey, secretKey, senderEmail, recipient}) {
            if (sensitiveValue != null && !sensitiveValue.isBlank()) {
                redacted = redacted.replace(sensitiveValue, "[redacted]");
            }
        }
        return redacted;
    }
}
