package com.paltform.VoicesOfSyria.Controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import com.paltform.VoicesOfSyria.Dto.AddCommentRequest;
import com.paltform.VoicesOfSyria.Dto.CommentDto;
import com.paltform.VoicesOfSyria.Model.User;
import com.paltform.VoicesOfSyria.Repo.UserRepo;
import com.paltform.VoicesOfSyria.Service.CommentService;

import jakarta.validation.Valid;

@RestController
public class CommentController {

    private final CommentService commentService;
    private final UserRepo userRepo;

    public CommentController(CommentService commentService, UserRepo userRepo) {
        this.commentService = commentService;
        this.userRepo = userRepo;
    }

    /**
     * جلب تعليقات قصة معينة 
     */
    @GetMapping("/public/comments/story/{storyId}")
    public ResponseEntity<List<CommentDto>> getCommentsByStory(@PathVariable Long storyId) {
        List<CommentDto> comments = commentService.getCommentsByStory(storyId);
        return ResponseEntity.ok(comments);
    }

    /**
     * إضافة تعليق (عام - للزوار والمسجلين)
     */
    @PostMapping("/public/comments/story/{storyId}")
    public ResponseEntity<?> addComment(
            @PathVariable Long storyId,
            @Valid @RequestBody AddCommentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = null;
            if (userDetails != null) {
                user = userRepo.findByEmail(userDetails.getUsername()).orElse(null);
            }

            // التحقق من اسم الزائر إذا لم يكن مسجل
            if (user == null && (request.getAuthorName() == null || request.getAuthorName().trim().isEmpty())) {
                return ResponseEntity.badRequest().body("الاسم مطلوب للزوار");
            }

            CommentDto comment = commentService.addComment(
                    storyId,
                    request.getContent(),
                    request.getAuthorName(),
                    user
            );
            return ResponseEntity.ok(comment);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * حذف تعليق (للمستخدم صاحب التعليق أو الأدمن)
     */
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<?> deleteComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            if (userDetails == null) {
                return ResponseEntity.status(401).body("يجب تسجيل الدخول لحذف التعليق");
            }

            User user = userRepo.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("المستخدم غير موجود"));

            commentService.deleteComment(commentId, user);
            return ResponseEntity.ok("تم حذف التعليق بنجاح");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * حذف تعليق بواسطة الأدمن
     */
    @DeleteMapping("/admin/comments/{commentId}")
    public ResponseEntity<?> deleteCommentByAdmin(@PathVariable Long commentId) {
        try {
            commentService.deleteCommentByAdmin(commentId);
            return ResponseEntity.ok("تم حذف التعليق بنجاح");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * جلب عدد التعليقات على قصة
     */
    @GetMapping("/public/comments/story/{storyId}/count")
    public ResponseEntity<Long> getCommentsCount(@PathVariable Long storyId) {
        return ResponseEntity.ok(commentService.getCommentsCount(storyId));
    }

    /**
     * حذف تعليق بواسطة الضيف باستخدام التوكن
     */
    @DeleteMapping("/public/comments/{commentId}")
    public ResponseEntity<?> deleteGuestComment(
            @PathVariable Long commentId,
            @RequestParam String deleteToken) {
        try {
            commentService.deleteGuestComment(commentId, deleteToken);
            return ResponseEntity.ok("تم حذف التعليق بنجاح");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
