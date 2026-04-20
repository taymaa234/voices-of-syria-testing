package com.paltform.VoicesOfSyria.Controller;

import com.paltform.VoicesOfSyria.Dto.BookmarkDto;
import com.paltform.VoicesOfSyria.Model.User;
import com.paltform.VoicesOfSyria.Repo.UserRepo;
import com.paltform.VoicesOfSyria.Service.BookmarkService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookmarks")
public class BookmarkController {
    
    @Autowired
    private BookmarkService bookmarkService;
    
    @Autowired
    private UserRepo userRepo;
    
    private User getCurrentUser(UserDetails userDetails) {
        return userRepo.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new RuntimeException("User not found"));
    }
    
    /**
     * Add a story to bookmarks
     * POST /api/bookmarks/{storyId}
     */
    @PostMapping("/{storyId}")
    public ResponseEntity<BookmarkDto> addBookmark(
            @PathVariable Long storyId,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = getCurrentUser(userDetails);
            BookmarkDto bookmark = bookmarkService.addBookmark(user.getId(), storyId);
            return ResponseEntity.ok(bookmark);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Remove a story from bookmarks
     * DELETE /api/bookmarks/{storyId}
     */
    @DeleteMapping("/{storyId}")
    public ResponseEntity<Void> removeBookmark(
            @PathVariable Long storyId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        bookmarkService.removeBookmark(user.getId(), storyId);
        return ResponseEntity.ok().build();
    }
    
    /**
     * Toggle bookmark status
     * POST /api/bookmarks/toggle/{storyId}
     */
    @PostMapping("/toggle/{storyId}")
    public ResponseEntity<Map<String, Object>> toggleBookmark(
            @PathVariable Long storyId,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = getCurrentUser(userDetails);
            boolean isBookmarked = bookmarkService.toggleBookmark(user.getId(), storyId);
            Map<String, Object> response = new HashMap<>();
            response.put("bookmarked", isBookmarked);
            response.put("storyId", storyId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Get all bookmarks for the current user
     * GET /api/bookmarks
     */
    @GetMapping
    public ResponseEntity<List<BookmarkDto>> getBookmarks(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        List<BookmarkDto> bookmarks = bookmarkService.getUserBookmarks(user.getId());
        return ResponseEntity.ok(bookmarks);
    }
    
    /**
     * Check if a story is bookmarked
     * GET /api/bookmarks/check/{storyId}
     */
    @GetMapping("/check/{storyId}")
    public ResponseEntity<Map<String, Boolean>> checkBookmark(
            @PathVariable Long storyId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        boolean isBookmarked = bookmarkService.isBookmarked(user.getId(), storyId);
        Map<String, Boolean> response = new HashMap<>();
        response.put("bookmarked", isBookmarked);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get list of bookmarked story IDs
     * GET /api/bookmarks/ids
     */
    @GetMapping("/ids")
    public ResponseEntity<List<Long>> getBookmarkedIds(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        List<Long> ids = bookmarkService.getBookmarkedStoryIds(user.getId());
        return ResponseEntity.ok(ids);
    }
    
    /**
     * Get bookmark count
     * GET /api/bookmarks/count
     */
    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getBookmarkCount(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        long count = bookmarkService.getBookmarkCount(user.getId());
        Map<String, Long> response = new HashMap<>();
        response.put("count", count);
        return ResponseEntity.ok(response);
    }
}
