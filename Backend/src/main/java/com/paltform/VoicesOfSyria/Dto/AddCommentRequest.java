package com.paltform.VoicesOfSyria.Dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AddCommentRequest {
    
    @NotBlank(message = "محتوى التعليق مطلوب")
    @Size(max = 1000, message = "التعليق يجب أن لا يتجاوز 1000 حرف")
    private String content;
    
    private String authorName; // مطلوب للزوار فقط
}
