package com.paltform.VoicesOfSyria.Dto;

import java.time.LocalDate;

import com.paltform.VoicesOfSyria.Enum.Province;
import com.paltform.VoicesOfSyria.Enum.StoryType;
import lombok.Data;

@Data
public class StoryDTO {
    private Double relevanceScore;
    private String title;
    private String textContent;
    private StoryType type;
    private String attacker;
    private LocalDate incidentDate;
    private Province province;
}
