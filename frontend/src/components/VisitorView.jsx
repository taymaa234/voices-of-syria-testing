// 🏠 الصفحة الرئيسية للزوار - هنا يشوف الناس القصص بدون تسجيل دخول
// 📍 المكان: frontend/src/components/VisitorView.jsx

import { useEffect, useState } from 'react';
import { PROVINCES_MAP } from '../utils/constants';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch,
  FiBookOpen,
  FiMessageSquare,
  FiGrid,
  FiFilter,
  FiMapPin,
  FiClock,
  FiHeadphones,
  FiPlayCircle,
  FiFileText,
  FiLogIn
} from 'react-icons/fi';
import styles from './VisitorView.module.css';
import ThemeToggle from './ThemeToggle';
import BookmarkButton from './BookmarkButton';
import { fetchStories, semanticSearch } from '../api/storyService'; 

// صور الخلفية - الصور موجودة في مجلد public
const backgroundImages = [
  '/bg-1.jpg',
  '/bg-2.jpg',
  '/bg-3.jpg',
  '/bg-4.jpg',
];

const typeMeta = {
  all: { label: 'All', icon: <FiGrid />, value: 'all' },
  AUDIO: { label: 'Audio', icon: <FiHeadphones />, value: 'AUDIO' },
  VIDEO: { label: 'Video', icon: <FiPlayCircle />, value: 'VIDEO' },
  TEXT: { label: 'Text', icon: <FiFileText />, value: 'TEXT' }
};

const VisitorView = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [stories, setStories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // تغيير صورة الخلفية كل 6 ثواني
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);


  // جلب البيانات
useEffect(() => {
  let isMounted = true;
  const loadStories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let data;
      if (searchTerm && searchTerm.trim().length > 2) {
        // semantic search
        data = await semanticSearch(searchTerm.trim());
      } else {
        // جلب كل القصص بدون بحث
        data = await fetchStories({});
      }
      if (isMounted) {
        // فلتر النوع يبقى local
        let filtered = data;
        if (typeFilter !== 'all') {
          filtered = data.filter(s => s.type?.toUpperCase() === typeFilter);
        }
        setStories(filtered);
      }
    } catch (err) {
      if (isMounted) setError(err.message || 'Failed to load stories.');
    } finally {
      if (isMounted) setIsLoading(false);
    }
  };
  loadStories();
  return () => { isMounted = false; };
}, [searchTerm, typeFilter]);


  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderTypeBadge = (type) => {
    const upperType = type ? type.toUpperCase() : 'TEXT';
    const meta = typeMeta[upperType];
    if (!meta) return null; 
    return (
      <span className={`${styles.typeBadge} ${styles[`type-${upperType.toLowerCase()}`]}`}>
        {meta.icon}
        {meta.label}
      </span>
    );
  };

  return (
    <div className={styles.visitorPage}>
      {/* 🖼️ خلفية متحركة - الصور تتغير كل5 ثواني */}
      <div className={styles.backgroundSlideshow}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBgIndex}
            className={styles.backgroundImage}
            style={{ backgroundImage: `url(${backgroundImages[currentBgIndex]})` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
          />
        </AnimatePresence>
        <div className={styles.backgroundOverlay} />
      </div>

      {/* 🔘 نقاط التنقل بين الصور */}
      <div className={styles.slideIndicators}>
        {backgroundImages.map((_, index) => (
          <button
            key={index}
            className={`${styles.indicator} ${index === currentBgIndex ? styles.activeIndicator : ''}`}
            onClick={() => setCurrentBgIndex(index)}
          />
        ))}
      </div>

      {/* 🔝 الشريط العلوي - اللوجو وزر تسجيل الدخول */}
      <header className={styles.topBar}>
        <div className={styles.brand}>
          <FiBookOpen />
          <span>Voices Of Syria</span>
        </div>
        <div className={styles.topBarRight}>
          <ThemeToggle />
          <button className={styles.aiChatBtn} onClick={() => navigate('/chat')}>
            <FiMessageSquare /> Ask AI about the platform content
          </button>
          <button className={styles.loginBtn} onClick={() => navigate('/login')}>
            <FiLogIn /> Login
          </button>
        </div>
      </header>


      {/* 🔍 قسم البحث والفلاتر */}
      <section className={styles.searchSection}>
        <div className={styles.searchInputWrapper}>
          <FiSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search stories, tags, or locations"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={styles.filters}>
          <div className={styles.filterLabel}>
            <FiFilter /> Filter
          </div>
          <div className={styles.filterChips}>
            {Object.entries(typeMeta).map(([key, meta]) => (
              <button
                key={key}
                className={`${styles.chip} ${typeFilter === key ? styles.chipActive : ''}`}
                onClick={() => setTypeFilter(key)}
              >
                {meta.icon}
                {meta.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 🎯 القسم الرئيسي - العنوان والإحصائيات */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            <span className={styles.heroTitleArabic}>كل صوت يُروى... ذاكرة لا تُنسى</span>
            <span className={styles.heroTitleEnglish}>Every Voice Told... A Memory Unforgotten</span>
          </h1>
          <p className={styles.heroSubtitle}>
            منصة لتوثيق قصص وشهادات السوريين، لأن كل قصة تستحق أن تُسمع
          </p>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.statNumber}>{stories.length}</span>
              <span className={styles.statLabel}>قصة موثقة</span>
            </div>
          </div>
        </div>
      </section>


      {/* 📚 قسم عرض القصص - هنا تظهر كل القصص المنشورة */}
      <section className={styles.storiesSection}>
        <div className={styles.sectionHeader}>
          <h2>Stories</h2>
          <span className={styles.count}>{stories.length} results</span> 
        </div>
        
        {isLoading && (
          <div className={styles.emptyState} style={{ color: '#4299e1' }}>
            <p>Loading stories...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className={styles.emptyState} style={{ color: '#c53030' }}>
            <p>Error: {error}</p>
          </div>
        )}

        {!isLoading && !error && stories.length === 0 && (
          <div className={styles.emptyState}>
            <p>No stories match your search.</p>
          </div>
        )}

        {!isLoading && !error && stories.length > 0 && (
          <div className={styles.cardsGrid}>
            {stories.map((story) => (
              <article key={story.id} className={styles.storyCard}>
                <div className={styles.cardHeader}>
                  {renderTypeBadge(story.type)}
                  <div className={styles.cardHeaderRight}>
                    <span className={styles.date}>
                      <FiClock /> {formatDate(story.publishDate || story.updatedAt)}
                    </span>
                    <BookmarkButton storyId={story.id} size="small" />
                  </div>
                </div>
                <h3 className={styles.storyTitle}>{story.title}</h3>
                <p className={styles.summary}>
                  {story.textContent ? (story.textContent.length > 180 ? `${story.textContent.slice(0,180)}...` : story.textContent) : 'No summary available.'}
                </p>
                <div className={styles.meta}>
                  <span>
                    <FiMapPin /> {PROVINCES_MAP[story.province] || story.province || 'Unknown location'}
                  </span>
                </div>
                {Array.isArray(story.tags) && story.tags.length > 0 && (
                  <div className={styles.tags}>
                    {story.tags.map((tag) => (
                      <span key={tag} className={styles.tag}>#{tag}</span>
                    ))}
                  </div>
                )}
                <button
                  className={styles.viewBtn}
                  onClick={() => navigate(`/stories/${story.id}`)}
                >
                  <FiPlayCircle />
                  View Details
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default VisitorView;
