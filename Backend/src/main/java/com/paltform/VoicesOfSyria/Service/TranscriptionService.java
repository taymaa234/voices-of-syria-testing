package com.paltform.VoicesOfSyria.Service;

import java.io.File;
import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.paltform.VoicesOfSyria.Dto.TranscriptionResponse;
import com.paltform.VoicesOfSyria.Model.Story;
import com.paltform.VoicesOfSyria.Repo.StoryRepo;

@Service
public class TranscriptionService {

    @Value("${transcription.service.url:http://localhost:5000}")
    private String transcriptionServiceUrl;

    @Value("${upload.path:uploads/stories}")
    private String uploadPath;

    @Autowired
    private EmbeddingServiceClient embeddingClient;

    private final StoryRepo storyRepo;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public TranscriptionService(StoryRepo storyRepo) {
        this.storyRepo = storyRepo;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Called automatically when admin approves an AUDIO/VIDEO story.
     * Runs in a separate thread - caller gets response immediately.
     */
    @Async
    public void transcribeAsync(Long storyId) {
        System.out.println("=================================================");
        System.out.println("🎤 [ASYNC] Starting transcription for story ID: " + storyId);
        System.out.println("=================================================");
        try {
            TranscriptionResponse response = transcribeStory(storyId);
            if (response.isSuccess()) {
                System.out.println("✅ [ASYNC] Transcription done for story ID: " + storyId);
            } else {
                System.err.println("❌ [ASYNC] Transcription failed for story ID: " + storyId + " - " + response.getError());
            }
        } catch (Exception e) {
            System.err.println("❌ [ASYNC] Exception for story ID: " + storyId + " - " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Transcribe audio or video from a story (synchronous).
     * Returns existing transcript if available, otherwise calls Whisper service.
     */
    public TranscriptionResponse transcribeStory(Long storyId) {
        Story story = storyRepo.findById(storyId).orElse(null);
        if (story == null) {
            return TranscriptionResponse.error("Story not found");
        }

        // Return cached transcript if exists
        if (story.getTranscript() != null && !story.getTranscript().isEmpty()) {
            System.out.println("📄 [TRANSCRIPTION] Returning existing transcript for story ID: " + storyId);
            return TranscriptionResponse.success(story.getTranscript(), story.getTranscriptLanguage(), null, null);
        }

        // Validate type
        if (story.getType() == null ||
                !(story.getType().name().equals("AUDIO") || story.getType().name().equals("VIDEO"))) {
            return TranscriptionResponse.error("Story type is not supported for transcription");
        }

        // Validate media URL
        if (story.getMediaUrl() == null || story.getMediaUrl().isEmpty()) {
            return TranscriptionResponse.error("No media file found for this story");
        }

        // Resolve file path
        String mediaUrl = story.getMediaUrl();
        String filename = mediaUrl.substring(mediaUrl.lastIndexOf('/') + 1);
        String fullFilePath = System.getProperty("user.dir") + File.separator + uploadPath + File.separator + filename;

        System.out.println("📁 [TRANSCRIPTION] Resolving file: " + fullFilePath);

        File mediaFile = new File(fullFilePath);
        if (!mediaFile.exists()) {
            System.err.println("❌ [TRANSCRIPTION] File not found: " + fullFilePath);
            return TranscriptionResponse.error("Media file not found on server: " + fullFilePath);
        }

        try {
            TranscriptionResponse response = callWhisperService(mediaFile);

            if (response.isSuccess()) {
                story.setTranscript(response.getTranscript());
                story.setTranscriptLanguage(response.getLanguage());
                story.setTranscribedAt(LocalDateTime.now());
                storyRepo.save(story);

                String content = buildEmbeddingContent(response.getTranscript(), story.getTextContent());
                if (content != null && !content.isEmpty()) {
                    embeddingClient.generateEmbedding(story.getId(), content);
                }
            }

            return response;
        } catch (Exception e) {
            return TranscriptionResponse.error("Transcription service error: " + e.getMessage());
        }
    }

    public boolean isServiceHealthy() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(transcriptionServiceUrl + "/health", String.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            return false;
        }
    }

    private TranscriptionResponse callWhisperService(File mediaFile) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new FileSystemResource(mediaFile));

            ResponseEntity<String> response = restTemplate.postForEntity(
                    transcriptionServiceUrl + "/transcribe",
                    new HttpEntity<>(body, headers),
                    String.class);

            JsonNode json = objectMapper.readTree(response.getBody());

            if (json.has("success") && json.get("success").asBoolean()) {
                return TranscriptionResponse.success(
                        json.get("transcript").asText(),
                        json.has("language") ? json.get("language").asText() : "unknown",
                        json.has("duration") ? json.get("duration").asDouble() : null,
                        json.has("processing_time") ? json.get("processing_time").asDouble() : null);
            } else {
                String error = json.has("error") ? json.get("error").asText() : "Unknown transcription error";
                System.err.println("❌ [TRANSCRIPTION] Whisper error: " + error);
                return TranscriptionResponse.error(error);
            }
        } catch (RestClientException e) {
            System.err.println("❌ [TRANSCRIPTION] Service unavailable: " + e.getMessage());
            return TranscriptionResponse.error("Transcription service is unavailable. Please try again later.");
        } catch (Exception e) {
            System.err.println("❌ [TRANSCRIPTION] Exception: " + e.getMessage());
            return TranscriptionResponse.error("Failed to process transcription: " + e.getMessage());
        }
    }

    private String buildEmbeddingContent(String transcript, String description) {
        StringBuilder sb = new StringBuilder();
        if (transcript != null && !transcript.isEmpty()) sb.append(transcript);
        if (description != null && !description.isEmpty()) {
            if (sb.length() > 0) sb.append("\n\n");
            sb.append(description);
        }
        return sb.toString();
    }

    /**
 * Returns transcription status for a story.
 * Used by the frontend to poll until transcription is complete.
 */
public java.util.Map<String, Object> getTranscriptionStatus(Long storyId) {
    Story story = storyRepo.findById(storyId).orElse(null);
    if (story == null) {
        return java.util.Map.of("status", "not_found");
    }
    if (story.getTranscript() != null && !story.getTranscript().isEmpty()) {
        return java.util.Map.of(
            "status", "done",
            "transcript", story.getTranscript(),
            "language", story.getTranscriptLanguage() != null ? story.getTranscriptLanguage() : "ar"
        );
    }
    return java.util.Map.of("status", "pending");
}

}
