package com.paltform.VoicesOfSyria.Repo;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.paltform.VoicesOfSyria.Model.Story;
import com.paltform.VoicesOfSyria.Model.User;

import com.paltform.VoicesOfSyria.Enum.Province;
import com.paltform.VoicesOfSyria.Enum.StoryStatus;
import com.paltform.VoicesOfSyria.Enum.StoryType;

public interface StoryRepo extends JpaRepository<Story, Long> {
    List<Story> findByAuthor(User author);

    List<Story> findByAttacker(String attacker);

    List<Story> findByProvince(Province province);

    List<Story> findByStatus(StoryStatus status);

    @Query("SELECT s FROM Story s JOIN FETCH s.author WHERE s.status = :status")
    List<Story> findByStatusWithAuthor(@Param("status") StoryStatus status);

    List<Story> findByType(StoryType type);

    List<Story> findByPublishDate(LocalDateTime publishDate);

    List<Story> findByIncidentDate(LocalDate incidentDate);

    List<Story> findByTitle(String title);

    List<Story> findByTextContent(String textContent);

    List<Story> findByMediaUrl(String mediaUrl);
}
