// 🎥 نموذج إنشاء قصة فيديو - هنا المستخدم يرفع ملف فيديو ويدخل تفاصيل القصة
// 📍 المكان: frontend/src/components/VideoStoryForm.jsx

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './StoryForm.module.css';
import { FiSave, FiXCircle, FiVideo, FiUploadCloud, FiTrash2, FiCheckCircle, FiPlay, FiLoader } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { PROVINCES_MAP } from '../utils/constants';
import useStories from '../hooks/useStories';
import { transcribeAudio } from '../api/transcriptionService';

// 📏 حدود حجم الملف
const MAX_FILE_SIZE_MB = 200;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const VideoStoryForm = ({ onCancel, onSuccess }) => {
    // 📊 حالات بيانات القصة
    const [title, setTitle] = useState(''); // عنوان القصة
    const [videoFile, setVideoFile] = useState(null); // ملف الفيديو
    const [textContent, setTextContent] = useState(''); // النص المفرغ من الفيديو
    
    // 📍 حالات البيانات الوصفية
    const [province, setProvince] = useState(''); // المحافظة
    const [incidentDate, setIncidentDate] = useState(''); // تاريخ الحادثة
    const [attacker, setAttacker] = useState(''); // الجهة المسؤولة

    // ⚙️ حالات العمليات
    const [isSubmitting, setIsSubmitting] = useState(false); // حالة الإرسال
    const [isTranscribing, setIsTranscribing] = useState(false); // حالة التفريغ
    const [uploadProgress, setUploadProgress] = useState(0); // تقدم الرفع
    const [error, setError] = useState(''); // رسائل الخطأ
    
    const { submit } = useStories(); // خدمة إرسال القصص
    const fileInputRef = useRef(null); // مرجع لحقل رفع الملف

    // 📤 التعامل مع اختيار ملف الفيديو
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type.startsWith('video/')) {
                if (file.size > MAX_FILE_SIZE_BYTES) {
                    setError(`File is too large. Max size is ${MAX_FILE_SIZE_MB}MB.`);
                    setVideoFile(null);
                } else {
                    setVideoFile(file);
                    setError('');
                }
            } else {
                setError('Please select a valid video file.');
                setVideoFile(null);
            }
        }
    };

    // 🎤 دالة تفريغ الصوت من الفيديو إلى نص
    const handleTranscribe = async () => {
        if (!videoFile) {
            toast.error('يرجى رفع ملف فيديو أولاً');
            return;
        }

        setIsTranscribing(true);
        setError('');
        
        // Show progress message
        toast.info('جاري تفريغ الملف... قد يستغرق عدة دقائق', { autoClose: false, toastId: 'transcribing' });

        try {
            const result = await transcribeAudio(videoFile, 'ar'); // Specify Arabic language

            // Dismiss progress message
            toast.dismiss('transcribing');

            if (result.success) {
                setTextContent(result.transcript);
                toast.success(`تم النسخ بنجاح! (${result.processing_time?.toFixed(1)} ثانية)`, { autoClose: 4000 });
            } else {
                setError(result.error);
                toast.error(`فشل في النسخ: ${result.error}`);
            }
        } catch (err) {
            // Dismiss progress message
            toast.dismiss('transcribing');
            
            const errorMessage = 'حدث خطأ أثناء النسخ. يرجى المحاولة مرة أخرى.';
            setError(errorMessage);
            toast.error(errorMessage);
            console.error('Transcription error:', err);
        } finally {
            setIsTranscribing(false);
        }
    };

    const handleSubmit = async (e) => {
        console.log('🔵 handleSubmit called');
        e.preventDefault();
        
        console.log('📋 Form data:', { videoFile, title, province, incidentDate });
        
        if (!videoFile || !title || !province || !incidentDate) {
            const errorMsg = 'Please fill in all required fields and select a video.';
            console.log('❌ Validation failed:', errorMsg);
            setError(errorMsg);
            toast.error(errorMsg);
            return;
        }

        console.log('✅ Validation passed, starting submission...');
        setIsSubmitting(true);
        setError('');
        setUploadProgress(0);

        // Build payload
        const storyPayload = {
            title: title,
            textContent: textContent || null,
            type: 'VIDEO',
            attacker: attacker || null,
            incidentDate: incidentDate,
            province: province,
        };

        console.log('📦 Story payload:', storyPayload);

        const formData = new FormData();
        formData.append('story', JSON.stringify(storyPayload));
        formData.append('file', videoFile);

        try {
            console.log('🚀 Calling submit function...');
            await submit(formData, 'multipart/form-data', {
                onUploadProgress: (e) => {
                    if (e.total) setUploadProgress(Math.round((e.loaded * 100) / e.total));
                }
            });
            setUploadProgress(100);
            console.log('✅ Submission successful!');
            toast.success('Video story submitted successfully!');
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error('❌ Submission error:', err);
            const errorMsg = err.message || 'An error occurred during upload. Please try again.';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setIsSubmitting(false);
            console.log('🏁 Submission process completed');
        }
    };

    return (
        <motion.div 
            className={styles.formCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className={styles.formHeader}>
                <div className={styles.iconCircle}>
                    <FiVideo />
                </div>
                <h2>Share Video Story</h2>
                <p>Upload your video testimony (Max {MAX_FILE_SIZE_MB}MB)</p>
            </div>

            {error && <div className={styles.errorAlert}>{error}</div>}

            <form onSubmit={(e) => {
                console.log('🔴 Form onSubmit triggered');
                handleSubmit(e);
            }}>
                {/* Title Input */}
                <div className={styles.inputGroup}>
                    <label>Story Title *</label>
                    <input
                        type="text"
                        placeholder="e.g., My testimony from Homs..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className={styles.inputField}
                        disabled={isSubmitting || isTranscribing}
                    />
                </div>

                {/* Text Content Field (اختياري) */}
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

                {/* Video Upload Area */}
                {!videoFile ? (
                    <div 
                        className={styles.uploadArea}
                        onClick={() => !isSubmitting && fileInputRef.current.click()}
                    >
                        <FiUploadCloud className={styles.uploadIcon} />
                        <p className={styles.uploadText}>Click to upload video</p>
                        <p className={styles.uploadSubtext}>MP4, MOV or AVI (Max {MAX_FILE_SIZE_MB}MB)</p>
                        <input 
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="video/*"
                            style={{ display: 'none' }}
                        />
                    </div>
                ) : (
                    <div className={styles.filePreview}>
                        <div className={styles.fileInfo}>
                            <FiVideo className={styles.fileIcon} />
                            <span className={styles.fileName}>{videoFile.name}</span>
                        </div>
                        <div className={styles.fileActions}>
                            <button
                                type="button"
                                onClick={handleTranscribe}
                                className={styles.transcribeButton}
                                disabled={isSubmitting || isTranscribing}
                                title="تفريغ الصوت من الفيديو إلى نص"
                            >
                                {isTranscribing ? (
                                    <FiLoader size={16} className={styles.spinning} />
                                ) : (
                                    <FiPlay size={16} />
                                )}
                                {isTranscribing ? 'جاري تفريغ...' : 'تفريغ'}
                            </button>
                            <button
                                type="button"
                                className={styles.removeBtn}
                                onClick={() => setVideoFile(null)}
                                disabled={isSubmitting || isTranscribing}
                            >
                                <FiTrash2 />
                            </button>
                        </div>
                    </div>
                )}

                {/* شريط التقدم الجديد (يظهر فقط أثناء الرفع) */}
                <AnimatePresence>
                    {isSubmitting && (
                        <motion.div 
                            className={styles.progressContainer}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <div className={styles.progressLabel}>
                                <span>{uploadProgress < 100 ? 'Uploading your story...' : 'Processing...'}</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <div className={styles.progressBarWrapper}>
                                <motion.div 
                                    className={styles.progressBarFill}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${uploadProgress}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Metadata Grid */}
                <div className={styles.metaDataGrid}>
                    {/* Province */}
                    <div className={styles.inputGroup}>
                        <label htmlFor="province">المحافظة (Province) *</label>
                        <select
                            id="province"
                            value={province}
                            onChange={(e) => setProvince(e.target.value)}
                            className={styles.inputField}
                            required
                            disabled={isSubmitting || isTranscribing}
                        >
                            <option value="">اختر المحافظة...</option>
                            {Object.entries(PROVINCES_MAP).map(([key, value]) => (
                                <option key={key} value={key}>{value}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date */}
                    <div className={styles.inputGroup}>
                        <label htmlFor="incidentDate">تاريخ الحادثة (Date of Incident) *</label>
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

                    {/* Attacker - NEW FIELD */}
                    <div className={styles.inputGroup}>
                        <label htmlFor="attacker">المهاجم/الجهة المسؤولة (Attacker) - اختياري</label>
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

                {/* Action Buttons */}
                <div className={styles.buttonRow}>
                    <button
                        type="button"
                        className={styles.ghostButton}
                        onClick={onCancel}
                        disabled={isSubmitting || isTranscribing}
                    >
                        <FiXCircle /> Cancel
                    </button>

                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={isSubmitting || isTranscribing}
                    >
                        {isSubmitting ? (
                            <><FiSave /> Uploading...</>
                        ) : (
                            <><FiCheckCircle /> Submit Story</>
                        )}
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

export default VideoStoryForm;