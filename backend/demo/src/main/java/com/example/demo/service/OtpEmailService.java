package com.example.demo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE;

@Service
public class OtpEmailService {

    private static final Logger LOGGER = LoggerFactory.getLogger(OtpEmailService.class);

    private final JavaMailSender mailSender;
    private final String username;
    private final String password;
    private final long expirationMinutes;

    public OtpEmailService(
            JavaMailSender mailSender,
            @Value("${spring.mail.username:}") String username,
            @Value("${spring.mail.password:}") String password,
            @Value("${app.otp.expiration-minutes:10}") long expirationMinutes) {
        this.mailSender = mailSender;
        this.username = username;
        this.password = password;
        this.expirationMinutes = expirationMinutes;
    }

    public void sendVerificationCode(String recipient, String code) {
        if (username.isBlank() || password.isBlank()) {
            throw new ResponseStatusException(
                    SERVICE_UNAVAILABLE,
                    "Chưa cấu hình Gmail SMTP. Hãy đặt MAIL_USERNAME và Google App Password trong file .env.");
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(username);
        message.setTo(recipient);
        message.setSubject("Mã xác minh tài khoản Chợ Hời");
        message.setText("Mã xác minh đăng ký Chợ Hời của bạn là: " + code
                + "\nMã có hiệu lực trong " + expirationMinutes
                + " phút. Không chia sẻ mã này với người khác.");
        try {
            mailSender.send(message);
        } catch (MailException exception) {
            Throwable rootCause = exception;
            while (rootCause.getCause() != null && rootCause.getCause() != rootCause) {
                rootCause = rootCause.getCause();
            }
            String details = rootCause.getMessage() == null ? "" : rootCause.getMessage();
            details = redact(details, recipient);
            LOGGER.error("Verification email delivery failed: {}: {}",
                    rootCause.getClass().getSimpleName(), details);
            throw new ResponseStatusException(
                    SERVICE_UNAVAILABLE,
                    "Không gửi được email xác minh. Hãy kiểm tra cấu hình Gmail SMTP rồi thử lại.",
                    exception);
        }
    }

    private String redact(String message, String recipient) {
        String redacted = message
                .replace("\r", " ")
                .replace("\n", " ");
        for (String sensitiveValue : new String[]{username, password, recipient}) {
            if (sensitiveValue != null && !sensitiveValue.isBlank()) {
                redacted = redacted.replace(sensitiveValue, "[redacted]");
            }
        }
        return redacted;
    }
}
