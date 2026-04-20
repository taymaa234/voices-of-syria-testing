package com.paltform.VoicesOfSyria.Service;

import com.paltform.VoicesOfSyria.Dto.StoryDTO;
import com.paltform.VoicesOfSyria.Enum.StoryStatus;
import com.paltform.VoicesOfSyria.Enum.StoryType;
import com.paltform.VoicesOfSyria.Model.Story;
import com.paltform.VoicesOfSyria.Model.User;
import com.paltform.VoicesOfSyria.Repo.StoryRepo;
import com.paltform.VoicesOfSyria.Repo.UserRepo;
import com.paltform.VoicesOfSyria.Repo.CommentRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class StoryService {

    @Autowired
    private StoryRepo storyRepo;

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private CommentRepo commentRepo;

    @Autowired
    private EmbeddingServiceClient embeddingClient;

    @Autowired
    private TranscriptionService transcriptionService;

    @Value("${app.upload.dir}")
    private String uploadDir;

    public Story createStory(Story story, MultipartFile file) throws IOException {
        validateStory(story);

        // Set default values
        story.setStatus(StoryStatus.PENDING);
        story.setPublishDate(LocalDateTime.now());

        // Handle file upload for AUDIO and VIDEO types
        if (file != null && !file.isEmpty()) {
            if (story.getType() == com.paltform.VoicesOfSyria.Enum.StoryType.AUDIO ||
                story.getType() == com.paltform.VoicesOfSyria.Enum.StoryType.VIDEO) {
                String fileUrl = uploadFile(file);
                story.setMediaUrl(fileUrl);
            } else {
                throw new IllegalArgumentException("File upload is only allowed for AUDIO or VIDEO stories");
            }
        }
        Story saved = storyRepo.save(story);

        // Generate embedding asynchronously AFTER save (so ID is available)
        if (saved.getType() == StoryType.TEXT && saved.getTextContent() != null) {
            embeddingClient.generateEmbedding(saved.getId(), saved.getTextContent());
        }

        return saved;

}

    

    public Story updateStory(Long id, StoryDTO updatedStory, MultipartFile file) throws IOException {
        Optional<Story> existingStoryOpt = storyRepo.findById(id);
        if (existingStoryOpt.isEmpty()) {
            throw new RuntimeException("Story not found with id: " + id);
        }

        Story existingStory = existingStoryOpt.get();

        // Update only non-null fields (partial update)
        if (updatedStory.getTitle() != null) {
            existingStory.setTitle(updatedStory.getTitle());
        }
        if (updatedStory.getTextContent() != null) {
            existingStory.setTextContent(updatedStory.getTextContent());
        }
        if (updatedStory.getType() != null) {
            existingStory.setType(updatedStory.getType());
        }
        if (updatedStory.getAttacker() != null) {
            existingStory.setAttacker(updatedStory.getAttacker());
        }
        if (updatedStory.getIncidentDate() != null) {
            existingStory.setIncidentDate(updatedStory.getIncidentDate());
        }
        if (updatedStory.getProvince() != null) {
            existingStory.setProvince(updatedStory.getProvince());
        }
        existingStory.setUpdatedAt(LocalDateTime.now());

        // 🧠 المنطق المهم
        if (existingStory.getStatus() == StoryStatus.NEEDS_MODIFICATION) {
            existingStory.setStatus(StoryStatus.PENDING);
            existingStory.setAdminMessage(null); // مسح رسالة الأدمن بعد الاستجابة
        }

        // Validate after partial update
        validateStory(existingStory);

        // Handle file upload for AUDIO and VIDEO types
        if (file != null && !file.isEmpty()) {
            if (updatedStory.getType() == com.paltform.VoicesOfSyria.Enum.StoryType.AUDIO ||
                updatedStory.getType() == com.paltform.VoicesOfSyria.Enum.StoryType.VIDEO) {
                String fileUrl = uploadFile(file);
                existingStory.setMediaUrl(fileUrl);
            } else {
                throw new IllegalArgumentException("File upload is only allowed for AUDIO or VIDEO stories");
            }
        }
        Story updated = storyRepo.save(existingStory);

        // Regenerate embedding AFTER save
        if (updated.getType() == StoryType.TEXT && updated.getTextContent() != null) {
            embeddingClient.generateEmbedding(updated.getId(), updated.getTextContent());
        }

        return updated;



    }

    public void deleteStory(Long id) {
        if (!storyRepo.existsById(id)) {
            throw new RuntimeException("Story not found with id: " + id);
        }
        
        // حذف جميع التعليقات المرتبطة بالقصة أولاً
        commentRepo.deleteByStoryId(id);
                // Remove embedding from vector database
embeddingClient.deleteEmbedding(id);
        // الآن يمكن حذف القصة بأمان
        storyRepo.deleteById(id);


    }

    public List<Story> getMyStories(Long publisherId) {
        Optional<User> userOpt = userRepo.findById(publisherId);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found with id: " + publisherId);
        }
        return storyRepo.findByAuthor(userOpt.get());
    }

    public List<Story> getStoriesByStatus(StoryStatus status) {
        return storyRepo.findByStatusWithAuthor(status);
    }

    public Story approveStory(Long id) {
        Story story = updateStoryStatus(id, StoryStatus.APPROVED);
        
        if (story.getType() == StoryType.AUDIO || story.getType() == StoryType.VIDEO) {
            System.out.println("🎤 [APPROVE] Story " + id + " is " + story.getType() + " - triggering transcription...");
            transcriptionService.transcribeAsync(id);
        }
        
        return story;
    }

    public Story rejectStory(Long id) {
        return updateStoryStatus(id, StoryStatus.REJECTED);
    }

    public Story requestModification(Long id, String message) {
        Story story = storyRepo.findById(id).orElseThrow(() -> new RuntimeException("Story not found with id: " + id));
    
        if (story.getStatus() != StoryStatus.PENDING) {
            throw new IllegalStateException("Only pending stories can be reviewed");
        }
    
        story.setStatus(StoryStatus.NEEDS_MODIFICATION);
        story.setAdminMessage(message);
        story.setUpdatedAt(LocalDateTime.now());
    
        return storyRepo.save(story);
    }
    

    private Story updateStoryStatus(Long id, StoryStatus status) {
        Optional<Story> storyOpt = storyRepo.findById(id);
        if (storyOpt.isEmpty()) {
            throw new RuntimeException("Story not found with id: " + id);
        }

        Story story = storyOpt.get();
        story.setStatus(status);
        return storyRepo.save(story);
    }

    private void validateStory(Story story) {
        if (story.getTitle() == null || story.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Story title cannot be empty");
        }

        if (story.getType() == null) {
            throw new IllegalArgumentException("Story type cannot be null");
        }

        // For TEXT stories, textContent is required
        if (story.getType() == com.paltform.VoicesOfSyria.Enum.StoryType.TEXT &&
            (story.getTextContent() == null || story.getTextContent().trim().isEmpty())) {
            throw new IllegalArgumentException("Text content is required for TEXT stories");
        }

        // For AUDIO/VIDEO stories, mediaUrl will be set after file upload
        if ((story.getType() == com.paltform.VoicesOfSyria.Enum.StoryType.AUDIO ||
             story.getType() == com.paltform.VoicesOfSyria.Enum.StoryType.VIDEO) &&
            story.getMediaUrl() == null) {
            // This will be validated during file upload
        }
    }

    private String uploadFile(MultipartFile file) throws IOException {
        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null ||
            (!contentType.startsWith("audio/") && !contentType.startsWith("video/"))) {
            throw new IllegalArgumentException("Only audio and video files are allowed");
        }

        // Create upload directory if it doesn't exist
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Generate unique filename
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        String uniqueFilename = System.currentTimeMillis() + "_" + originalFilename;

        // Copy file to destination
        Path filePath = uploadPath.resolve(uniqueFilename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // Return public URL (assuming the uploads directory is served statically)
        return "/uploads/stories/" + uniqueFilename;
    }


}
