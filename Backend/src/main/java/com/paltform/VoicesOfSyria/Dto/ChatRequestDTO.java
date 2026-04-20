package com.paltform.VoicesOfSyria.Dto;

import java.util.List;
import java.util.Map;

import lombok.Data;
@Data
public class ChatRequestDTO {
    private String question;
    private List<Map<String, String>> chatHistory;
   
}
