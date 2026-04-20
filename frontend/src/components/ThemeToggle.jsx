// 🌙 زر تغيير الثيم - هنا المستخدم يقدر يغير بين الثيم المظلم والفاتح
// 📍 المكان: frontend/src/components/ThemeToggle.jsx
import { motion } from 'framer-motion';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import styles from './ThemeToggle.module.css';

const ThemeToggle = ({ className = '' }) => {
  const { toggleTheme, isDark } = useTheme(); // خدمة إدارة الثيم

  return (
    <motion.button
      className={`${styles.toggleButton} ${className}`}
      onClick={toggleTheme} // تغيير الثيم عند الضغط
      whileHover={{ scale: 1.05 }} // تكبير عند التمرير
      whileTap={{ scale: 0.95 }} // تصغير عند الضغط
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {/* 🎭 أيقونة متحركة تتغير حسب الثيم */}
      <motion.div
        className={styles.iconWrapper}
        initial={false}
        animate={{ rotate: isDark ? 0 : 180 }} // دوران الأيقونة
        transition={{ duration: 0.3 }}
      >
        {isDark ? (
          <FiSun className={styles.icon} /> // أيقونة الشمس للثيم المظلم
        ) : (
          <FiMoon className={styles.icon} /> // أيقونة القمر للثيم الفاتح
        )}
      </motion.div>
      {/* 📝 نص توضيحي */}
      <span className={styles.label}>
        {isDark ? 'Light' : 'Dark'}
      </span>
    </motion.button>
  );
};

export default ThemeToggle;
