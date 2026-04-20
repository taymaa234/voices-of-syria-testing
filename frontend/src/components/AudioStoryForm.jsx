// 🎙️ نموذج إنشاء قصة صوتية - هنا المستخدم يرفع ملف صوتي ويدخل تفاصيل القصة
// 📍 المكان: frontend/src/components/AudioStoryForm.jsx

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from './StoryForm.module.css';
import { FiSave, FiXCircle, FiMic, FiUploadCloud, FiTrash2, FiMusic, FiPlay, FiLoader } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { PROVINCES_MAP } from '../utils/constants';
import useStories from '../hooks/useStories';
import { transcribeAudio } from '../api/transcriptionService';

// 📏 حدود حجم الملف
const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const AudioStoryForm = ({ onCancel, onSuccess }) => {
    // 📊 حالات بيانات القصة
    const [title, setTitle] = useState(''); // عنوان القصة
    const [audioFile, setAudioFile] = useState(null); // الملف الصوتي
    const [textContent, setTextContent] = useState(''); // النص المفرغ من الصوت

    // 📍 حالات البيانات الوصفية
    const [province, setProvince] = useState(''); // المحافظة
    const [incidentDate, setIncidentDate] = useState(''); // تاريخ الحادثة
    const [attacker, setAttacker] = useState(''); // الجهة المسؤولة

    // ⚙️ حالات العمليات
    const [isSubmitting, setIsSubmitting] = useState(false); // حالة الإرسال
    const [isTranscribing, setIsTranscribing] = useState(false); // حالة التفريغ
    const [error, setError] = useState(''); // رسائل الخطأ
    
    const { submit } = useStories(); // خدمة إرسال القصص
    const fileInputRef = useRef(null); // مرجع لحقل رفع الملف

    // 📁 دوال التعامل مع الملفات

    // 📤 التعامل مع اختيار الملف
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type.startsWith('audio/')) {
                if (file.size > MAX_FILE_SIZE_BYTES) {
                    setError(`File size exceeds the limit of ${MAX_FILE_SIZE_MB}MB.`);
                    toast.error(`File size exceeds the limit of ${MAX_FILE_SIZE_MB}MB.`);
                    setAudioFile(null);
                } else {
                    setAudioFile(file);
                    setError('');
                }
            } else {
                setError('Please upload a valid audio file.');
                toast.error('Invalid file type. Please upload an audio file.');
            }
        }
    };

    // 🎯 التعامل مع سحب وإفلات الملف
    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
            if (file.type.startsWith('audio/')) {
                if (file.size > MAX_FILE_SIZE_BYTES) {
                    setError(`File size exceeds the limit of ${MAX_FILE_SIZE_MB}MB.`);
                    toast.error(`File size exceeds the limit of ${MAX_FILE_SIZE_MB}MB.`);
                    setAudioFile(null);
                } else {
                    setAudioFile(file);
                    setError('');
                }
            } else {
                setError('Please upload a valid audio file.');
                toast.error('Invalid file type. Please upload an audio file.');
            }
        }
    };

    // 🖱️ السماح بسحب الملف فوق المنطقة
    const handleDragOver = (e) => {
        e.preventDefault();
    };

    // 🗑️ حذف الملف المختار
    const removeFile = () => {
        setAudioFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // 📊 تنسيق حجم الملف بشكل قابل للقراءة
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // 🎤 دالة تفريغ الصوت إلى نص
    const handleTranscribe = async () => {
        if (!audioFile) {
            toast.error('يرجى رفع ملف صوتي أولاً');
            return;
        }

        setIsTranscribing(true);
        setError('');
        
        // عرض رسالة التقدم
        toast.info('جاري تفريغ الملف الصوتي... قد يستغرق عدة دقائق', { autoClose: false, toastId: 'transcribing' });

        try {
            const result = await transcribeAudio(audioFile, 'ar'); // تحديد اللغة العربية

            // إخفاء رسالة التقدم
            toast.dismiss('transcribing');

            if (result.success) {
                setTextContent(result.transcript);
                toast.success(`تم النسخ بنجاح! (${result.processing_time?.toFixed(1)} ثانية)`, { autoClose: 4000 });
            } else {
                setError(result.error);
                toast.error(`فشل في النسخ: ${result.error}`);
            }
        } catch (err) {
            // إخفاء رسالة التقدم
            toast.dismiss('transcribing');
            
            const errorMessage = 'حدث خطأ أثناء النسخ. يرجى المحاولة مرة أخرى.';
            setError(errorMessage);
            toast.error(errorMessage);
            console.error('Transcription error:', err);
        } finally {
            setIsTranscribing(false);
        }
    };

    // 📤 دالة إرسال النموذج
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // 1. التحقق من جميع الحقول الإلزامية
        if (!title || !audioFile || !province || !incidentDate) {
            setError('الرجاء ملء جميع الحقول المطلوبة: العنوان، ملف الصوت، المحافظة، وتاريخ الحادثة.');
            return;
        }

        setIsSubmitting(true);

        // 2. بناء حمولة بيانات القصة
        const storyPayload = {
            title: title,
            textContent: textContent || null,
            type: 'AUDIO', // نوع القصة: صوتية
            attacker: attacker || null,
            incidentDate: incidentDate,
            province: province,
        };
        
        // 3. بناء كائن FormData لإرسال الملف
        const formData = new FormData();
        formData.append('story', JSON.stringify(storyPayload)); 
        formData.append('file', audioFile); // الملف الصوتي

        try {
            // 4. إرسال البيانات
            await submit(formData, 'multipart/form-data');
            
            // 5. التعامل مع النجاح
            toast.success("Audio story submitted successfully!", { autoClose: 3000 });
            if (onSuccess) onSuccess();

        } catch (err) {
            // 6. التعامل مع الأخطاء
            const errorMessage = err.message || 'An unexpected error occurred during submission.';
            setError(errorMessage);
            toast.error(errorMessage);
            
        } finally {
            setIsSubmitting(false);
        }
    };
    // -----------------------------------------------------------------

    // 🎨 عرض النموذج
    return (
        <motion.div
            className={styles.formCard}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            key="audio-form"
        >
            {/* 📋 رأس النموذج */}
            <header className={styles.formHeader}>
                <div className={styles.eyebrow} style={{ background: '#f0fff4', color: '#38a169' }}>
                    <FiMic />
                    <span>Audio Story</span>
                </div>
                <h2>Share Your Voice</h2>
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
                        disabled={isSubmitting || isTranscribing}
                    />
                </div>

                {/* 📄 حقل النص (اختياري) */}
                <div className={styles.inputGroup}>
                    <label htmlFor="textContent">نص القصة (اختياري)</label>
                    <textarea
                        id="textContent"
                        placeholder="يمكنك كتابة نص القصة هنا إذا كنت تريد ذلك..."
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        className={styles.textareaField}
                        rows={4}
                        disabled={isSubmitting || isTranscribing}
                    />
                </div>

                {/* 🎵 منطقة رفع الملف الصوتي */}
                <div className={styles.inputGroup}>
                    <label>ملف الصوت *</label>

                    {!audioFile ? (
                        // 📤 منطقة الرفع الفارغة
                        <div
                            className={styles.uploadZone}
                            onClick={() => fileInputRef.current.click()}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            disabled={isSubmitting}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="audio/*"
                                style={{ display: 'none' }}
                                disabled={isSubmitting}
                            />
                            <FiUploadCloud className={styles.uploadIcon} />
                            <div className={styles.uploadText}>اضغط للرفع أو اسحب الملف هنا</div>
                            <div className={styles.uploadSubtext}>MP3, WAV, M4A (Max {MAX_FILE_SIZE_MB}MB)</div>
                        </div>
                    ) : (
                        // 🎵 معاينة الملف المرفوع
                        <div className={styles.filePreview}>
                            <div className={styles.fileInfo}>
                                <FiMusic size={24} color="#4299e1" />
                                <div>
                                    <div className={styles.fileName}>{audioFile.name}</div>
                                    <div className={styles.fileSize}>{formatFileSize(audioFile.size)}</div>
                                </div>
                            </div>
                            <div className={styles.fileActions}>
                                {/* 🎤 زر التفريغ */}
                                <button
                                    type="button"
                                    onClick={handleTranscribe}
                                    className={styles.transcribeButton}
                                    disabled={isSubmitting || isTranscribing}
                                    title="تفريغ الصوت إلى نص"
                                >
                                    {isTranscribing ? (
                                        <FiLoader size={16} className={styles.spinning} />
                                    ) : (
                                        <FiPlay size={16} />
                                    )}
                                    {isTranscribing ? 'جاري التفريغ...' : 'تفريغ'}
                                </button>
                                {/* 🗑️ زر الحذف */}
                                <button type="button" onClick={removeFile} className={styles.removeButton} disabled={isSubmitting || isTranscribing}>
                                    <FiTrash2 size={20} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* 📊 شبكة البيانات الوصفية */}
                <div className={styles.metaDataGrid}>

                    {/* 🏛️ المحافظة */}
                    <div className={styles.inputGroup}>
                        <label htmlFor="province">المحافظة (مكان الحادثة) *</label>
                        <select
                            id="province"
                            value={province}
                            onChange={(e) => setProvince(e.target.value)}
                            className={styles.inputField}
                            required
                            disabled={isSubmitting || isTranscribing}
                        >
                            <option value="">اختر محافظة</option>
                            {Object.entries(PROVINCES_MAP).map(([key, value]) => (
                                <option key={key} value={key}>{value}</option>
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
                            disabled={isSubmitting || isTranscribing}
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
                            disabled={isSubmitting || isTranscribing}
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
                        disabled={isSubmitting || isTranscribing}
                    >
                        <FiXCircle className={styles.buttonIcon} />
                        <span>Cancel</span>
                    </motion.button>

                    {/* ✅ زر الإرسال */}
                    <motion.button
                        type="submit"
                        className={styles.submitButton}
                        disabled={isSubmitting || isTranscribing}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <FiSave className={styles.buttonIcon} />
                        <span>{isSubmitting ? 'Submitting...' : isTranscribing ? 'Transcribing...' : 'Submit Story'}</span>
                    </motion.button>
                </div>
            </form>
        </motion.div>
    );

};

export default AudioStoryForm;