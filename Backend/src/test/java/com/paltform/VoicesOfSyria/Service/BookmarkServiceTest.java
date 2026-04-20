package com.paltform.VoicesOfSyria.Service;

import com.paltform.VoicesOfSyria.Repo.BookmarkRepo;
import com.paltform.VoicesOfSyria.Repo.StoryRepo;
import com.paltform.VoicesOfSyria.Repo.UserRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class BookmarkServiceTest {

    @Mock
    private BookmarkRepo bookmarkRepo;

    @Mock
    private UserRepo userRepo;

    @Mock
    private StoryRepo storyRepo;

    @InjectMocks
    private BookmarkService bookmarkService;

    private final Long USER_ID = 1L;
    private final Long STORY_ID = 10L;

    // ===================== removeBookmark Tests =====================

    /**
     * Normal Case: حذف bookmark موجود بنجاح
     * المتوقع: يتم استدعاء deleteByUserIdAndStoryId مرة واحدة
     */
    @Test
    void removeBookmark_WhenBookmarkExists_ShouldDeleteSuccessfully() {
        // Arrange
        doNothing().when(bookmarkRepo).deleteByUserIdAndStoryId(USER_ID, STORY_ID);

        // Act
        bookmarkService.removeBookmark(USER_ID, STORY_ID);

        // Assert
        verify(bookmarkRepo, times(1)).deleteByUserIdAndStoryId(USER_ID, STORY_ID);
    }

    /**
     * Edge Case: حذف bookmark غير موجود (idempotent)
     * المتوقع: لا يرمي exception، يكمل بهدوء
     */
    @Test
    void removeBookmark_WhenBookmarkDoesNotExist_ShouldNotThrowException() {
        // Arrange - الـ repo لا يرمي exception حتى لو الـ bookmark مش موجود
        doNothing().when(bookmarkRepo).deleteByUserIdAndStoryId(USER_ID, STORY_ID);

        // Act & Assert
        assertDoesNotThrow(() -> bookmarkService.removeBookmark(USER_ID, STORY_ID));
        verify(bookmarkRepo, times(1)).deleteByUserIdAndStoryId(USER_ID, STORY_ID);
    }

    /**
     * Edge Case: حذف bookmark بـ userId = null
     * المتوقع: يمرر الـ null للـ repo (السلوك محدد بالـ repo)
     */
    @Test
    void removeBookmark_WithNullUserId_ShouldStillCallRepo() {
        // Arrange
        doNothing().when(bookmarkRepo).deleteByUserIdAndStoryId(null, STORY_ID);

        // Act
        bookmarkService.removeBookmark(null, STORY_ID);

        // Assert
        verify(bookmarkRepo, times(1)).deleteByUserIdAndStoryId(null, STORY_ID);
    }

    /**
     * Edge Case: حذف bookmark بـ storyId = null
     * المتوقع: يمرر الـ null للـ repo
     */
    @Test
    void removeBookmark_WithNullStoryId_ShouldStillCallRepo() {
        // Arrange
        doNothing().when(bookmarkRepo).deleteByUserIdAndStoryId(USER_ID, null);

        // Act
        bookmarkService.removeBookmark(USER_ID, null);

        // Assert
        verify(bookmarkRepo, times(1)).deleteByUserIdAndStoryId(USER_ID, null);
    }

    /**
     * Error Case: الـ repo يرمي RuntimeException أثناء الحذف
     * المتوقع: الـ exception تنتشر للـ caller
     */
    @Test
    void removeBookmark_WhenRepoThrowsException_ShouldPropagateException() {
        // Arrange
        doThrow(new RuntimeException("Database error"))
                .when(bookmarkRepo).deleteByUserIdAndStoryId(USER_ID, STORY_ID);

        // Act & Assert
        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> bookmarkService.removeBookmark(USER_ID, STORY_ID)
        );
        assertEquals("Database error", exception.getMessage());
    }

    /**
     * Normal Case: بعد الحذف، التحقق إن الـ bookmark مش موجود
     * المتوقع: isBookmarked ترجع false بعد الحذف
     */
    @Test
    void removeBookmark_ThenCheckIsBookmarked_ShouldReturnFalse() {
        // Arrange
        doNothing().when(bookmarkRepo).deleteByUserIdAndStoryId(USER_ID, STORY_ID);
        when(bookmarkRepo.existsByUserIdAndStoryId(USER_ID, STORY_ID)).thenReturn(false);

        // Act
        bookmarkService.removeBookmark(USER_ID, STORY_ID);
        boolean result = bookmarkService.isBookmarked(USER_ID, STORY_ID);

        // Assert
        assertFalse(result);
        verify(bookmarkRepo, times(1)).deleteByUserIdAndStoryId(USER_ID, STORY_ID);
    }

    /**
     * Normal Case: حذف نفس الـ bookmark مرتين (idempotent)
     * المتوقع: يُستدعى deleteByUserIdAndStoryId مرتين بدون exception
     */
    @Test
    void removeBookmark_CalledTwice_ShouldBeIdempotent() {
        // Arrange
        doNothing().when(bookmarkRepo).deleteByUserIdAndStoryId(USER_ID, STORY_ID);

        // Act
        bookmarkService.removeBookmark(USER_ID, STORY_ID);
        bookmarkService.removeBookmark(USER_ID, STORY_ID);

        // Assert
        verify(bookmarkRepo, times(2)).deleteByUserIdAndStoryId(USER_ID, STORY_ID);
    }
}
