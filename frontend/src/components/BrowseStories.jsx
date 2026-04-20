// 🔍 صفحة تصفح القصص - هنا المستخدم يشوف كل القصص المنشورة ويقدر يبحث فيها
// 📍 المكان: frontend/src/components/BrowseStories.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiHeart, FiEye, FiCalendar, FiMic, FiFileText, FiVideo } from 'react-icons/fi';
import { getApprovedStories, semanticSearch } from '../api/storyService';
import { toggleBookmark, getBookmarkedIds } from '../api/bookmarkService';
import { toast } from 'react-toastify';
import styles from './BrowseStories.module.css';

const BrowseStories = () => {
  const navigate = useNavigate();
  // 📊 حالات البيانات الأساسية
  const [stories, setStories] = useState([]); // قائمة القصص
  const [loading, setLoading] = useState(true); // حالة التحميل
  const [searchTerm, setSearchTerm] = useState(''); // نص البحث
  const [filterType, setFilterType] = useState('ALL'); // فلتر نوع القصة
  const [bookmarkedIds, setBookmarkedIds] = useState([]); // قائمة القصص المفضلة
  const [searchResults, setSearchResults] = useState(null); // null = لم يبحث بعد
const [searching, setSearching] = useState(false);


  // 🔄 تحميل البيانات عند بداية تشغيل الكومبوننت
  useEffect(() => {
    loadStories();
    loadBookmarkedIds();
  }, []);
  useEffect(() => {
    if (!searchTerm || searchTerm.trim().length < 3) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await semanticSearch(searchTerm.trim());
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 500); // debounce 500ms
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 📚 جلب القصص المعتمدة من الباك إند
  const loadStories = async () => {
    try {
      setLoading(true);
      const data = await getApprovedStories();
      setStories(data);
    } catch (error) {
      toast.error('Failed to load stories');
    } finally {
      setLoading(false);
    }
  };

  // ❤️ جلب قائمة القصص المفضلة للمستخدم
  const loadBookmarkedIds = async () => {
    try {
      const ids = await getBookmarkedIds();
      setBookmarkedIds(ids);
    } catch (error) {
      console.error('Failed to load bookmarked IDs:', error);
    }
  };

  // 💖 إضافة أو إزالة قصة من المفضلة
  const handleToggleBookmark = async (e, storyId) => {
    e.stopPropagation(); // منع فتح القصة عند الضغط على القلب
    try {
      const result = await toggleBookmark(storyId);
      if (result.bookmarked) {
        setBookmarkedIds(prev => [...prev, storyId]);
        toast.success('Added to favorites');
      } else {
        setBookmarkedIds(prev => prev.filter(id => id !== storyId));
        toast.success('Removed from favorites');
      }
    } catch (error) {
      toast.error('Failed to update favorites');
    }
  };

  // 👁️ الانتقال لصفحة تفاصيل القصة
  const handleViewStory = (storyId) => {
    navigate(`/stories/${storyId}`);
  };

  // 🎭 اختيار الأيقونة المناسبة لنوع القصة
  const getTypeIcon = (type) => {
    switch(type) {
      case 'AUDIO': return <FiMic />; // أيقونة الميكروفون للصوت
      case 'VIDEO': return <FiVideo />; // أيقونة الفيديو
      default: return <FiFileText />; // أيقونة النص
    }
  };

  // 📅 تنسيق التاريخ بشكل جميل
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // 🔍 فلترة القصص حسب البحث ونوع القصة
const displayStories = searchResults !== null ? searchResults : stories;
const filteredStories = displayStories.filter(story => {
  return filterType === 'ALL' || story.type === filterType;
});


  // 📋 استخراج أنواع القصص المتاحة للفلتر
  const types = [...new Set(stories.map(s => s.type).filter(Boolean))];

  // ⏳ شاشة التحميل
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading stories...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 📋 رأس الصفحة */}
      <div className={styles.header}>
        <h1>Browse Stories</h1>
        <p>Discover stories and testimonies from Syria</p>
      </div>

      {/* 🔍 قسم البحث والفلاتر */}
      <div className={styles.filtersSection}>
        {/* 🔎 مربع البحث */}
        <div className={styles.searchBox}>
          <FiSearch />
          <input
            type="text"
            placeholder="Search stories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* 🎛️ فلتر نوع القصة */}
        <div className={styles.filters}>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="ALL">All Types</option>
            {types.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 📊 عرض عدد النتائج */}
      <div className={styles.resultsInfo}>
        <span>{filteredStories.length} stories found</span>
      </div>

      {/* 📚 عرض القصص أو رسالة فارغة */}
      {filteredStories.length === 0 ? (
        // 🚫 حالة عدم وجود نتائج
        <div className={styles.emptyState}>
          <FiSearch size={48} />
          <h3>No Stories Found</h3>
          <p>No stories match your search criteria</p>
        </div>
      ) : (
        // 📖 شبكة عرض القصص
        <div className={styles.storiesGrid}>
          {filteredStories.map(story => (
            <div 
              key={story.id} 
              className={styles.storyCard}
              onClick={() => handleViewStory(story.id)}
            >
              {/* 🔝 رأس البطاقة - نوع القصة وزر المفضلة */}
              <div className={styles.cardHeader}>
                <span className={styles.storyType}>
                  {getTypeIcon(story.type)}
                  {story.type}
                </span>
                <button 
                  className={`${styles.bookmarkBtn} ${bookmarkedIds.includes(story.id) ? styles.bookmarked : ''}`}
                  onClick={(e) => handleToggleBookmark(e, story.id)}
                  title={bookmarkedIds.includes(story.id) ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <FiHeart />
                </button>
              </div>
              
              {/* 📝 عنوان القصة */}
              <h3 className={styles.storyTitle}>{story.title}</h3>
              
              {/* 📄 مقطع من محتوى القصة */}
              <p className={styles.storyExcerpt}>
                {story.textContent?.substring(0, 100)}...
              </p>
              
              {/* 📅 معلومات إضافية - التاريخ */}
              <div className={styles.storyMeta}>
                {story.publishDate && (
                  <span className={styles.metaItem}>
                    <FiCalendar /> {formatDate(story.publishDate)}
                  </span>
                )}
              </div>
              
              {/* 👁️ زر عرض القصة */}
              <button className={styles.viewBtn}>
                <FiEye /> View Story
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowseStories;
