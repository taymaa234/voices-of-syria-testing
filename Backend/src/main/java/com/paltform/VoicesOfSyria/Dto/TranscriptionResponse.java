package com.paltform.VoicesOfSyria.Dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TranscriptionResponse {
    private boolean success;
    private String transcript;
    private String language;
    private Double duration;
    private Double processingTime;
    private String error;

    // Constructor for success response
    public static TranscriptionResponse success(String transcript, String language, Double duration, Double processingTime) {
        TranscriptionResponse response = new TranscriptionResponse();
        response.setSuccess(true);
        response.setTranscript(transcript);
        response.setLanguage(language);
        response.setDuration(duration);
        response.setProcessingTime(processingTime);
        return response;
    }

    // Constructor for error response
    public static TranscriptionResponse error(String errorMessage) {
        TranscriptionResponse response = new TranscriptionResponse();
        response.setSuccess(false);
        response.setError(errorMessage);
        return response;
    }
}
