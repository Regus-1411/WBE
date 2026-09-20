package com.WMS.BE.service;

import com.WMS.BE.dto.AIChatRequest;
import com.WMS.BE.dto.AIChatResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

@Slf4j
@Service
public class AIChatService {

    @Value("${app.ai.gemini.api-key:${GEMINI_API_KEY:}}")
    private String geminiApiKey;

    @Value("${app.ai.openai.api-key:${OPENAI_API_KEY:}}")
    private String openaiApiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private static final String FORMAL_REJECTION_EN = "I am sorry, I am not able to do that. I am dedicated exclusively to assisting with DROP Smart Water Platform operations and data for this portal. Please let me know how I may assist you with your water consumption, invoices, or telemetry.";
    private static final String FORMAL_REJECTION_HI = "मुझे खेद है, मैं यह कार्य करने में असमर्थ हूँ। मैं विशेष रूप से ड्रॉप (DROP) स्मार्ट वाटर मैनेजमेंट प्लेटफ़ॉर्म के कार्यों और डेटा में सहायता के लिए समर्पित हूँ। कृपया मुझे बताएं कि मैं आपके पानी की खपत, बिलों या टेलीमेट्री में कैसे सहायता कर सकता हूँ।";

    public AIChatResponse processChat(AIChatRequest request) {
        String prompt = request.getPrompt() != null ? request.getPrompt().trim() : "";
        String userLang = request.getUserLanguage() != null ? request.getUserLanguage().toLowerCase() : "en";

        // Check if query is asking to write code or do unrelated out-of-scope tasks
        if (isOutOfScopeTask(prompt)) {
            String rejection = userLang.startsWith("hi") ? FORMAL_REJECTION_HI : FORMAL_REJECTION_EN;
            return AIChatResponse.builder()
                    .success(true)
                    .response(rejection)
                    .provider("system")
                    .model("guardrail")
                    .build();
        }

        // Try Gemini or OpenAI if keys are present on the backend
        String geminiKey = geminiApiKey != null ? geminiApiKey.trim() : "";
        String openaiKey = openaiApiKey != null ? openaiApiKey.trim() : "";

        if (!geminiKey.isEmpty()) {
            try {
                return callGemini(geminiKey, request);
            } catch (Exception e) {
                log.warn("Backend Gemini call failed: {}", e.getMessage());
            }
        } else if (!openaiKey.isEmpty()) {
            try {
                return callOpenAI(openaiKey, request);
            } catch (Exception e) {
                log.warn("Backend OpenAI call failed: {}", e.getMessage());
            }
        }

        // Fallback grounded answer
        String localAnswer = generateBackendFallback(request);
        return AIChatResponse.builder()
                .success(true)
                .response(localAnswer)
                .provider("backend-grounded")
                .model("local-rules")
                .build();
    }

    private boolean isOutOfScopeTask(String prompt) {
        if (prompt == null || prompt.isEmpty()) return false;
        String q = prompt.toLowerCase();

        // Specific coding request patterns
        if (q.contains("write code") || q.contains("write a code") || q.contains("write a program") ||
            q.contains("write python") || q.contains("write javascript") || q.contains("write java") ||
            q.contains("can you write code") || q.contains("code for me") || q.contains("coding") ||
            q.contains("generate code") || q.contains("create a script") || q.contains("write an algorithm")) {
            return true;
        }

        // General non-water queries
        if (q.contains("who is the president") || q.contains("weather in") || q.contains("recipe") ||
            q.contains("movie recommendation") || q.contains("tell me a joke") || q.contains("cricket score") ||
            q.contains("football score") || q.contains("write an essay") || q.contains("translate this poem")) {
            return true;
        }

        return false;
    }

    private static final List<String> GEMINI_CANDIDATE_MODELS = List.of(
            "gemini-2.0-flash",
            "gemini-2.5-flash",
            "gemini-1.5-flash",
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro",
            "gemini-pro"
    );

    private String buildSystemInstruction(AIChatRequest request) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are DROP AI — the interactive, intelligent Water Management Operations Partner for the DROP platform.\n");
        sb.append("Current Page: \"").append(request.getPageTitle() != null ? request.getPageTitle() : "Portal").append("\"\n");
        sb.append("Current Portal Context: \"").append(request.getPortalContext() != null ? request.getPortalContext() : "Platform").append("\"\n");
        sb.append("Active Page Scope: \"").append(request.getPageScope() != null ? request.getPageScope() : "").append("\"\n\n");
        
        sb.append("=== CORE OPERATING GUIDELINES ===\n");
        sb.append("1. LIVE DYNAMIC CALCULATIONS & ACCURACY:\n");
        sb.append("   - When asked ANY calculation (e.g. progressive volumetric tiered slab charges, total bill estimation for X kL, savings percentages, daily average consumption per unit, collection percentages, tanker cost per flat), LIVELY CALCULATE the mathematical result step-by-step with clear arithmetic and unit labels (₹, Liters, kL, %).\n");
        sb.append("   - Never output generic static templates when exact live numbers or formulas are requested.\n\n");
        
        sb.append("2. INTERACTIVE & ENGAGING CONVERSATION:\n");
        sb.append("   - Provide lively, helpful, conversational, and energetic answers tailored to the user's specific question.\n");
        sb.append("   - Never end with a cold wall of text. ALWAYS conclude your answer with an interactive follow-up question, proactive recommendation, or next action step tailored to the user's situation.\n\n");
        
        sb.append("3. COMMON LANGUAGE FLUENCY:\n");
        sb.append("   - Reply fluently and naturally in the exact language used by the user (Hindi, Hinglish, Spanish, French, Telugu, Tamil, German, etc.).\n\n");
        
        sb.append("4. STRICT OUT-OF-SCOPE REJECTION:\n");
        sb.append("   - If the user asks to write code, do software programming, or answer non-water general trivia/entertainment/sports, politely and formally decline:\n");
        sb.append("     \"I am sorry, I am not able to do that. I am dedicated exclusively to assisting with DROP Smart Water Platform operations and data for this portal. Please let me know how I may assist you with your water consumption, invoices, or telemetry.\"\n\n");
        
        sb.append("5. PORTAL BOUNDARIES & DATA AUTHORIZATION:\n");
        sb.append("   - Resident: Strictly authorized for their own flat records and personal water telemetry.\n");
        sb.append("   - Admin: Full access to society-wide telemetry, flat directory, batch billing, leakage alerts, and bulk tankers.\n");
        sb.append("   - Public: Platform overview, 20% conservation benefits, volumetric billing formula, and registration.\n\n");
        
        sb.append("6. OFFICIAL PAYMENT GATEWAY (RAZORPAY):\n");
        sb.append("   - The DROP platform uses Razorpay as its official 256-bit SSL secured payment gateway.\n");
        sb.append("   - Razorpay supports Instant UPI & QR (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards (Visa, MasterCard, RuPay), NetBanking (50+ banks), and Wallets.\n");
        sb.append("   - When residents ask about bill payments, guide them to use 'Pay with Razorpay' on their resident dashboard.\n\n");
        
        sb.append("=== LIVE DATABASE TELEMETRY & TARIFF CONTEXT ===\n");
        if (request.getBackendData() != null) {
            try {
                sb.append(objectMapper.writeValueAsString(request.getBackendData())).append("\n");
            } catch (Exception e) {
                sb.append(request.getBackendData().toString()).append("\n");
            }
        }
        
        return sb.toString();
    }

    private AIChatResponse callGemini(String apiKey, AIChatRequest request) throws Exception {
        String systemPrompt = buildSystemInstruction(request);

        List<Map<String, Object>> contents = new ArrayList<>();
        if (request.getChatHistory() != null) {
            for (AIChatRequest.ChatMessageDto msg : request.getChatHistory()) {
                Map<String, Object> turn = new HashMap<>();
                turn.put("role", "user".equalsIgnoreCase(msg.getSender()) ? "user" : "model");
                turn.put("parts", List.of(Map.of("text", msg.getText())));
                contents.add(turn);
            }
        }
        contents.add(Map.of("role", "user", "parts", List.of(Map.of("text", request.getPrompt()))));

        Exception lastException = null;

        for (String model : GEMINI_CANDIDATE_MODELS) {
            try {
                String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;

                Map<String, Object> payload = new HashMap<>();
                payload.put("contents", contents);
                payload.put("systemInstruction", Map.of("parts", List.of(Map.of("text", systemPrompt))));
                payload.put("generationConfig", Map.of("temperature", 0.4, "maxOutputTokens", 1200));

                String body = objectMapper.writeValueAsString(payload);
                HttpRequest httpRequest = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(body))
                        .timeout(Duration.ofSeconds(12))
                        .build();

                HttpResponse<String> httpResponse = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

                // Fallback for older models that don't accept systemInstruction
                if (httpResponse.statusCode() == 400 || httpResponse.statusCode() == 404) {
                    Map<String, Object> fallbackPayload = new HashMap<>();
                    List<Map<String, Object>> fallbackContents = new ArrayList<>(contents);
                    fallbackContents.add(0, Map.of("role", "user", "parts", List.of(Map.of("text", "[SYSTEM INSTRUCTION]\n" + systemPrompt))));
                    fallbackPayload.put("contents", fallbackContents);
                    fallbackPayload.put("generationConfig", Map.of("temperature", 0.4, "maxOutputTokens", 1200));

                    String fallbackBody = objectMapper.writeValueAsString(fallbackPayload);
                    HttpRequest fallbackReq = HttpRequest.newBuilder()
                            .uri(URI.create(url))
                            .header("Content-Type", "application/json")
                            .POST(HttpRequest.BodyPublishers.ofString(fallbackBody))
                            .timeout(Duration.ofSeconds(12))
                            .build();
                    httpResponse = httpClient.send(fallbackReq, HttpResponse.BodyHandlers.ofString());
                }

                if (httpResponse.statusCode() == 200) {
                    JsonNode root = objectMapper.readTree(httpResponse.body());
                    JsonNode candidates = root.path("candidates");
                    if (candidates.isArray() && candidates.size() > 0) {
                        String text = candidates.get(0).path("content").path("parts").get(0).path("text").asText();
                        if (text != null && !text.isEmpty()) {
                            return AIChatResponse.builder()
                                    .success(true)
                                    .response(text)
                                    .provider("gemini")
                                    .model(model)
                                    .build();
                        }
                    }
                } else {
                    lastException = new RuntimeException("Model " + model + " returned HTTP " + httpResponse.statusCode());
                }
            } catch (Exception e) {
                lastException = e;
            }
        }

        throw lastException != null ? lastException : new RuntimeException("Unable to generate response from Gemini API");
    }

    private AIChatResponse callOpenAI(String apiKey, AIChatRequest request) throws Exception {
        String systemPrompt = buildSystemInstruction(request);
        String url = "https://api.openai.com/v1/chat/completions";

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));

        if (request.getChatHistory() != null) {
            for (AIChatRequest.ChatMessageDto msg : request.getChatHistory()) {
                messages.add(Map.of(
                        "role", "user".equalsIgnoreCase(msg.getSender()) ? "user" : "assistant",
                        "content", msg.getText()
                ));
            }
        }
        messages.add(Map.of("role", "user", "content", request.getPrompt()));

        Map<String, Object> payload = new HashMap<>();
        payload.put("model", "gpt-4o-mini");
        payload.put("messages", messages);
        payload.put("temperature", 0.3);
        payload.put("max_tokens", 1000);

        String body = objectMapper.writeValueAsString(payload);
        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .timeout(Duration.ofSeconds(15))
                .build();

        HttpResponse<String> httpResponse = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
        if (httpResponse.statusCode() == 200) {
            JsonNode root = objectMapper.readTree(httpResponse.body());
            String text = root.path("choices").get(0).path("message").path("content").asText();
            return AIChatResponse.builder()
                    .success(true)
                    .response(text)
                    .provider("openai")
                    .model("gpt-4o-mini")
                    .build();
        } else {
            throw new RuntimeException("OpenAI returned status " + httpResponse.statusCode());
        }
    }

    private String generateBackendFallback(AIChatRequest request) {
        String q = request.getPrompt() != null ? request.getPrompt().toLowerCase().trim() : "";
        String pageKey = request.getPageKey() != null ? request.getPageKey() : "";

        if (q.matches("^(hi|hello|hey|good morning|good afternoon|good evening|namaste|greetings).*")) {
            return "Good day and welcome to **DROP Smart Water Platform**.\n\nI am your AI Assistant for the **" + (request.getPageTitle() != null ? request.getPageTitle() : "Platform") + "** page. How may I assist you with your water telemetry, billing, or conservation data today?";
        }

        if (q.contains("thank")) {
            return "You are most welcome. Please let me know if you require any further assistance regarding **" + (request.getPageTitle() != null ? request.getPageTitle() : "this page") + "**.";
        }

        if (pageKey.startsWith("resident-")) {
            return "As an authenticated resident, you can view your personal household water consumption logs, itemized billing statements, and smart meter status directly on this portal.";
        }

        if (pageKey.startsWith("admin-")) {
            return "As a Community Administrator, you have full access to society-wide water telemetry, household directories, batch billing generation, and active pipeline leakage detection.";
        }

        return "DROP Smart Water Management Platform provides smart sub-metering, progressive volumetric billing slabs, and real-time leak detection. Please ask any question related to " + (request.getPageTitle() != null ? request.getPageTitle() : "this portal") + ".";
    }
}
