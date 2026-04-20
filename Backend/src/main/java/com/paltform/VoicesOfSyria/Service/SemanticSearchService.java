package com.paltform.VoicesOfSyria.Service;

import com.paltform.VoicesOfSyria.Dto.EmbeddingSearchResult;
import com.paltform.VoicesOfSyria.Dto.StoryDTO;
import com.paltform.VoicesOfSyria.Enum.StoryStatus;
import com.paltform.VoicesOfSyria.Model.Story;
import com.paltform.VoicesOfSyria.Repo.StoryRepo;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SemanticSearchService {

    private static final int MAX_RESULTS = 20;
    private static final double MIN_SCORE = 0.5;

    private final EmbeddingServiceClient embeddingClient;
    private final StoryRepo storyRepo;

    public SemanticSearchService(EmbeddingServiceClient embeddingClient, StoryRepo storyRepo) {
        this.embeddingClient = embeddingClient;
        this.storyRepo = storyRepo;
    }

    public List<StoryDTO> search(String query) {

        // 1. اجلب IDs من Embedding Service
        List<EmbeddingSearchResult> searchResults =
            embeddingClient.searchSemantic(query, MAX_RESULTS, MIN_SCORE);

        if (searchResults.isEmpty()) {
            return new ArrayList<>();
        }

        // 2. اجلب القصص من H2 بالـ IDs
        List<Long> storyIds = searchResults.stream()
            .map(r -> r.getStoryId())
            .collect(Collectors.toList());

        List<Story> stories = storyRepo.findAllById(storyIds);

        // 3. ابني map من ID → relevanceScore للربط السريع
        Map<Long, Double> scoreMap = searchResults.stream()
            .collect(Collectors.toMap(
                r -> r.getStoryId(),
                r -> r.getRelevanceScore()
            ));

        // 4. حوّل لـ DTOs، فلتر APPROVED فقط، ورتّب حسب الصلة
        return stories.stream()
            .filter(s -> StoryStatus.APPROVED.equals(s.getStatus()))
            .map(story -> {
                StoryDTO dto = new StoryDTO();
                dto.setTitle(story.getTitle());
                dto.setTextContent(story.getTextContent());
                dto.setType(story.getType());
                dto.setProvince(story.getProvince());
                dto.setIncidentDate(story.getIncidentDate());
                dto.setAttacker(story.getAttacker());
                dto.setRelevanceScore(scoreMap.getOrDefault(story.getId(), 0.0));
                return dto;
            })
            .sorted((a, b) -> Double.compare(b.getRelevanceScore(), a.getRelevanceScore()))
            .collect(Collectors.toList());
    }
}
