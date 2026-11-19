package com.example.demo.chat;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.example.demo.dto.ChatMessageResponse;
import com.example.demo.model.UserAccount;
import com.example.demo.security.JwtService;
import com.example.demo.service.ChatService;

import io.jsonwebtoken.JwtException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private static final Logger logger = LoggerFactory.getLogger(ChatWebSocketHandler.class);
    private static final String USER_ID_ATTRIBUTE = "chatUserId";
    private static final String USER_ATTRIBUTE = "chatUser";

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final ChatService chatService;
    private final ObjectMapper objectMapper;
    private final Map<Long, Set<WebSocketSession>> sessionsByUser = new ConcurrentHashMap<>();

    public ChatWebSocketHandler(
            JwtService jwtService,
            UserDetailsService userDetailsService,
            ChatService chatService,
            ObjectMapper objectMapper) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.chatService = chatService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
        if (message.getPayload().length() > 4096) {
            sendError(session, "Dữ liệu gửi lên vượt quá giới hạn cho phép.");
            closeQuietly(session, CloseStatus.TOO_BIG_TO_PROCESS);
            return;
        }

        JsonNode request;
        try {
            request = objectMapper.readTree(message.getPayload());
        } catch (RuntimeException exception) {
            sendError(session, "Không thể đọc dữ liệu chat đã gửi.");
            return;
        }
        if (request == null || !request.isObject()) {
            sendError(session, "Dữ liệu chat không hợp lệ.");
            return;
        }

        UserAccount user = (UserAccount) session.getAttributes().get(USER_ATTRIBUTE);
        if (user == null) {
            authenticate(session, request);
            return;
        }

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities()));
        SecurityContextHolder.setContext(context);
        try {
            handleAuthenticatedMessage(session, request);
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    private void handleAuthenticatedMessage(WebSocketSession session, JsonNode request) throws IOException {
        if (!"message".equals(request.path("type").asString(""))) {
            sendError(session, "Loại dữ liệu gửi lên không được hỗ trợ.");
            return;
        }
        long conversationId = request.path("conversationId").asLong(0);
        try {
            String content = request.path("content").asString("");
            String messageType = request.path("messageType").asString("TEXT");
            ChatMessageResponse savedMessage;
            if ("TEXT".equals(messageType)) {
                savedMessage = chatService.sendMessage(conversationId, content);
            } else if ("LOCATION".equals(messageType)) {
                savedMessage = chatService.sendLocationMessage(
                        conversationId,
                        content,
                        optionalNumber(request, "latitude"),
                        optionalNumber(request, "longitude"),
                        request.path("mapUrl").asString(""));
            } else {
                sendError(session, "Loại tin nhắn không được hỗ trợ.");
                return;
            }
            Set<Long> participants = chatService.getParticipantIds(conversationId);
            broadcast(participants, Map.of("type", "message", "message", savedMessage));
        } catch (ResponseStatusException exception) {
            sendError(session, exception.getReason() == null ? "Không thể gửi tin nhắn." : exception.getReason());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        removeSession(session);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        logger.debug("Chat WebSocket transport failed.", exception);
        removeSession(session);
        closeQuietly(session, CloseStatus.SERVER_ERROR);
    }

    private void authenticate(WebSocketSession session, JsonNode request) throws IOException {
        if (!"auth".equals(request.path("type").asString(""))) {
            sendError(session, "Cần xác thực trước khi sử dụng hộp thư.");
            closeQuietly(session, CloseStatus.POLICY_VIOLATION);
            return;
        }
        String token = request.path("token").asString("");
        try {
            String email = jwtService.extractSubject(token);
            UserAccount user = (UserAccount) userDetailsService.loadUserByUsername(email);
            if (!user.isEnabled() || !jwtService.isValid(token, user.getEmail())) {
                throw new IllegalArgumentException("Invalid or inactive account.");
            }
            session.getAttributes().put(USER_ID_ATTRIBUTE, user.getId());
            session.getAttributes().put(USER_ATTRIBUTE, user);
            sessionsByUser.computeIfAbsent(user.getId(), ignored -> ConcurrentHashMap.newKeySet()).add(session);
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(Map.of("type", "authenticated"))));
        } catch (JwtException | IllegalArgumentException | AuthenticationException exception) {
            sendError(session, "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
            closeQuietly(session, CloseStatus.POLICY_VIOLATION);
        }
    }

    private void broadcast(Set<Long> participantIds, Map<String, Object> event) {
        String payload = objectMapper.writeValueAsString(event);
        for (Long participantId : participantIds) {
            Set<WebSocketSession> sessions = sessionsByUser.get(participantId);
            if (sessions == null) continue;
            for (WebSocketSession session : sessions) {
                if (!session.isOpen()) {
                    removeSession(session);
                    continue;
                }
                try {
                    synchronized (session) {
                        session.sendMessage(new TextMessage(payload));
                    }
                } catch (IOException exception) {
                    logger.debug("Could not deliver a chat message to a connected session.", exception);
                    removeSession(session);
                    closeQuietly(session, CloseStatus.SERVER_ERROR);
                }
            }
        }
    }

    private void sendError(WebSocketSession session, String message) throws IOException {
        if (session.isOpen()) {
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(Map.of(
                    "type", "error",
                    "message", message))));
        }
    }

    private void removeSession(WebSocketSession session) {
        Long userId = (Long) session.getAttributes().remove(USER_ID_ATTRIBUTE);
        session.getAttributes().remove(USER_ATTRIBUTE);
        if (userId == null) return;
        Set<WebSocketSession> sessions = sessionsByUser.get(userId);
        if (sessions != null) {
            sessions.remove(session);
            if (sessions.isEmpty()) sessionsByUser.remove(userId, sessions);
        }
    }

    private static Double optionalNumber(JsonNode node, String field) {
        JsonNode value = node.get(field);
        return value != null && value.isNumber() ? value.doubleValue() : null;
    }

    private static void closeQuietly(WebSocketSession session, CloseStatus status) {
        if (!session.isOpen()) return;
        try {
            session.close(status);
        } catch (IOException exception) {
            logger.debug("Could not close the chat WebSocket session.", exception);
        }
    }
}
