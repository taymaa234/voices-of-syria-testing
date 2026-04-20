package com.paltform.VoicesOfSyria.Model;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "comments")
@Data
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 1000)
    private String content;

    @Column(nullable = true) // يمكن أن يكون فارغًا إذا كان التعليق لمستخدم مسجل
    private String authorName; // اسم الكاتب (للزوار أو المسجلين)

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"stories", "password", "verificationCode"})
    private User user; // null للزوار غير المسجلين

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "story_id", nullable = false)
    @JsonIgnoreProperties({"author", "textContent", "mediaUrl"})
    private Story story;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(length = 64)
    private String deleteToken; // توكن لحذف تعليقات الضيوف
}
