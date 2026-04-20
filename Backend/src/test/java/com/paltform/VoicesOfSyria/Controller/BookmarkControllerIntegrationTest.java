package com.paltform.VoicesOfSyria.Controller;

import com.paltform.VoicesOfSyria.Enum.UserRole;
import com.paltform.VoicesOfSyria.Enum.StoryStatus;
import com.paltform.VoicesOfSyria.Enum.StoryType;
import com.paltform.VoicesOfSyria.Model.Bookmark;
import com.paltform.VoicesOfSyria.Model.Story;
import com.paltform.VoicesOfSyria.Model.User;
import com.paltform.VoicesOfSyria.Repo.BookmarkRepo;
import com.paltform.VoicesOfSyria.Repo.StoryRepo;
import com.paltform.VoicesOfSyria.Repo.UserRepo;
import com.paltform.VoicesOfSyria.Service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BookmarkControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepo userRepo;
    @Autowired private StoryRepo storyRepo;
    @Autowired private BookmarkRepo bookmarkRepo;
    @Autowired private JwtService jwtService;
    @Autowired private UserDetailsService userDetailsService;
    @Autowired private PasswordEncoder passwordEncoder;

    private User testUser;
    private Story testStory;
    private String jwtToken;

    @BeforeEach
    void setUp() {
        // إنشاء مستخدم حقيقي في الـ database
        testUser = new User();
        testUser.setName("Test User");
        testUser.setEmail("testuser@test.com");
        testUser.setPassword(passwordEncoder.encode("password123"));
        testUser.setVerified(true);
        testUser.setRole(UserRole.USER);
        testUser = userRepo.save(testUser);

        // إنشاء قصة حقيقية في الـ database
        testStory = new Story();
        testStory.setTitle("Test Story");
        testStory.setTextContent("Test content");
        testStory.setType(StoryType.TEXT);
        testStory.setStatus(StoryStatus.APPROVED);
        testStory.setAuthor(testUser);
        testStory = storyRepo.save(testStory);

        // توليد JWT token حقيقي
        UserDetails userDetails = userDetailsService.loadUserByUsername(testUser.getEmail());
        jwtToken = jwtService.generateAccessToken(userDetails);
    }

    // ===================== DELETE /api/bookmarks/{storyId} =====================

    /**
     * Normal Case: حذف bookmark موجود
     * Controller → Service → Repository → Database
     * المتوقع: 200 OK + الـ bookmark محذوف فعلاً من الـ database
     */
    @Test
    void deleteBookmark_WhenBookmarkExists_Returns200AndDeletesFromDB() throws Exception {
        // Arrange: إضافة bookmark حقيقي في الـ database
        Bookmark bookmark = new Bookmark(testUser, testStory);
        bookmarkRepo.save(bookmark);

        assertTrue(bookmarkRepo.existsByUserIdAndStoryId(testUser.getId(), testStory.getId()));

        // Act: استدعاء الـ API الحقيقي
        mockMvc.perform(delete("/api/bookmarks/" + testStory.getId())
                .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk());

        // Assert: التحقق من الـ database مباشرة
        assertFalse(bookmarkRepo.existsByUserIdAndStoryId(testUser.getId(), testStory.getId()));
    }

    /**
     * Edge Case: حذف bookmark غير موجود (idempotent)
     * المتوقع: 200 OK بدون exception (السلوك idempotent)
     */
    @Test
    void deleteBookmark_WhenBookmarkDoesNotExist_Returns200WithNoError() throws Exception {
        // Arrange: لا يوجد bookmark
        assertFalse(bookmarkRepo.existsByUserIdAndStoryId(testUser.getId(), testStory.getId()));

        // Act & Assert
        mockMvc.perform(delete("/api/bookmarks/" + testStory.getId())
                .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk());
    }

    /**
     * Error Case: حذف bookmark بدون JWT token
     * المتوقع: 403 Forbidden (Spring Security يرجع 403 للطلبات غير المصادق عليها)
     */
    @Test
    void deleteBookmark_WithoutToken_Returns403() throws Exception {
        mockMvc.perform(delete("/api/bookmarks/" + testStory.getId()))
                .andExpect(status().isForbidden());
    }

    /**
     * Normal Case: التحقق إن الـ bookmark محذوف فعلاً عبر check endpoint
     * Flow كامل: DELETE ثم GET /check
     * المتوقع: bookmarked = false بعد الحذف
     */
    @Test
    void deleteBookmark_ThenCheck_ReturnsNotBookmarked() throws Exception {
        // Arrange: إضافة bookmark
        bookmarkRepo.save(new Bookmark(testUser, testStory));

        // Act: حذف الـ bookmark
        mockMvc.perform(delete("/api/bookmarks/" + testStory.getId())
                .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk());

        // Assert: التحقق عبر الـ API
        mockMvc.perform(get("/api/bookmarks/check/" + testStory.getId())
                .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bookmarked").value(false));
    }

    /**
     * Edge Case: حذف bookmark لقصة غير موجودة
     * المتوقع: 200 OK (idempotent - لا يرمي error)
     */
    @Test
    void deleteBookmark_WithNonExistentStoryId_Returns200() throws Exception {
        Long nonExistentStoryId = 99999L;

        mockMvc.perform(delete("/api/bookmarks/" + nonExistentStoryId)
                .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk());
    }
}
