package com.paltform.VoicesOfSyria.Controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.paltform.VoicesOfSyria.Dto.ChatRequestDTO;
import com.paltform.VoicesOfSyria.Service.ChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping("public/api/chat")
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);

    @Value("${embedding.service.url:http://localhost:5001}")
    private String embeddingServiceUrl;

    private final ChatService chatService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping("/ask")
    public ResponseEntity<StreamingResponseBody> ask(@RequestBody ChatRequestDTO request) {
        String question = request.getQuestion();

        if (question == null || question.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        List<Map<String, Object>> stories = chatService.buildChatContext(question);
        String language = chatService.detectLanguage(question);

        Map<String, Object> embeddingRequest = new HashMap<>();
        embeddingRequest.put("question", question);
        embeddingRequest.put("stories", stories);
        embeddingRequest.put("chat_history",
            request.getChatHistory() != null ? request.getChatHistory() : Collections.emptyList());
        embeddingRequest.put("language", language);

        StreamingResponseBody stream = outputStream -> {
            try {
                String body = objectMapper.writeValueAsString(embeddingRequest);
                URL url = new URL(embeddingServiceUrl + "/api/chat/generate");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setRequestProperty("Accept", "text/event-stream");
                conn.setDoOutput(true);
                conn.setReadTimeout(120000);

                try (OutputStream os = conn.getOutputStream()) {
                    os.write(body.getBytes(StandardCharsets.UTF_8));
                }

                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                    String line;
                    PrintWriter writer = new PrintWriter(new OutputStreamWriter(outputStream, StandardCharsets.UTF_8), true);
                    while ((line = reader.readLine()) != null) {
                        writer.println(line);
                        writer.flush();
                        outputStream.flush();
                    }
                }
            } catch (Exception e) {
                log.error("Streaming failed: {}", e.getMessage());
            }
        };

        return ResponseEntity.ok()
            .contentType(MediaType.TEXT_EVENT_STREAM)
            .header("Cache-Control", "no-cache")
            .header("X-Accel-Buffering", "no")
            .body(stream);
    }
}
