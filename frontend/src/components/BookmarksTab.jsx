// ❤️ تاب المفضلة - هنا المستخدم يشوف القصص يلي حفظها كمفضلة
// 📍 المكان: frontend/src/components/BookmarksTab.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHeart, FiMapPin, FiClock, FiFileText, FiMic, FiVideo, FiTrash2, FiEye } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { getBookmarks, removeBookmark } from '../api/bookmarkService';
import styles from './BookmarksTab.module.css';

const BookmarksTab = ({ onBrowseClick }) => {
  const navigate = useNavigate();
  
  // 📊 حالات البيانات
  const [bookmarks, setBookmarks] = useState([]); // قائمة المفضلة
  const [isLoading, setIsLoading] = useState(true); // حالة التحميل
  const [removingId, setRemovingId] = useState(null); // معرف القصة قيد الحذف

  // 🔄 تحميل المفضلة عند بداية تشغيل الكومبوننت
  useEffect(() => {
    loadBookmarks();
  }, []);

  // 📚 جلب قائمة المفضلة
  const loadBookmarks = async () => {
    try {
      setIsLoading(true);
      const data = await getBookmarks();
      setBookmarks(data);
    } catch (error) {
      toast.error('Failed to load favorites');
      console.error('Error loading bookmarks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🗑️ حذف قصة من المفضلة
  const handleRemoveBookmark = async (storyId, e) => {
    e.stopPropagation(); // منع فتح القصة عند الضغط على زر الحذف
    try {
      setRemovingId(storyId);
      await removeBookmark(storyId);
      setBookmarks(prev => prev.filter(b => b.storyId !== storyId));
      toast.success('Removed from favorites');
    } catch (error) {
      toast.error('Failed to remove from favorites');
    } finally {
      setRemovingId(null);
    }
  };

  // 🎭 اختيار الأيقونة المناسبة لنوع القصة
  const getTypeIcon = (type) => {
    switch (type?.toUpperCase()) {
      case 'AUDIO': return <FiMic />; // أيقونة الميكروفون للصوت
      case 'VIDEO': return <FiVideo />; // أيقونة الفيديو
      default: return <FiFileText />; // أيقونة النص
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <p>Loading favorites...</p>
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <FiHeart />
        </div>
        <h3>No Favorites Yet</h3>
        <p>Start adding stories you like to your favorites</p>
        <button 
          className={styles.browseBtn}
          onClick={() => onBrowseClick ? onBrowseClick() : navigate('/dashboard')}
        >
          Browse Stories
        </button>
      </div>
    );
  }

  return (
    <div className={styles.bookmarksContainer}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2>My Favorites</h2>
          <span className={styles.count}>{bookmarks.length} {bookmarks.length === 1 ? 'story' : 'stories'}</span>
        </div>
      </div>

      <div className={styles.bookmarksGrid}>
        {bookmarks.map((bookmark) => (
          <div 
            key={bookmark.id} 
            className={styles.bookmarkCard}
            onClick={() => navigate(`/stories/${bookmark.storyId}`)}
          >
            <div className={styles.cardHeader}>
              <span className={styles.typeBadge}>
                {getTypeIcon(bookmark.storyType)}
                {bookmark.storyType}
              </span>
              <button
                className={`${styles.removeBtn} ${removingId === bookmark.storyId ? styles.removing : ''}`}
                onClick={(e) => handleRemoveBookmark(bookmark.storyId, e)}
                disabled={removingId === bookmark.storyId}
                title="Remove from favorites"
              >
                <FiTrash2 />
              </button>
            </div>

            <h3 className={styles.storyTitle}>{bookmark.storyTitle}</h3>

            <div className={styles.cardMeta}>
              {bookmark.storyProvince && (
                <span className={styles.metaItem}>
                  <FiMapPin /> {bookmark.storyProvince}
                </span>
              )}
              {bookmark.authorName && (
                <span className={styles.metaItem}>
                  By: {bookmark.authorName}
                </span>
              )}
            </div>

            <div className={styles.cardFooter}>
              <span className={styles.savedDate}>
                <FiClock /> Saved {formatDate(bookmark.createdAt)}
              </span>
              <button className={styles.viewBtn}>
                <FiEye /> View
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookmarksTab;
