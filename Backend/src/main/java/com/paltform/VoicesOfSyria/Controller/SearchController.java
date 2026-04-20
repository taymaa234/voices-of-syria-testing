package com.paltform.VoicesOfSyria.Controller;

import com.paltform.VoicesOfSyria.Dto.StoryDTO;
import com.paltform.VoicesOfSyria.Service.SemanticSearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/public/api/search")
public class SearchController {

    private final SemanticSearchService searchService;

    public SearchController(SemanticSearchService searchService) {
        this.searchService = searchService;
    }

    @GetMapping("/semantic")
    public ResponseEntity<?> semanticSearch(@RequestParam String query) {

        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Query cannot be empty"));
        }

        List<StoryDTO> results = searchService.search(query);

        if (results.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                "results", results,
                "message", "No stories found matching your query"
            ));
        }

        return ResponseEntity.ok(results);
    }
}
