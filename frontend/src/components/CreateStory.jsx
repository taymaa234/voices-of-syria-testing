// 📝 صفحة إنشاء قصة جديدة - هنا المستخدم يختار نوع القصة (نص/صوت/فيديو)
// 📍 المكان: frontend/src/components/CreateStory.jsx

import React, { useState } from 'react'; // ⬅️ إضافة useState
import { motion, AnimatePresence } from 'framer-motion'; // ⬅️ إضافة AnimatePresence
import { FiFileText, FiMic, FiVideo, FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import styles from './CreateStory.module.css';
import TextStoryForm from './TextStoryForm'; // ⬅️ استيراد المكون الجديد
import AudioStoryForm from './AudioStoryForm';
import VideoStoryForm from './VideoStoryForm';

const Screen = {
    TYPE_SELECTION: 'selection',
    TEXT_FORM: 'TEXT', // ⬅️ تم التعديل
    AUDIO_FORM: 'AUDIO', // ⬅️ تم التعديل
    VIDEO_FORM: 'VIDEO', // ⬅️ تم التعديل
};

// ⬅️ المكون يستقبل onBack للعودة للداشبورد (وسيتم استخدامه في onSuccess)
const CreateStory = ({ onBack }) => {
    // حالة لتتبع الشاشة الحالية
    const [currentScreen, setCurrentScreen] = useState(Screen.TYPE_SELECTION);
    // حالة لتخزين نوع القصة المختار (إذا احتجناه لاحقاً)
    const [selectedType, setSelectedType] = useState(null);

const storyTypes = [
        {
            id: 'TEXT', // ⬅️ تم التعديل: مطابقة اسم الـ API
            title: 'Text Story',
            description: 'Write your story as text',
            icon: FiFileText,
            color: '#4299e1',
            gradient: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)',
        },
   {
            id: 'AUDIO', // ⬅️ تم التعديل: مطابقة اسم الـ API
            title: 'Audio Story',
            description: 'Record or upload an audio file',
            icon: FiMic,
            color: '#48bb78',
            gradient: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
            disabled: false,
        },
  {
            id: 'VIDEO', // ⬅️ تم التعديل: مطابقة اسم الـ API
            title: 'Video Story',
            description: 'Upload or record a video',
            icon: FiVideo,
            color: '#ed8936',
            gradient: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)',
        },
    ];

 const handleTypeSelect = (typeId) => {
        setSelectedType(typeId);
        // ⬅️ تم تعديل logic الانتقال لتستخدم الـ id مباشرة (الذي يطابق الـ Screen)
        if (typeId === 'TEXT') {
            setCurrentScreen(Screen.TEXT_FORM);
        } else if (typeId === 'AUDIO') {
            setCurrentScreen(Screen.AUDIO_FORM);
        } else if (typeId === 'VIDEO') {
            setCurrentScreen(Screen.VIDEO_FORM);
        }
    };

    // دالة العودة لشاشة اختيار النوع
    const handleCancelForm = () => {
        setSelectedType(null);
        setCurrentScreen(Screen.TYPE_SELECTION);
    };


    // --- Render Functions ---

    // 🎯 شاشة اختيار نوع القصة - النص أو الصوت أو الفيديو
    const renderTypeSelection = () => (
        <motion.div
            key="selection"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
        >
            <header className={styles.header}>
              {/* 🔙 زر العودة للداشبورد */}
              <button className={styles.backButton} onClick={onBack}>
  <FiArrowLeft /> Back to Dashboard
</button>
                <h1 className={styles.pageTitle}>Create New Story</h1>
                <p className={styles.subtitle}>Choose how you want to add your story</p>
            </header>

            {/* 🎨 بطاقات اختيار نوع القصة */}
            <div className={styles.typeSelection}>
                {storyTypes.map((type, index) => {
                    const IconComponent = type.icon;
                    return (
                        <motion.div
                            key={type.id}
                            className={`${styles.typeCard} ${type.disabled ? styles.disabledCard : ''}`}
                            onClick={() => !type.disabled && handleTypeSelect(type.id)}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={type.disabled ? {} : { scale: 1.02, y: -5 }}
                            whileTap={type.disabled ? {} : { scale: 0.98 }}
                            style={type.disabled ? { cursor: 'not-allowed', opacity: 0.6 } : {}}
                        >
                            <div
                                className={styles.iconContainer}
                                style={{ background: type.gradient }}
                            >
                                <IconComponent className={styles.icon} />
                            </div>
                            <h3 className={styles.typeTitle}>{type.title}</h3>
                            <p className={styles.typeDescription}>{type.description}</p>
                            {type.disabled && (
                                <div className={styles.comingSoonBadge}>
                                    <FiAlertCircle style={{ marginLeft: '5px' }} />
                                    Coming Soon
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );

   // 📝 عرض النموذج المناسب حسب نوع القصة المختار
   const renderForm = () => {
        switch (currentScreen) {
            case Screen.TEXT_FORM: // (التي أصبحت 'TEXT')
                return (
                    <TextStoryForm
                        onCancel={handleCancelForm}
                        onSuccess={onBack} 
                    />
                );
            case Screen.AUDIO_FORM: // (التي أصبحت 'AUDIO')
                return (
                    <AudioStoryForm
                        onCancel={handleCancelForm}
                        onSuccess={onBack} 
                    />
                );
            case Screen.VIDEO_FORM: // (التي أصبحت 'VIDEO')
                return (
                    <VideoStoryForm
                        onCancel={handleCancelForm}
                        onSuccess={onBack} 
                    />
                );
            default:
                return null;
        }
    };


    // --- Component Return ---

    return (
        <div className={styles.createStoryContainer}>
            <AnimatePresence mode="wait">
                {currentScreen === Screen.TYPE_SELECTION
                    ? renderTypeSelection()
                    : renderForm()}
            </AnimatePresence>
        </div>
    );
};

export default CreateStory;