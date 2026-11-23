package com.example.demo.controller;

import java.util.List;
import java.util.Map;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.dto.ChatConversationResponse;
import com.example.demo.dto.ChatMessageResponse;
import com.example.demo.model.UserAccount;
import com.example.demo.service.CallIceServerService;
import com.example.demo.service.ChatService;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;
    private final CallIceServerService callIceServerService;

    public ChatController(ChatService chatService, CallIceServerService callIceServerService) {
        this.chatService = chatService;
        this.callIceServerService = callIceServerService;
    }

    @GetMapping("/ice-servers")
    public List<Map<String, Object>> iceServers(@AuthenticationPrincipal UserAccount user) {
        return callIceServerService.getIceServers(user.getId());
    }

    @GetMapping("/conversations")
    public List<ChatConversationResponse> conversations() {
        return chatService.listConversations();
    }

    @PostMapping("/listings/{listingId}")
    public ResponseEntity<ChatConversationResponse> openForListing(@PathVariable String listingId) {
        return ResponseEntity.ok(chatService.openForListing(parseId(listingId, "tin đăng")));
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public List<ChatMessageResponse> messages(@PathVariable String conversationId) {
        return chatService.getMessages(parseId(conversationId, "cuộc trò chuyện"));
    }

    private static Long parseId(String value, String label) {
        try {
            long id = Long.parseLong(value);
            if (id < 1) throw new NumberFormatException("ID must be positive");
            return id;
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã " + label + " không hợp lệ.", exception);
        }
    }
}
