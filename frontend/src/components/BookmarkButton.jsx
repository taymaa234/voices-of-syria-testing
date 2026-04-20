// ❤️ زر المفضلة - يسمح للمستخدمين بحفظ القصص في قائمة المفضلة
// 📍 المكان: frontend/src/components/BookmarkButton.jsx
import { useState, useEffect } from 'react';
import { FiHeart } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { toggleBookmark, checkBookmark } from '../api/bookmarkService';
import useAuth from '../hooks/useAuth';
import styles from './BookmarkButton.module.css';

const BookmarkButton = ({ storyId, initialBookmarked = false, onToggle, size = 'medium' }) => {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  
  // Check if user is logged in
  const isLoggedIn = !!user && !!localStorage.getItem('accessToken');

  // Check bookmark status on mount if user is logged in
  useEffect(() => {
    if (isLoggedIn && storyId) {
      checkBookmarkStatus();
    }
  }, [storyId, isLoggedIn]);

  const checkBookmarkStatus = async () => {
    try {
      const result = await checkBookmark(storyId);
      setIsBookmarked(result.bookmarked);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }
  };

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // If not logged in, show login prompt
    if (!isLoggedIn) {
      toast.info('سجل دخول لحفظ القصص في المفضلة');
      return;
    }

    if (isLoading) return;

    try {
      setIsLoading(true);
      const result = await toggleBookmark(storyId);
      setIsBookmarked(result.bookmarked);
      
      if (result.bookmarked) {
        toast.success('تمت إضافة القصة للمفضلة');
      } else {
        toast.success('تمت إزالة القصة من المفضلة');
      }

      // Call onToggle callback if provided
      if (onToggle) {
        onToggle(result.bookmarked);
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث المفضلة');
      console.error('Error toggling bookmark:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className={`${styles.bookmarkButton} ${styles[size]} ${isBookmarked ? styles.bookmarked : ''} ${isLoading ? styles.loading : ''}`}
      onClick={handleClick}
      disabled={isLoading}
      title={isBookmarked ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
      aria-label={isBookmarked ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
    >
      <FiHeart className={`${styles.heartIcon} ${isBookmarked ? styles.filled : ''}`} />
    </button>
  );
};

export default BookmarkButton;
