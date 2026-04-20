package com.paltform.VoicesOfSyria.Service;

import com.paltform.VoicesOfSyria.Dto.EmbeddingSearchResult;
import com.paltform.VoicesOfSyria.Model.Story;
import com.paltform.VoicesOfSyria.Repo.StoryRepo;


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    private static final int MIN_STORIES = 3;
    private static final int MAX_STORIES = 10;
    private static final double MIN_SCORE = 0.4;

    private final EmbeddingServiceClient embeddingClient;
    private final StoryRepo storyRepo;

String apiKey = System.getenv("OPENROUTER_API_KEY");

    public ChatService(EmbeddingServiceClient embeddingClient, StoryRepo storyRepo) {
        this.embeddingClient = embeddingClient;
        this.storyRepo = storyRepo;
    }

    /**
     * Searches for relevant stories and builds context for the LLM.
     * Returns a list of story maps ready to be sent to the Embedding Service.
     * Returns empty list if no relevant stories found (score < MIN_SCORE).
     */
    public List<Map<String, Object>> buildChatContext(String question) {
        List<EmbeddingSearchResult> searchResults =
            embeddingClient.searchSemantic(question, MAX_STORIES, MIN_SCORE);
            log.info("API KEY = {}", apiKey);

        if (searchResults.isEmpty()) {
            log.info("No relevant stories found for question: {}", question);
            return Collections.emptyList();
        }

        // Fetch story content from H2
        List<Long> ids = searchResults.stream()
            .map(EmbeddingSearchResult::getStoryId)
            .collect(Collectors.toList());

        List<Story> stories = storyRepo.findAllById(ids);

        // Build score lookup map
        Map<Long, Double> scoreMap = searchResults.stream()
            .collect(Collectors.toMap(
                EmbeddingSearchResult::getStoryId,
                EmbeddingSearchResult::getRelevanceScore
            ));

        // Map to context objects, sort by score, cap at MAX_STORIES
        List<Map<String, Object>> context = stories.stream()
            .map(story -> {
                // Build content: prefer transcript for AUDIO/VIDEO, fallback to textContent
                String content = "";
                if (story.getTranscript() != null && !story.getTranscript().isEmpty()) {
                    content = story.getTranscript();
                    // Append textContent/description if also available
                    if (story.getTextContent() != null && !story.getTextContent().isEmpty()) {
                        content += "\n\n" + story.getTextContent();
                    }
                } else if (story.getTextContent() != null) {
                    content = story.getTextContent();
                }

                Map<String, Object> m = new HashMap<>();
                m.put("story_id", story.getId());
                m.put("title", story.getTitle() != null ? story.getTitle() : "");
                m.put("content", content);
                m.put("relevance_score", scoreMap.getOrDefault(story.getId(), 0.0));
                return m;
            })
            .sorted((a, b) -> Double.compare(
                (Double) b.get("relevance_score"),
                (Double) a.get("relevance_score")
            ))
            .limit(MAX_STORIES)
            .collect(Collectors.toList());

        log.info("Built chat context with {} stories for question: {}", context.size(), question);
        return context;
    }

    /**
     * Detects language based on Unicode character ranges.
     * Returns "ar" if Arabic characters are dominant, "en" otherwise.
     */
    public String detectLanguage(String text) {
        if (text == null || text.isBlank()) return "ar";

        long arabicChars = text.chars()
            .filter(c -> c >= 0x0600 && c <= 0x06FF)
            .count();

        long latinChars = text.chars()
            .filter(c -> (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z'))
            .count();

        return arabicChars >= latinChars ? "ar" : "en";
    }
}
