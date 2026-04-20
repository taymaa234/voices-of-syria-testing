package com.paltform.VoicesOfSyria.Controller;

import com.paltform.VoicesOfSyria.Dto.StoryDTO;
import com.paltform.VoicesOfSyria.Model.Story;
import com.paltform.VoicesOfSyria.Model.User;
import com.paltform.VoicesOfSyria.Repo.UserRepo;
import com.paltform.VoicesOfSyria.Service.StoryService;

import org.springframework.http.MediaType;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/stories")
public class PublisherController {

    @Autowired
    private StoryService storyService;

    @Autowired
    private UserRepo userRepo;


    

        
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Story> createStory(
            @RequestPart("story") String storyJson,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) throws IOException {
    
        // تحويل JSON إلى DTO
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);        StoryDTO storyDTO = mapper.readValue(storyJson, StoryDTO.class);
    
        // جلب المستخدم من التوكن
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        User user = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
    
        // تعبئة القصة
        Story story = new Story();
        story.setTitle(storyDTO.getTitle());
        story.setTextContent(storyDTO.getTextContent());
        story.setType(storyDTO.getType());
        story.setAttacker(storyDTO.getAttacker());
        story.setIncidentDate(storyDTO.getIncidentDate());
        story.setProvince(storyDTO.getProvince());
        story.setAuthor(user);
    
        Story created = storyService.createStory(story, file);
    
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    
    
    

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> updateStory(
            @PathVariable Long id,
            @RequestPart("story") String storyJson,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) throws IOException {
    
        // تحويل JSON إلى DTO
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);        StoryDTO storyDto = mapper.readValue(storyJson, StoryDTO.class);
    
        Story updated = storyService.updateStory(id, storyDto, file);
    
        return ResponseEntity.ok(updated);
    }
    

         

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> deleteStory(@PathVariable Long id) {
        try {
            storyService.deleteStory(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/my-stories/{publisherId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<Story>> getMyStories(@PathVariable Long publisherId) {
        try {
            List<Story> stories = storyService.getMyStories(publisherId);
            return ResponseEntity.ok(stories);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
