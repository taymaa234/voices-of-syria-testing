package com.paltform.VoicesOfSyria.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.paltform.VoicesOfSyria.Dto.TranscriptionResponse;
import com.paltform.VoicesOfSyria.Service.TranscriptionService;

@RestController
@RequestMapping("/api/transcription")
public class TranscriptionController {

    private final TranscriptionService transcriptionService;

    public TranscriptionController(TranscriptionService transcriptionService) {
        this.transcriptionService = transcriptionService;
    }

    /**
     * Transcribe audio from a story
     * POST /api/transcription/story/{id}
     */
    @PostMapping("/story/{id}")
    public ResponseEntity<TranscriptionResponse> transcribeStory(@PathVariable Long id) {
        TranscriptionResponse response = transcriptionService.transcribeStory(id);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            // Return appropriate status based on error
            if (response.getError() != null) {
                if (response.getError().contains("not found")) {
                    return ResponseEntity.notFound().build();
                } else if (response.getError().contains("unavailable")) {
                    return ResponseEntity.status(503).body(response);
                }
            }
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
 * Get transcription status for a story (public endpoint for polling)
 * GET /api/transcription/story/{id}/status
 */
@GetMapping("/story/{id}/status")
public ResponseEntity<java.util.Map<String, Object>> getTranscriptionStatus(@PathVariable Long id) {
    java.util.Map<String, Object> result = transcriptionService.getTranscriptionStatus(id);
    if ("not_found".equals(result.get("status"))) {
        return ResponseEntity.notFound().build();
    }
    return ResponseEntity.ok(result);
}


    /**
     * Check transcription service health
     * GET /api/transcription/health
     */
    @GetMapping("/health")
    public ResponseEntity<Object> checkHealth() {
        boolean healthy = transcriptionService.isServiceHealthy();
        if (healthy) {
            return ResponseEntity.ok().body(java.util.Map.of(
                    "status", "healthy",
                    "message", "Transcription service is available"));
        } else {
            return ResponseEntity.status(503).body(java.util.Map.of(
                    "status", "unavailable",
                    "message", "Transcription service is not available"));
        }
    }
}
