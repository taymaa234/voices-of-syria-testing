package com.paltform.VoicesOfSyria.Model;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.paltform.VoicesOfSyria.Enum.Province;
import com.paltform.VoicesOfSyria.Enum.StoryStatus;
import com.paltform.VoicesOfSyria.Enum.StoryType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "stories")
@Data
public class Story {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(length = 5000)
    private String textContent;

    private String mediaUrl;

    @Enumerated(EnumType.STRING)
    private StoryType type;

    @Enumerated(EnumType.STRING)
    private StoryStatus status = StoryStatus.PENDING;

    private LocalDateTime publishDate;

    private LocalDateTime updatedAt;

    private String attacker;

    private LocalDate incidentDate;

    @Enumerated(EnumType.STRING)
    private Province province;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties("stories")
    private User author;

    String adminMessage;

    @Column(columnDefinition = "TEXT")
    private String transcript;

    @Column(length = 10)
    private String transcriptLanguage;

    private LocalDateTime transcribedAt;

}
