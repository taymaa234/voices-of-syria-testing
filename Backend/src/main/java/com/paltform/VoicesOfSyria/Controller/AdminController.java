package com.paltform.VoicesOfSyria.Controller;

import com.paltform.VoicesOfSyria.Enum.StoryStatus;
import com.paltform.VoicesOfSyria.Model.Story;
import com.paltform.VoicesOfSyria.Model.User;
import com.paltform.VoicesOfSyria.Service.StoryService;
import com.paltform.VoicesOfSyria.Service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin")
public class AdminController {

    @Autowired
    private StoryService storyService;

    @Autowired
    private UserService userService;

    @GetMapping("/stories/pending")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<Story>> getPendingStories() {
        try {
            List<Story> pendingStories = storyService.getStoriesByStatus(StoryStatus.PENDING);
            return ResponseEntity.ok(pendingStories);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/stories/{id}/approve")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Story> approveStory(@PathVariable Long id) {
        try {
            Story approvedStory = storyService.approveStory(id);
            return ResponseEntity.ok(approvedStory);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/stories/{id}/reject")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Story> rejectStory(@PathVariable Long id) {
        try {
            Story rejectedStory = storyService.rejectStory(id);
            return ResponseEntity.ok(rejectedStory);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/stories/{id}/request-modification")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> requestModification(
            @PathVariable Long id,
            @RequestBody String message
    ) {
        Story updatedStory = storyService.requestModification(id, message);
        return ResponseEntity.ok(updatedStory);
    }

    /**
     * Get all registered users (USER role only)
     * GET /admin/users
     */
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        try {
            List<User> users = userService.getAllUsers();
            // Map to safe response (exclude password)
            List<Map<String, Object>> response = users.stream()
                .map(user -> Map.<String, Object>of(
                    "id", user.getId(),
                    "name", user.getName() != null ? user.getName() : "",
                    "email", user.getEmail() != null ? user.getEmail() : "",
                    "role", user.getRole() != null ? user.getRole().name() : "USER",
                    "verified", user.isVerified(),
                    "profileImageUrl", user.getProfileImageUrl() != null ? user.getProfileImageUrl() : ""
                ))
                .collect(Collectors.toList());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
