// 🔐 نموذج تسجيل الدخول - هنا المستخدم يدخل بياناته للوصول للحساب
// 📍 المكان: frontend/src/components/LoginForm.jsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import styles from './LoginForm.module.css';
import { FiMail, FiLock, FiLogIn, FiEye, FiEyeOff, FiUserPlus } from 'react-icons/fi';
import { toast } from 'react-toastify';
import useAuth from '../hooks/useAuth';
import ThemeToggle from './ThemeToggle';

// 🖼️ صور الخلفية - موجودة في مجلد public
const backgroundImages = [
  '/bg-1.jpg',
  '/bg-2.jpg',
  '/bg-3.jpg',
  '/bg-4.jpg',
];

const LoginForm = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  // 📊 حالات النموذج
  const [email, setEmail] = useState(''); // البريد الإلكتروني
  const [password, setPassword] = useState(''); // كلمة المرور
  const [showPassword, setShowPassword] = useState(false); // إظهار/إخفاء كلمة المرور
  const [isSubmitting, setIsSubmitting] = useState(false); // حالة الإرسال
  const [error, setError] = useState(''); // رسائل الخطأ
  const [currentBgIndex, setCurrentBgIndex] = useState(0); // فهرس الصورة الحالية

  // 🔄 تغيير الصورة كل 5 ثواني
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // 🎭 حركات الأزرار
  const buttonVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.98 }
  };

  const { login } = useAuth(); // خدمة تسجيل الدخول

  // 📤 دالة إرسال النموذج
  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');

  // التحقق من الحقول المطلوبة
  if (!email || !password) {
    setError('Please enter both email and password.');
    return;
  }

    try {
      setIsSubmitting(true);
      const result = await login(email, password);
      // حفظ بيانات المستخدم بعد تسجيل الدخول الناجح
      try {
        if (result?.user) localStorage.setItem('user', JSON.stringify(result.user));
      } catch (err) {
        console.warn('Failed to write user to localStorage', err);
      }
      if (!result?.user) throw new Error('Invalid login response');
      toast.success('Login successful');
      onLoginSuccess(result.user.role); // إشعار المكون الأب بنجاح تسجيل الدخول
    } catch (err) {
      console.error('Login error:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
};


 
  return (
    <div className={styles.loginPageWrapper}>
      {/* 🖼️ عرض الصور المتحركة في الخلفية */}
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

      {/* 🔘 مؤشرات الصور */}
      <div className={styles.slideIndicators}>
        {backgroundImages.map((_, index) => (
          <button
            key={index}
            className={`${styles.indicator} ${index === currentBgIndex ? styles.activeIndicator : ''}`}
            onClick={() => setCurrentBgIndex(index)}
          />
        ))}
      </div>

      {/* 🌙 زر تغيير الثيم */}
      <div className={styles.themeToggleWrapper}>
        <ThemeToggle />
      </div>
      
      {/* 📋 نموذج تسجيل الدخول */}
      <motion.div
        key="login-form"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ type: 'tween', duration: 0.4 }}
        className={styles.loginContainer}
      >
        {/* 📋 رأس النموذج */}
        <div className={styles.formHeader}>
          <h2 className={styles.formTitle}>Welcome Back</h2>
          <p className={styles.formSubtitle}>Sign in to continue to your account</p>
        </div>

        {/* ⚠️ رسالة الخطأ */}
        {error && (
          <motion.div
            className={styles.errorMessage}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className={styles.loginForm} autoComplete="on">
          {/* 📧 حقل البريد الإلكتروني */}
          <div className={styles.inputGroup}>
            <FiMail className={styles.inputIcon} />
            <input
              type="email"
              name="email"
              id="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.inputField}
              required
              disabled={isSubmitting}
              autoComplete="email"
            />
          </div>

          {/* 🔒 حقل كلمة المرور */}
          <div className={styles.inputGroup}>
            <FiLock className={styles.inputIcon} />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              id="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.inputField}
              required
              disabled={isSubmitting}
              autoComplete="current-password"
            />
            {/* 👁️ زر إظهار/إخفاء كلمة المرور */}
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowPassword(!showPassword)}
              disabled={isSubmitting}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          {/* 🔗 رابط نسيان كلمة المرور */}
          <div className={styles.forgotPasswordContainer}>
            <a
              href="#"
              onClick={(e) => { 
                e.preventDefault(); 
                navigate('/reset-password');
              }}
              className={styles.forgotPasswordLink}
            >
              Forgot Password?
            </a>
          </div>

          {/* 🔐 زر تسجيل الدخول */}
          <motion.button
            type="submit"
            className={styles.loginButton}
            variants={buttonVariants}
            initial="rest"
            whileHover="hover"
            whileTap="tap"
            disabled={isSubmitting}
          >
            <FiLogIn className={styles.buttonIcon} />
            <span>{isSubmitting ? 'Logging In...' : 'Log In'}</span>
          </motion.button>

          {/* 👤 زر المتابعة كزائر */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className={styles.backButton}
            disabled={isSubmitting}
          >
            Continue as Visitor
          </button>
        </form>

        {/* 📝 قسم إنشاء حساب جديد */}
        <div className={styles.signUpSection}>
          <div className={styles.divider}>
            <span>or</span>
          </div>
          <p className={styles.signUpText}>
            Don't have an account?
          </p>
          <motion.button
            type="button"
            onClick={() => navigate('/signup')}
            className={styles.signUpButton}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FiUserPlus className={styles.signUpIcon} />
            <span>Create New Account</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginForm;