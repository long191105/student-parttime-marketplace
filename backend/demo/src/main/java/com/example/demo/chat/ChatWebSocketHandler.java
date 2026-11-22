package com.example.demo.chat;

import java.io.IOException;
import java.util.LinkedHashMap;
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
    private static final int MAX_PAYLOAD_LENGTH = 65_536;
    private static final Set<String> CALL_EVENT_TYPES = Set.of(
            "call-invite", "call-accept", "call-decline", "call-offer",
            "call-answer", "call-ice", "call-end", "call-busy");
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
        if (message.getPayload().length() > MAX_PAYLOAD_LENGTH) {
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
        String type = request.path("type").asString("");
        if (CALL_EVENT_TYPES.contains(type)) {
            handleCallSignal(session, request, type);
            return;
        }
        if (!"message".equals(type)) {
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

    private void handleCallSignal(WebSocketSession session, JsonNode request, String type) throws IOException {
        long conversationId = request.path("conversationId").asLong(0);
        try {
            Set<Long> participants = chatService.getParticipantIds(conversationId);
            Long senderId = (Long) session.getAttributes().get(USER_ID_ATTRIBUTE);
            if (senderId == null) {
                sendCallError(session, conversationId, "Phiên chat không hợp lệ.");
                return;
            }

            Map<String, Object> event = new LinkedHashMap<>();
            event.put("type", type);
            event.put("conversationId", Long.toString(conversationId));
            event.put("senderId", senderId.toString());

            if ("call-invite".equals(type)) {
                String callType = request.path("callType").asString("");
                if (!"audio".equals(callType) && !"video".equals(callType)) {
                    sendCallError(session, conversationId, "Loại cuộc gọi không hợp lệ.");
                    return;
                }
                event.put("callType", callType);
            } else if ("call-busy".equals(type) || "call-decline".equals(type)) {
                String callType = request.path("callType").asString("");
                if (!"audio".equals(callType) && !"video".equals(callType)) {
                    sendCallError(session, conversationId, "Loại cuộc gọi không hợp lệ.");
                    return;
                }
                String outcome = "call-busy".equals(type) ? "busy" : "declined";
                ChatMessageResponse callMessage = chatService.recordCallStatusMessage(conversationId, callType, outcome);
                broadcast(participants, Map.of("type", "message", "message", callMessage));
                event.put("callType", callType);
            } else if ("call-end".equals(type)) {
                String outcome = request.path("outcome").asString("");
                if (!outcome.isBlank()) {
                    String callType = request.path("callType").asString("");
                    if (!"audio".equals(callType) && !"video".equals(callType)) {
                        sendCallError(session, conversationId, "Loại cuộc gọi không hợp lệ.");
                        return;
                    }
                    ChatMessageResponse callMessage;
                    if ("completed".equals(outcome)) {
                        JsonNode duration = request.path("durationSeconds");
                        if (!duration.isNumber()) {
                            sendCallError(session, conversationId, "Thời lượng cuộc gọi không hợp lệ.");
                            return;
                        }
                        callMessage = chatService.recordCompletedCall(
                                conversationId,
                                callType,
                                duration.asLong(-1));
                    } else if ("cancelled".equals(outcome) || "no-answer".equals(outcome)) {
                        callMessage = chatService.recordCallStatusMessage(conversationId, callType, outcome);
                    } else {
                        sendCallError(session, conversationId, "Trạng thái cuộc gọi không hợp lệ.");
                        return;
                    }
                    broadcast(participants, Map.of("type", "message", "message", callMessage));
                }
            } else if ("call-offer".equals(type) || "call-answer".equals(type)) {
                JsonNode description = request.path("description");
                String expectedType = "call-offer".equals(type) ? "offer" : "answer";
                String sdp = description.path("sdp").asString("");
                if (!description.isObject()
                        || !expectedType.equals(description.path("type").asString(""))
                        || sdp.isBlank() || sdp.length() > 32_000) {
                    sendCallError(session, conversationId, "Thông tin thiết lập cuộc gọi không hợp lệ.");
                    return;
                }
                event.put("description", description);
            } else if ("call-ice".equals(type)) {
                JsonNode candidate = request.path("candidate");
                String value = candidate.path("candidate").asString("");
                if (!candidate.isObject() || value.length() > 2_048) {
                    sendCallError(session, conversationId, "Thông tin kết nối cuộc gọi không hợp lệ.");
                    return;
                }
                event.put("candidate", candidate);
            }

            Set<Long> recipients = participants.stream()
                    .filter(participantId -> !participantId.equals(senderId))
                    .collect(java.util.stream.Collectors.toSet());
            if ("call-invite".equals(type)) {
                boolean recipientOnline = recipients.stream().anyMatch(this::hasOpenSession);
                sendCallStatus(session, "call-contacting", conversationId, senderId);
                if (recipientOnline) {
                    sendCallStatus(session, "call-ringing", conversationId, senderId);
                    broadcast(recipients, event);
                }
                return;
            }
            broadcast(recipients, event);
        } catch (ResponseStatusException exception) {
            sendCallError(session, conversationId, exception.getReason() == null
                    ? "Không thể chuyển tiếp tín hiệu cuộc gọi."
                    : exception.getReason());
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

    private boolean hasOpenSession(Long userId) {
        Set<WebSocketSession> sessions = sessionsByUser.get(userId);
        return sessions != null && sessions.stream().anyMatch(WebSocketSession::isOpen);
    }

    private void sendError(WebSocketSession session, String message) throws IOException {
        if (session.isOpen()) {
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(Map.of(
                    "type", "error",
                    "message", message))));
        }
    }

    private void sendCallError(WebSocketSession session, long conversationId, String message) throws IOException {
        if (session.isOpen()) {
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(Map.of(
                    "type", "call-error",
                    "conversationId", Long.toString(conversationId),
                    "message", message))));
        }
    }

    private void sendCallStatus(WebSocketSession session, String type, long conversationId, long senderId)
            throws IOException {
        if (!session.isOpen()) return;
        Map<String, Object> event = Map.of(
                "type", type,
                "conversationId", Long.toString(conversationId),
                "senderId", Long.toString(senderId));
        synchronized (session) {
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(event)));
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
