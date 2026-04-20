// 📄 صفحة تفاصيل القصة - هنا يتم عرض القصة كاملة مع التفاصيل والتعليقات
// 📍 المكان: frontend/src/components/StoryDetail.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStoryById } from '../api/storyService';
import { getTranscriptionStatus } from '../api/transcriptionService';
import useAuth from '../hooks/useAuth';
import {
  FiArrowLeft,
  FiFileText,
  FiMic,
  FiVideo,
  FiMapPin,
  FiCalendar,
  FiUser,
  FiAlertTriangle,
  FiBookOpen,
  FiPlay,
  FiRefreshCw,
  FiLoader,
} from 'react-icons/fi';
import styles from './StoryDetail.module.css';
import CommentsSection from './CommentsSection';
import BookmarkButton from './BookmarkButton';

const StoryDetail = () => {
  const { id } = useParams(); // معرف القصة من الرابط
  const navigate = useNavigate();
  const { user } = useAuth(); // بيانات المستخدم الحالي
  
  // 📊 حالات البيانات الأساسية
  const [story, setStory] = useState(null); // بيانات القصة
  const [loading, setLoading] = useState(true); // حالة التحميل
  const [error, setError] = useState(null); // رسائل الخطأ

  // 🎤 حالات التفريغ الصوتي
  const [isPolling, setIsPolling] = useState(false);       // التفريغ لسا شغال، عم ننتظر
  const [transcriptError, setTranscriptError] = useState(null); // أخطاء التفريغ
  const [transcript, setTranscript] = useState(null);      // النص الكامل المحفوظ
  const [transcriptLanguage, setTranscriptLanguage] = useState(null); // لغة التفريغ
  const [displayedText, setDisplayedText] = useState('');  // النص المعروض كلمة كلمة (بث مزيف)
  const [isStreaming, setIsStreaming] = useState(false);    // عم يبث النص كلمة كلمة
  const pollingTimerRef = useRef(null);                     // reference للـ polling timer
  const streamingTimerRef = useRef(null);                   // reference للـ streaming timer

  // 🔙 تحديد صفحة الرجوع حسب نوع المستخدم
  const getBackPath = () => {
    if (!user) return '/'; // زائر
    switch (user.role) {
      case 'ADMIN':
        return '/admin';
      case 'SUPER_ADMIN':
        return '/admin';
      case 'USER':
        return '/dashboard';
      default:
        return '/';
    }
  };

  const getBackLabel = () => {
    if (!user) return 'Back to Stories';
    switch (user.role) {
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return 'Back to Admin Panel';
      case 'USER':
        return 'Back to Dashboard';
      default:
        return 'Back to Stories';
    }
  };

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const data = await getStoryById(id);
        setStory(data);
        // لا نحمّل الـ transcript تلقائياً - المستخدم لازم يضغط الزر
      } catch (err) {
        setError(err.message || 'Failed to load story');
      } finally {
        setLoading(false);
      }
    };

    fetchStory();

    // cleanup عند مغادرة الصفحة
    return () => {
      if (pollingTimerRef.current) clearTimeout(pollingTimerRef.current);
      if (streamingTimerRef.current) clearInterval(streamingTimerRef.current);
    };
  }, [id]);

  // بث النص كلمة كلمة بعد ما يصير جاهز
  const streamTextWordByWord = (fullText, language) => {
    setTranscriptLanguage(language);
    setIsStreaming(true);
    setDisplayedText('');
    // filter لإزالة الكلمات الفاضية الناتجة عن مسافات متعددة
    const words = fullText.trim().split(/\s+/).filter(w => w.length > 0);
    let index = 0;
    streamingTimerRef.current = setInterval(() => {
      if (index < words.length) {
        setDisplayedText(prev => prev + (index === 0 ? '' : ' ') + words[index]);
        index++;
      } else {
        clearInterval(streamingTimerRef.current);
        setIsStreaming(false);
        setTranscript(fullText); // احفظ النص الكامل بعد ما ينتهي البث
      }
    }, 60); // كل 60ms كلمة وحدة
  };

  const handleTranscribe = async () => {
    // إذا النص موجود مسبقاً، ابدأ البث مباشرة بدون polling
    if (transcript) {
      streamTextWordByWord(transcript, transcriptLanguage);
      return;
    }

    setIsPolling(true);
    setTranscriptError(null);
    setDisplayedText('');

    const checkStatus = async () => {
      try {
        const result = await getTranscriptionStatus(id);

        if (result.status === 'done') {
          setIsPolling(false);
          streamTextWordByWord(result.transcript, result.language || 'ar');
        } else if (result.status === 'pending') {
          // لسا ما انتهى، كرر بعد 5 ثواني
          pollingTimerRef.current = setTimeout(checkStatus, 5000);
        } else {
          setIsPolling(false);
          setTranscriptError('حدث خطأ أثناء التفريغ. حاول مرة أخرى لاحقاً.');
        }
      } catch (err) {
        setIsPolling(false);
        setTranscriptError(err.message || 'تعذّر الاتصال بالخادم');
      }
    };

    await checkStatus();
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'AUDIO': return <FiMic />;
      case 'VIDEO': return <FiVideo />;
      default: return <FiFileText />;
    }
  };

  const getTypeClass = (type) => {
    switch (type) {
      case 'AUDIO': return styles.typeAudio;
      case 'VIDEO': return styles.typeVideo;
      default: return styles.typeText;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.loadingSpinner}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Loading story...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <div className={styles.errorBox}>
          <FiAlertTriangle className={styles.errorIcon} />
          <p className={styles.errorText}>{error}</p>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className={styles.errorState}>
        <div className={styles.errorBox}>
          <FiAlertTriangle className={styles.errorIcon} />
          <p className={styles.errorText}>Story not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.detailPage}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(getBackPath())}>
          <FiArrowLeft /> {getBackLabel()}
        </button>
        <div className={styles.headerTitle}>
          <FiBookOpen />
          <span>Story Details</span>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Hero Section */}
        <div className={styles.heroSection}>
          <div className={styles.heroImage}>
            <div className={styles.heroIcon}>
              {getTypeIcon(story.type)}
            </div>
            <span className={`${styles.typeBadgeLarge} ${getTypeClass(story.type)}`}>
              {getTypeIcon(story.type)}
              {story.type}
            </span>
          </div>

          <div className={styles.heroContent}>
            <div className={styles.titleRow}>
              <h1 className={styles.storyTitle}>{story.title}</h1>
              <BookmarkButton storyId={story.id} size="large" />
            </div>

            {/* Meta Grid */}
            <div className={styles.metaGrid}>
              <div className={styles.metaItem}>
                <div className={styles.metaIcon}>
                  <FiMapPin />
                </div>
                <div className={styles.metaText}>
                  <span className={styles.metaLabel}>Location</span>
                  <span className={styles.metaValue}>{story.province || 'Unknown'}</span>
                </div>
              </div>

              <div className={styles.metaItem}>
                <div className={styles.metaIcon}>
                  <FiCalendar />
                </div>
                <div className={styles.metaText}>
                  <span className={styles.metaLabel}>Incident Date</span>
                  <span className={styles.metaValue}>{formatDate(story.incidentDate)}</span>
                </div>
              </div>

              {story.author && (
                <div className={styles.metaItem}>
                  <div className={styles.metaIcon}>
                    <FiUser />
                  </div>
                  <div className={styles.metaText}>
                    <span className={styles.metaLabel}>Author</span>
                    <span className={styles.metaValue}>{story.author.name}</span>
                  </div>
                </div>
              )}

              <div className={styles.metaItem}>
                <div className={styles.metaIcon}>
                  {getTypeIcon(story.type)}
                </div>
                <div className={styles.metaText}>
                  <span className={styles.metaLabel}>Story Type</span>
                  <span className={styles.metaValue}>{story.type}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Story Content */}
        {story.textContent && (
          <section className={styles.contentSection}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIcon}>
                <FiFileText />
              </div>
              <h2 className={styles.sectionTitle}>Story Content</h2>
            </div>
            <p className={styles.storyText}>{story.textContent}</p>
          </section>
        )}

        {/* Attacker Info */}
        {story.attacker && (
          <section className={`${styles.contentSection} ${styles.attackerSection}`}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIcon}>
                <FiAlertTriangle />
              </div>
              <h2 className={styles.sectionTitle}>Attacker Information</h2>
            </div>
            <div className={styles.attackerValue}>{story.attacker}</div>
          </section>
        )}

        {/* Media Content */}
        {story.mediaUrl && (
          <section className={`${styles.contentSection} ${styles.mediaSection}`}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIcon}>
                <FiPlay />
              </div>
              <h2 className={styles.sectionTitle}>
                {story.type === 'VIDEO' ? 'Video Content' : 'Audio Content'}
              </h2>
            </div>
            {(story.type === 'VIDEO' || story.type === 'AUDIO') && story.mediaUrl && (
              <div className={styles.mediaContainer}>
                {story.type === 'VIDEO' && (
                  <video 
                    controls 
                    src={story.mediaUrl.startsWith('http') 
                      ? story.mediaUrl 
                      : `http://localhost:8080${story.mediaUrl}`} 
                    className={`${styles.mediaPlayer} ${styles.videoPlayer}`}
                  />
                )}
                {story.type === 'AUDIO' && (
                  <audio 
                    controls 
                    src={story.mediaUrl.startsWith('http') 
                      ? story.mediaUrl 
                      : `http://localhost:8080${story.mediaUrl}`} 
                    className={`${styles.mediaPlayer} ${styles.audioPlayer}`}
                  />
                )}
                
                {/* Transcription Section - Only show for APPROVED stories with media */}
                {story.status === 'APPROVED' && (story.type === 'AUDIO' || story.type === 'VIDEO') && (
                  <div className={styles.transcriptionSection}>
                    <button
                      className={`${styles.transcribeBtn} ${(isPolling || isStreaming) ? styles.transcribing : ''}`}
                      onClick={handleTranscribe}
                      disabled={isPolling || isStreaming}
                    >
                      {isPolling ? (
                        <>
                          <FiLoader className={styles.spinIcon} />
                          التفريغ جارٍ، انتظر...
                        </>
                      ) : isStreaming ? (
                        <>
                          <FiRefreshCw className={styles.spinIcon} />
                          جاري العرض...
                        </>
                      ) : transcript ? (
                        <>
                          <FiRefreshCw />
                          إعادة عرض التفريغ
                        </>
                      ) : (
                        <>
                          <FiFileText />
                          تفريغ {story.type === 'AUDIO' ? 'الصوت' : 'الفيديو'}
                        </>
                      )}
                    </button>

                    {transcriptError && (
                      <div className={styles.transcriptError}>
                        <FiAlertTriangle />
                        {transcriptError}
                      </div>
                    )}

                    {/* عرض النص أثناء البث أو بعده */}
                    {(displayedText || (transcript && !isPolling)) && (
                      <div className={styles.transcriptBox}>
                        <div className={styles.transcriptHeader}>
                          <FiFileText />
                          <span>التفريغ</span>
                          {transcriptLanguage && (
                            <span className={styles.languageBadge}>
                              {transcriptLanguage === 'ar' ? 'عربي' : transcriptLanguage}
                            </span>
                          )}
                        </div>
                        <p className={styles.transcriptText}>
                          {displayedText || transcript}
                          {isStreaming && <span className={styles.cursor}>▌</span>}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        )}
        
        {/* Comments Section */}
        <CommentsSection storyId={id} />
      </main>
    </div>
  );
};

export default StoryDetail;
