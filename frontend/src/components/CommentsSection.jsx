// 💬 قسم التعليقات - هنا يتم عرض وإدارة تعليقات القصة للمستخدمين والضيوف
// 📍 المكان: frontend/src/components/CommentsSection.jsx
import { useState, useEffect } from 'react';
import { FiSend, FiTrash2, FiMessageCircle, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { getCommentsByStory, addComment, deleteComment, deleteGuestComment } from '../api/commentService';
import useAuth from '../hooks/useAuth';
import styles from './CommentsSection.module.css';

// مفتاح localStorage لتخزين توكنات تعليقات الضيوف
const GUEST_COMMENTS_KEY = 'guestCommentTokens';

// دوال مساعدة للتعامل مع localStorage
const getGuestCommentTokens = () => {
  try {
    return JSON.parse(localStorage.getItem(GUEST_COMMENTS_KEY) || '{}');
  } catch {
    return {};
  }
};

const saveGuestCommentToken = (commentId, deleteToken) => {
  const tokens = getGuestCommentTokens();
  tokens[commentId] = deleteToken;
  localStorage.setItem(GUEST_COMMENTS_KEY, JSON.stringify(tokens));
};

const removeGuestCommentToken = (commentId) => {
  const tokens = getGuestCommentTokens();
  delete tokens[commentId];
  localStorage.setItem(GUEST_COMMENTS_KEY, JSON.stringify(tokens));
};

const getGuestCommentToken = (commentId) => {
  const tokens = getGuestCommentTokens();
  return tokens[commentId] || null;
};

const CommentsSection = ({ storyId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [guestName, setGuestName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // استخدام useAuth hook للحصول على المستخدم الحالي
  const { user: currentUser } = useAuth();
  
  // التحقق من وجود token صالح للتأكد من أن المستخدم مسجل دخول فعلاً
  // نستخدم دالة للتحقق بشكل ديناميكي
  const checkIsLoggedIn = () => {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    return !!token && !!user;
  };
  
  const isLoggedIn = checkIsLoggedIn();

  // جلب التعليقات
  useEffect(() => {
    fetchComments();
  }, [storyId]);

  // تحديث أسماء المؤلفين عند تغيير بيانات المستخدم
  useEffect(() => {
    if (currentUser && comments.length > 0) {
      setComments(prevComments => 
        prevComments.map(comment => {
          // إذا كان التعليق للمستخدم الحالي، نحدث الاسم
          if (comment.userId === currentUser.id) {
            return {
              ...comment,
              authorName: currentUser.name
            };
          }
          return comment;
        })
      );
    }
  }, [currentUser, comments.length]);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const data = await getCommentsByStory(storyId);
      
      // تحديث أسماء المؤلفين إذا كان المستخدم مسجل دخول
      if (currentUser) {
        const updatedData = data.map(comment => {
          if (comment.userId === currentUser.id) {
            return {
              ...comment,
              authorName: currentUser.name
            };
          }
          return comment;
        });
        setComments(updatedData);
      } else {
        setComments(data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // إضافة تعليق
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newComment.trim()) {
      toast.error('Please write a comment');
      return;
    }

    if (!isLoggedIn && !guestName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (newComment.length > 1000) {
      toast.error('Comment must not exceed 1000 characters');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // تحديد إذا كان المستخدم زائر أو مسجل
      const isGuest = !checkIsLoggedIn();
      
      const comment = await addComment(
        storyId,
        newComment.trim(),
        isGuest ? guestName.trim() : null,
        isGuest // asGuest parameter
      );
      
      // حفظ توكن الحذف للضيوف
      if (isGuest && comment.deleteToken) {
        saveGuestCommentToken(comment.id, comment.deleteToken);
      }
      
      setComments([comment, ...comments]);
      setNewComment('');
      toast.success('Comment added successfully');
    } catch (error) {
      toast.error(error.response?.data || 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // حذف تعليق
  const handleDelete = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const guestToken = getGuestCommentToken(commentId);
      
      if (guestToken) {
        // حذف تعليق الضيف باستخدام التوكن
        await deleteGuestComment(commentId, guestToken);
        removeGuestCommentToken(commentId);
      } else {
        // حذف تعليق المستخدم المسجل
        await deleteComment(commentId);
      }
      
      setComments(comments.filter(c => c.id !== commentId));
      toast.success('Comment deleted');
    } catch (error) {
      toast.error(error.response?.data || 'Failed to delete comment');
    }
  };

  // التحقق من إمكانية الحذف
  const canDelete = (comment) => {
    // الضيف يمكنه حذف تعليقه إذا كان لديه التوكن
    const guestToken = getGuestCommentToken(comment.id);
    if (guestToken) return true;
    
    // المستخدم المسجل
    if (!currentUser) return false;
    return comment.userId === currentUser.id || 
           currentUser.role === 'ADMIN' || 
           currentUser.role === 'SUPER_ADMIN';
  };

  // تنسيق التاريخ
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={styles.commentsSection}>
      <h3 className={styles.sectionTitle}>
        <FiMessageCircle />
        Comments ({comments.length})
      </h3>

      {/* نموذج إضافة تعليق */}
      <form onSubmit={handleSubmit} className={styles.commentForm}>
        {!isLoggedIn && (
          <div className={styles.guestNameInput}>
            <FiUser className={styles.inputIcon} />
            <input
              type="text"
              placeholder="Your name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className={styles.nameInput}
              maxLength={50}
            />
          </div>
        )}
        
        <div className={styles.commentInputWrapper}>
          <textarea
            placeholder={isLoggedIn ? "Write your comment..." : "Write your comment as a guest..."}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className={styles.commentInput}
            rows={3}
            maxLength={1000}
          />
          <span className={styles.charCount}>{newComment.length}/1000</span>
        </div>

        <button
          type="submit"
          className={styles.submitButton}
          disabled={isSubmitting || !newComment.trim()}
        >
          <FiSend />
          {isSubmitting ? 'Sending...' : 'Send Comment'}
        </button>
      </form>

      {/* قائمة التعليقات */}
      <div className={styles.commentsList}>
        {isLoading ? (
          <div className={styles.loading}>Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className={styles.noComments}>
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className={styles.commentItem}>
              <div className={styles.commentHeader}>
                <div className={styles.authorInfo}>
                  <span className={styles.authorName}>{comment.authorName}</span>
                  {comment.userId && <span className={styles.verifiedBadge}>✓</span>}
                </div>
                <span className={styles.commentDate}>{formatDate(comment.createdAt)}</span>
              </div>
              <p className={styles.commentContent}>{comment.content}</p>
              {canDelete(comment) && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className={styles.deleteButton}
                  title="حذف التعليق"
                >
                  <FiTrash2 />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentsSection;
