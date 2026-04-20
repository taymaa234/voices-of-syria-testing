package com.paltform.VoicesOfSyria.Dto;

import com.paltform.VoicesOfSyria.Model.Bookmark;
import java.time.LocalDateTime;

public class BookmarkDto {
    
    private Long id;
    private Long storyId;
    private String storyTitle;
    private String storyType;
    private String storyProvince;
    private String authorName;
    private LocalDateTime createdAt;
    
    // Constructors
    public BookmarkDto() {
    }
    
    public BookmarkDto(Bookmark bookmark) {
        this.id = bookmark.getId();
        this.storyId = bookmark.getStory().getId();
        this.storyTitle = bookmark.getStory().getTitle();
        this.storyType = bookmark.getStory().getType() != null 
            ? bookmark.getStory().getType().name() : null;
        this.storyProvince = bookmark.getStory().getProvince() != null 
            ? bookmark.getStory().getProvince().name() : null;
        this.authorName = bookmark.getStory().getAuthor() != null 
            ? bookmark.getStory().getAuthor().getName() : "Anonymous";
        this.createdAt = bookmark.getCreatedAt();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getStoryId() {
        return storyId;
    }
    
    public void setStoryId(Long storyId) {
        this.storyId = storyId;
    }
    
    public String getStoryTitle() {
        return storyTitle;
    }
    
    public void setStoryTitle(String storyTitle) {
        this.storyTitle = storyTitle;
    }
    
    public String getStoryType() {
        return storyType;
    }
    
    public void setStoryType(String storyType) {
        this.storyType = storyType;
    }
    
    public String getStoryProvince() {
        return storyProvince;
    }
    
    public void setStoryProvince(String storyProvince) {
        this.storyProvince = storyProvince;
    }
    
    public String getAuthorName() {
        return authorName;
    }
    
    public void setAuthorName(String authorName) {
        this.authorName = authorName;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
