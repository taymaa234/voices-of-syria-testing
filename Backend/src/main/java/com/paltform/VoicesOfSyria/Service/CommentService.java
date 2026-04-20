package com.paltform.VoicesOfSyria.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import com.paltform.VoicesOfSyria.Dto.CommentDto;
import com.paltform.VoicesOfSyria.Enum.UserRole;
import com.paltform.VoicesOfSyria.Model.Comment;
import com.paltform.VoicesOfSyria.Model.Story;
import com.paltform.VoicesOfSyria.Model.User;
import com.paltform.VoicesOfSyria.Repo.CommentRepo;
import com.paltform.VoicesOfSyria.Repo.StoryRepo;

@Service
public class CommentService {

    private final CommentRepo commentRepo;
    private final StoryRepo storyRepo;

    public CommentService(CommentRepo commentRepo, StoryRepo storyRepo) {
        this.commentRepo = commentRepo;
        this.storyRepo = storyRepo;
    }

    /**
     * إضافة تعليق جديد
     */
    public CommentDto addComment(Long storyId, String content, String authorName, User user) {
        Story story = storyRepo.findById(storyId)
                .orElseThrow(() -> new RuntimeException("القصة غير موجودة"));

        // تنظيف المحتوى من XSS
        String sanitizedContent = HtmlUtils.htmlEscape(content.trim());

        Comment comment = new Comment();
        comment.setContent(sanitizedContent);
        comment.setStory(story);
        comment.setCreatedAt(LocalDateTime.now());

        String deleteToken = null;
        if (user != null) {
            // مستخدم مسجل - لا نخزن اسمه بشكل مباشر، بل نعتمد على كائن المستخدم
            comment.setUser(user);
        } else {
            // زائر - إنشاء توكن للحذف
            if (authorName == null || authorName.trim().isEmpty()) {
                throw new RuntimeException("الاسم مطلوب للزوار");
            }
            comment.setAuthorName(HtmlUtils.htmlEscape(authorName.trim()));
            deleteToken = UUID.randomUUID().toString().replace("-", "");
            comment.setDeleteToken(deleteToken);
        }

        Comment saved = commentRepo.save(comment);
        return toDto(saved, deleteToken != null); // إرجاع التوكن فقط عند الإنشاء
    }

    /**
     * جلب تعليقات قصة معينة
     */
    public List<CommentDto> getCommentsByStory(Long storyId) {
        return commentRepo.findByStoryIdOrderByCreatedAtDesc(storyId)
                .stream()
                .map(c -> toDto(c, false)) // لا نرجع التوكن عند الجلب
                .collect(Collectors.toList());
    }

    /**
     * حذف تعليق
     */
    public void deleteComment(Long commentId, User requestingUser) {
        Comment comment = commentRepo.findById(commentId)
                .orElseThrow(() -> new RuntimeException("التعليق غير موجود"));

        // التحقق من الصلاحيات
        boolean isOwner = comment.getUser() != null && 
                          comment.getUser().getId().equals(requestingUser.getId());
        boolean isAdmin = requestingUser.getRole() == UserRole.ADMIN || 
                          requestingUser.getRole() == UserRole.SUPER_ADMIN;

        if (!isOwner && !isAdmin) {
            throw new RuntimeException("غير مصرح لك بحذف هذا التعليق");
        }

        commentRepo.delete(comment);
    }

    /**
     * حذف تعليق بواسطة الأدمن
     */
    public void deleteCommentByAdmin(Long commentId) {
        Comment comment = commentRepo.findById(commentId)
                .orElseThrow(() -> new RuntimeException("التعليق غير موجود"));
        commentRepo.delete(comment);
    }

    /**
     * حذف تعليق بواسطة الضيف باستخدام التوكن
     */
    public void deleteGuestComment(Long commentId, String deleteToken) {
        Comment comment = commentRepo.findById(commentId)
                .orElseThrow(() -> new RuntimeException("التعليق غير موجود"));

        // التحقق من أن التعليق للضيف وليس لمستخدم مسجل
        if (comment.getUser() != null) {
            throw new RuntimeException("هذا التعليق لمستخدم مسجل");
        }

        // التحقق من التوكن
        if (comment.getDeleteToken() == null || !comment.getDeleteToken().equals(deleteToken)) {
            throw new RuntimeException("غير مصرح لك بحذف هذا التعليق");
        }

        commentRepo.delete(comment);
    }

    /**
     * جلب كل التعليقات (للأدمن)
     */
    public List<CommentDto> getAllComments() {
        return commentRepo.findAll()
                .stream()
                .map(c -> toDto(c, false))
                .collect(Collectors.toList());
    }

    /**
     * عدد التعليقات على قصة
     */
    public long getCommentsCount(Long storyId) {
        return commentRepo.countByStoryId(storyId);
    }

    /**
     * تحويل Comment إلى CommentDto
     */
    private CommentDto toDto(Comment comment, boolean includeDeleteToken) {
        CommentDto dto = new CommentDto();
        dto.setId(comment.getId());
        dto.setContent(comment.getContent());
        dto.setAuthorName(comment.getUser() != null ? comment.getUser().getName() : comment.getAuthorName());
        dto.setUserId(comment.getUser() != null ? comment.getUser().getId() : null);
        dto.setStoryId(comment.getStory().getId());
        dto.setStoryTitle(comment.getStory().getTitle());
        dto.setCreatedAt(comment.getCreatedAt());
        // إرجاع التوكن فقط عند إنشاء تعليق الضيف
        if (includeDeleteToken && comment.getDeleteToken() != null) {
            dto.setDeleteToken(comment.getDeleteToken());
        }
        return dto;
    }
}
