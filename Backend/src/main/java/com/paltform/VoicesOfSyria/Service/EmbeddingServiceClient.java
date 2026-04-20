package com.paltform.VoicesOfSyria.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.paltform.VoicesOfSyria.Dto.EmbeddingSearchResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
public class EmbeddingServiceClient {

    private static final Logger log = LoggerFactory.getLogger(EmbeddingServiceClient.class);

    @Value("${embedding.service.url:http://localhost:5001}")
    private String embeddingServiceUrl;

    @Value("${embedding.service.api-key:dev-key-change-in-production}")
    private String apiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public EmbeddingServiceClient() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    // --- Headers helper ---
    private HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-API-Key", apiKey);
        return headers;
    }

    // --- Generate embedding (async, fire-and-forget) ---
    @Async
    public CompletableFuture<Void> generateEmbedding(Long storyId, String content) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("story_id", storyId);
            body.put("content", content);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, buildHeaders());

            restTemplate.postForEntity(
                embeddingServiceUrl + "/api/embeddings/generate",
                request,
                String.class
            );

            log.info("Embedding generated for story {}", storyId);
        } catch (RestClientException e) {
            log.error("Failed to generate embedding for story {}: {}", storyId, e.getMessage());
        }
        return CompletableFuture.completedFuture(null);
    }

    // --- Semantic search ---
    public List<EmbeddingSearchResult> searchSemantic(String query, int topK, double minScore) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("query", query);
            body.put("top_k", topK);
            body.put("min_score", minScore);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, buildHeaders());

            ResponseEntity<String> response = restTemplate.postForEntity(
                embeddingServiceUrl + "/api/embeddings/search",
                request,
                String.class
            );

            JsonNode json = objectMapper.readTree(response.getBody());
            List<EmbeddingSearchResult> results = new ArrayList<>();

            for (JsonNode item : json.get("results")) {
                EmbeddingSearchResult r = new EmbeddingSearchResult();
                r.setStoryId(item.get("story_id").asLong());
                r.setRelevanceScore(item.get("relevance_score").asDouble());
                results.add(r);
            }

            return results;

        } catch (RestClientException e) {
            log.error("Embedding service unavailable during search: {}", e.getMessage());
            return new ArrayList<>();
        } catch (Exception e) {
            log.error("Search failed: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    // --- Delete embedding ---
    @Async
    public CompletableFuture<Void> deleteEmbedding(Long storyId) {
        try {
            HttpEntity<Void> request = new HttpEntity<>(buildHeaders());
            restTemplate.exchange(
                embeddingServiceUrl + "/api/embeddings/" + storyId,
                HttpMethod.DELETE,
                request,
                String.class
            );
            log.info("Embedding deleted for story {}", storyId);
        } catch (RestClientException e) {
            log.error("Failed to delete embedding for story {}: {}", storyId, e.getMessage());
        }
        return CompletableFuture.completedFuture(null);
    }

    // --- Health check ---
    public boolean isServiceHealthy() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(
                embeddingServiceUrl + "/api/embeddings/health",
                String.class
            );
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            return false;
        }
    }
}
