// 📝 نموذج إنشاء قصة نصية - هنا المستخدم يكتب قصته كنص
// 📍 المكان: frontend/src/components/TextStoryForm.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import styles from './StoryForm.module.css';
import { FiSave, FiXCircle, FiFileText } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { PROVINCES_MAP } from '../utils/constants';
import useStories from '../hooks/useStories';

const TextStoryForm = ({ onCancel, onSuccess }) => {
  // 📊 حالات بيانات القصة
  const [title, setTitle] = useState(''); // عنوان القصة
  const [content, setContent] = useState(''); // محتوى القصة

  // 📍 حالات البيانات الوصفية
  const [province, setProvince] = useState(''); // المحافظة
  const [incidentDate, setIncidentDate] = useState(''); // تاريخ الحادثة
  const [attacker, setAttacker] = useState(''); // الجهة المسؤولة

  // ⚙️ حالات العمليات
  const [isSubmitting, setIsSubmitting] = useState(false); // حالة الإرسال
  const [error, setError] = useState(''); // رسائل الخطأ
  const { submit } = useStories(); // خدمة إرسال القصص

  // 📤 دالة إرسال النموذج
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1. التحقق من جميع الحقول الإلزامية
    if (!title || !content || !province || !incidentDate) {
      setError('الرجاء ملء جميع الحقول المطلوبة: العنوان، المحتوى، المحافظة، وتاريخ الحادثة.');
      return;
    }

    setIsSubmitting(true);

    // 2. بناء حمولة بيانات القصة
    const storyPayload = {
      title: title,
      textContent: content, // محتوى القصة النصي
      type: 'TEXT', // نوع القصة: نصية
      attacker: attacker || null,
      incidentDate: incidentDate,
      province: province,
    };

    try {
      // 3. بناء FormData للإرسال
      const formData = new FormData();
      formData.append('story', JSON.stringify(storyPayload));
      // إضافة ملف إذا كان موجود (غير مستخدم في القصص النصية)
      if (storyPayload.file) formData.append('file', storyPayload.file);
      await submit(formData, 'multipart/form-data');

      // 4. التعامل مع النجاح
      toast.success("Text story submitted successfully!", { autoClose: 3000 });
      if (onSuccess) onSuccess();

    } catch (err) {
      // 5. التعامل مع الأخطاء
      const errorMessage = err.message || 'An unexpected error occurred during submission.';
      setError(errorMessage);
      toast.error(errorMessage);

    } finally {
      setIsSubmitting(false);
    }
  };

  // 🎨 عرض النموذج
  return (
    <motion.div
      className={styles.formCard}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      key="text-form"
    >
      {/* 📋 رأس النموذج */}
      <header className={styles.formHeader}>
        <div className={styles.eyebrow} style={{ background: '#e6fffa', color: '#38b2ac' }}>
          <FiFileText />
          <span>Text Story</span>
        </div>
        <h2>Share Your Story</h2>
      </header>

      <form onSubmit={handleSubmit} dir="rtl">
        {/* ⚠️ رسالة الخطأ */}
        {error && (
          <div className={styles.errorMessage} style={{ marginBottom: '15px' }}>
            {error}
          </div>
        )}

        {/* 📝 حقل العنوان */}
        <div className={styles.inputGroup}>
          <label htmlFor="title">عنوان القصة (Headline) *</label>
          <input
            id="title"
            type="text"
            placeholder="أدخل عنواناً واضحاً وموجزاً لقصتك..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={styles.inputField}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* 📄 حقل المحتوى */}
        <div className={styles.inputGroup}>
          <label htmlFor="content">محتوى القصة *</label>
          <textarea
            id="content"
            rows="8"
            placeholder="اكتب قصتك هنا..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={styles.textareaField}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* 📊 شبكة البيانات الوصفية */}
        <div className={styles.metaDataGrid}>

          {/* 🏛️ المحافظة */}
        <div className={styles.inputGroup}>
    <label>المحافظة *</label>
    <select 
        value={province} 
        onChange={(e) => setProvince(e.target.value)} 
        className={styles.inputField}
        required
    >
        <option value="">اختر المحافظة...</option>
        {Object.entries(PROVINCES_MAP).map(([key, label]) => (
            <option key={key} value={key}>
                {label}
            </option>
        ))}
    </select>
</div>

          {/* 📅 التاريخ */}
          <div className={styles.inputGroup}>
            <label htmlFor="incidentDate">تاريخ الحادثة *</label>
            <input
              id="incidentDate"
              type="date"
              value={incidentDate}
              onChange={(e) => setIncidentDate(e.target.value)}
              className={styles.inputField}
              required
              disabled={isSubmitting}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* ⚔️ المهاجم */}
          <div className={styles.inputGroup}>
            <label htmlFor="attacker">المهاجم/الجهة المسؤولة (اختياري)</label>
            <input
              id="attacker"
              type="text"
              placeholder="Specify a specific group..."
              value={attacker}
              onChange={(e) => setAttacker(e.target.value)}
              className={styles.inputField}
              disabled={isSubmitting}
            />
          </div>

        </div>

        {/* 🔘 أزرار التحكم */}
        <div className={styles.buttonRow}>
          {/* ❌ زر الإلغاء */}
          <motion.button
            type="button"
            className={styles.ghostButton}
            onClick={onCancel}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            disabled={isSubmitting}
          >
            <FiXCircle className={styles.buttonIcon} />
            <span>Cancel</span>
          </motion.button>

          {/* ✅ زر الإرسال */}
          <motion.button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FiSave className={styles.buttonIcon} />
            <span>{isSubmitting ? 'Submitting...' : 'Submit Story'}</span>
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

export default TextStoryForm;