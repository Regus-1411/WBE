package com.WMS.BE.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIChatRequest {
    private String prompt;
    private String pageTitle;
    private String pageKey;
    private String pageScope;
    private String portalContext;
    private String userLanguage;
    private Map<String, Object> backendData;
    private List<ChatMessageDto> chatHistory;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatMessageDto {
        private String sender;
        private String text;
    }
}
