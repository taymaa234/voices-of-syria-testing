// 🏷️ مكون العلامة التجارية - يعرض اسم وشعار التطبيق في صفحة تسجيل الدخول
// 📍 المكان: frontend/src/components/Branding.jsx

import React from 'react';
import { motion } from 'framer-motion';
import styles from './Branding.module.css';

const Branding = () => {
  const containerVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 50,
        damping: 20,
        delay: 0.3
      }
    },
  };

  return (
    <motion.div
      className={styles.brandingContainer}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h2
        className={styles.title}
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, type: 'spring', stiffness: 80 }}
      >
        Voices Of Syria
      </motion.h2>

      <motion.p
        className={styles.subtitle}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
      >
        منبرك الاحترافي لتوثيق القصص والوصول إلى أوسع جمهور عربي. سجل الدخول لبدء النشر.
      </motion.p>
    </motion.div>
  );
};

export default Branding;