package com.WMS.BE.controller;

import com.WMS.BE.dto.AIChatRequest;
import com.WMS.BE.dto.AIChatResponse;
import com.WMS.BE.dto.ApiResponse;
import com.WMS.BE.service.AIChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AIChatController {

    private final AIChatService aiChatService;

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<AIChatResponse>> chat(@RequestBody AIChatRequest request) {
        AIChatResponse response = aiChatService.processChat(request);
        return ResponseEntity.ok(ApiResponse.success("AI response generated successfully", response));
    }
}
