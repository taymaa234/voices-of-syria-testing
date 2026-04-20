package com.paltform.VoicesOfSyria.Repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.paltform.VoicesOfSyria.Model.Comment;

@Repository
public interface CommentRepo extends JpaRepository<Comment, Long> {
    
    // جلب تعليقات قصة معينة مرتبة من الأحدث للأقدم
    List<Comment> findByStoryIdOrderByCreatedAtDesc(Long storyId);
    
    // جلب تعليقات مستخدم معين
    List<Comment> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    // عدد التعليقات على قصة معينة
    long countByStoryId(Long storyId);
    
    // حذف جميع التعليقات المرتبطة بقصة معينة
    @Modifying
    @Transactional
    @Query("DELETE FROM Comment c WHERE c.story.id = :storyId")
    void deleteByStoryId(@Param("storyId") Long storyId);
}
