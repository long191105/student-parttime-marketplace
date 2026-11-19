package com.example.demo.config;

import java.util.Arrays;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import com.example.demo.chat.ChatWebSocketHandler;

@Configuration
@EnableWebSocket
public class ChatWebSocketConfig implements WebSocketConfigurer {

    private final ChatWebSocketHandler chatWebSocketHandler;
    private final String[] allowedOrigins;

    public ChatWebSocketConfig(
            ChatWebSocketHandler chatWebSocketHandler,
            @Value("${app.cors.allowed-origins:http://localhost:5173}") String allowedOrigins) {
        this.chatWebSocketHandler = chatWebSocketHandler;
        this.allowedOrigins = Arrays.stream(allowedOrigins.split(",")).map(String::trim).toArray(String[]::new);
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(chatWebSocketHandler, "/ws/chat").setAllowedOrigins(allowedOrigins);
    }
}
