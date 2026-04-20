package com.paltform.VoicesOfSyria.Repo;

import com.paltform.VoicesOfSyria.Model.Bookmark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookmarkRepo extends JpaRepository<Bookmark, Long> {
    
    // Find all bookmarks for a user, ordered by creation date (newest first)
    List<Bookmark> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    // Find a specific bookmark by user and story
    Optional<Bookmark> findByUserIdAndStoryId(Long userId, Long storyId);
    
    // Check if a bookmark exists
    boolean existsByUserIdAndStoryId(Long userId, Long storyId);
    
    // Delete a bookmark by user and story
    @Modifying
    @Query("DELETE FROM Bookmark b WHERE b.user.id = :userId AND b.story.id = :storyId")
    void deleteByUserIdAndStoryId(@Param("userId") Long userId, @Param("storyId") Long storyId);
    
    // Delete all bookmarks for a story (when story is deleted)
    @Modifying
    @Query("DELETE FROM Bookmark b WHERE b.story.id = :storyId")
    void deleteByStoryId(@Param("storyId") Long storyId);
    
    // Get list of bookmarked story IDs for a user
    @Query("SELECT b.story.id FROM Bookmark b WHERE b.user.id = :userId")
    List<Long> findStoryIdsByUserId(@Param("userId") Long userId);
    
    // Count bookmarks for a user
    long countByUserId(Long userId);
}
