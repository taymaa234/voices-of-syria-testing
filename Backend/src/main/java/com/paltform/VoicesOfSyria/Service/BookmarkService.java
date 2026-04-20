package com.paltform.VoicesOfSyria.Service;

import com.paltform.VoicesOfSyria.Dto.BookmarkDto;
import com.paltform.VoicesOfSyria.Model.Bookmark;
import com.paltform.VoicesOfSyria.Model.Story;
import com.paltform.VoicesOfSyria.Model.User;
import com.paltform.VoicesOfSyria.Repo.BookmarkRepo;
import com.paltform.VoicesOfSyria.Repo.StoryRepo;
import com.paltform.VoicesOfSyria.Repo.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class BookmarkService {
    
    @Autowired
    private BookmarkRepo bookmarkRepo;
    
    @Autowired
    private UserRepo userRepo;
    
    @Autowired
    private StoryRepo storyRepo;
    
    /**
     * Add a bookmark for a user and story
     * Returns existing bookmark if already exists (idempotent)
     */
    @Transactional
    public BookmarkDto addBookmark(Long userId, Long storyId) {
        // Check if bookmark already exists
        Optional<Bookmark> existing = bookmarkRepo.findByUserIdAndStoryId(userId, storyId);
        if (existing.isPresent()) {
            return new BookmarkDto(existing.get());
        }
        
        // Get user and story
        User user = userRepo.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        Story story = storyRepo.findById(storyId)
            .orElseThrow(() -> new RuntimeException("Story not found"));
        
        // Create and save bookmark
        Bookmark bookmark = new Bookmark(user, story);
        bookmark = bookmarkRepo.save(bookmark);
        
        return new BookmarkDto(bookmark);
    }
    
    /**
     * Remove a bookmark
     * Does nothing if bookmark doesn't exist (idempotent)
     */
    @Transactional
    public void removeBookmark(Long userId, Long storyId) {
        bookmarkRepo.deleteByUserIdAndStoryId(userId, storyId);
    }
    
    /**
     * Get all bookmarks for a user
     */
    public List<BookmarkDto> getUserBookmarks(Long userId) {
        List<Bookmark> bookmarks = bookmarkRepo.findByUserIdOrderByCreatedAtDesc(userId);
        return bookmarks.stream()
            .map(BookmarkDto::new)
            .collect(Collectors.toList());
    }
    
    /**
     * Check if a story is bookmarked by a user
     */
    public boolean isBookmarked(Long userId, Long storyId) {
        return bookmarkRepo.existsByUserIdAndStoryId(userId, storyId);
    }
    
    /**
     * Get list of bookmarked story IDs for a user
     */
    public List<Long> getBookmarkedStoryIds(Long userId) {
        return bookmarkRepo.findStoryIdsByUserId(userId);
    }
    
    /**
     * Get bookmark count for a user
     */
    public long getBookmarkCount(Long userId) {
        return bookmarkRepo.countByUserId(userId);
    }
    
    /**
     * Toggle bookmark status
     * Returns true if bookmarked, false if unbookmarked
     */
    @Transactional
    public boolean toggleBookmark(Long userId, Long storyId) {
        if (bookmarkRepo.existsByUserIdAndStoryId(userId, storyId)) {
            bookmarkRepo.deleteByUserIdAndStoryId(userId, storyId);
            return false;
        } else {
            addBookmark(userId, storyId);
            return true;
        }
    }
}
