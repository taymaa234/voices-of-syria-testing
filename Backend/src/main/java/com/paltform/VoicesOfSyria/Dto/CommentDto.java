package com.paltform.VoicesOfSyria.Dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommentDto {
    private Long id;
    private String content;
    private String authorName;
    private Long userId;
    private Long storyId;
    private String storyTitle;
    private LocalDateTime createdAt;
    private String deleteToken; // فقط للضيوف عند إنشاء التعليق
}
