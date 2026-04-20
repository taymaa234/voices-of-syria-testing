package com.paltform.VoicesOfSyria.Controller;

import com.paltform.VoicesOfSyria.Enum.StoryStatus;
import com.paltform.VoicesOfSyria.Model.Story;
import com.paltform.VoicesOfSyria.Service.StoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/public/stories")
public class VisitorController {

    @Autowired
    private StoryService storyService;

    @Autowired
    private com.paltform.VoicesOfSyria.Repo.StoryRepo storyRepo;

    @GetMapping
    public ResponseEntity<List<Story>> getApprovedStories() {
        try {
            List<Story> approvedStories = storyService.getStoriesByStatus(StoryStatus.APPROVED);
            return ResponseEntity.ok(approvedStories);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Story> getStoryById(@PathVariable Long id) {
        try {
            Optional<Story> storyOpt = storyRepo.findById(id);

            if (storyOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Story story = storyOpt.get();

            // Only return approved stories
            if (story.getStatus() != StoryStatus.APPROVED) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(story);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
