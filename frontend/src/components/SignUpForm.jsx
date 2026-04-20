// 📝 نموذج إنشاء حساب جديد - هنا المستخدم ينشئ حساب جديد ويتحقق من البريد الإلكتروني
// 📍 المكان: frontend/src/components/SignUpForm.jsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import styles from './LoginForm.module.css'; // استخدام نفس تنسيق صفحة تسجيل الدخول
import { FiMail, FiLock, FiUser, FiArrowLeft, FiUserPlus, FiEye, FiEyeOff } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { registerUser, verifyEmail } from '../api/authService';

const backgroundImages = [
  '/bg-1.jpg',
  '/bg-2.jpg',
  '/bg-3.jpg',
  '/bg-4.jpg',
];

const SignUpForm = () => {
  const navigate = useNavigate();
  
  // 📊 حالات بيانات النموذج
  const [fullName, setFullName] = useState(''); // الاسم الكامل
  const [email, setEmail] = useState(''); // البريد الإلكتروني
  const [password, setPassword] = useState(''); // كلمة المرور
  const [verificationCode, setVerificationCode] = useState(''); // كود التحقق
  const [showPassword, setShowPassword] = useState(false); // إظهار/إخفاء كلمة المرور
  
  // ⚙️ حالات العمليات
  const [isSubmitting, setIsSubmitting] = useState(false); // حالة إنشاء الحساب
  const [isVerifying, setIsVerifying] = useState(false); // حالة التحقق من البريد
  const [showVerification, setShowVerification] = useState(false); // إظهار نموذج التحقق
  const [error, setError] = useState(''); // رسائل الخطأ
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // ✅ دالة التحقق من البريد الإلكتروني
  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');

    if (!verificationCode.trim()) {
      setError('Please enter verification code');
      return;
    }

    try {
      setIsVerifying(true);
      await verifyEmail({ email, code: verificationCode });
      toast.success('Email verified successfully! You can now login.');
      navigate('/login'); // الانتقال لصفحة تسجيل الدخول
    } catch (err) {
      setError(err.message || 'Verification failed');
      toast.error(err.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  // 📤 دالة إنشاء الحساب
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // التحقق من الحقول المطلوبة
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    // التحقق من طول كلمة المرور
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setIsSubmitting(true);
      await registerUser({ name: fullName, email, password });
      toast.success('Account created! Please check your email for verification code.');
      setShowVerification(true); // إظهار نموذج التحقق
    } catch (err) {
      setError(err.message || 'Failed to create account');
      toast.error(err.message || 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.loginPageWrapper}>
      {/* 🖼️ خلفية الصور المتحركة */}
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
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className={styles.loginContainer}
      >
        {/* 📋 رأس النموذج */}
        <div className={styles.formHeader}>
          <h2 className={styles.formTitle}>Create Account</h2>
          <p className={styles.formSubtitle}>Join us to start sharing your stories</p>
        </div>

        {/* 📝 نموذج إنشاء الحساب */}
        <form onSubmit={handleSubmit} className={styles.loginForm}>
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

          {/* 👤 حقل الاسم الكامل */}
          <div className={styles.inputGroup}>
            <FiUser className={styles.inputIcon} />
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={styles.inputField}
              required
            />
          </div>

          {/* 📧 حقل البريد الإلكتروني */}
          <div className={styles.inputGroup}>
            <FiMail className={styles.inputIcon} />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.inputField}
              required
            />
          </div>

          {/* 🔒 حقل كلمة المرور */}
          <div className={styles.inputGroup}>
            <FiLock className={styles.inputIcon} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.inputField}
              required
            />
            {/* 👁️ زر إظهار/إخفاء كلمة المرور */}
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          {/* ✅ زر إنشاء الحساب */}
          <motion.button
            type="submit"
            className={styles.loginButton}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isSubmitting}
          >
            <FiUserPlus className={styles.buttonIcon} />
            <span>{isSubmitting ? 'Creating Account...' : 'Sign Up'}</span>
          </motion.button>
        </form>

        {/* 📧 نموذج التحقق من البريد الإلكتروني */}
        {showVerification && (
          <motion.form
            onSubmit={handleVerify}
            className={styles.loginForm}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className={styles.verificationTitle}>Verify Your Email</h3>
            <p className={styles.verificationText}>
              We've sent a verification code to {email}
            </p>

            {/* 🔢 حقل كود التحقق */}
            <div className={styles.inputGroup}>
              <FiMail className={styles.inputIcon} />
              <input
                type="text"
                placeholder="Enter verification code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className={styles.inputField}
                required
              />
            </div>

            {/* ✅ زر التحقق */}
            <motion.button
              type="submit"
              disabled={isVerifying}
              className={styles.loginButton}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isVerifying ? 'Verifying...' : 'Verify Email'}
            </motion.button>
          </motion.form>
        )}

        {/* 🔗 قسم العودة لتسجيل الدخول */}
        <div className={styles.signUpSection}>
          <div className={styles.divider}>
            <span>Already have an account?</span>
          </div>
          
          {/* 🔙 زر العودة لتسجيل الدخول */}
          <motion.button
            type="button"
            onClick={() => navigate('/login')}
            className={styles.backButton}
            whileHover={{ x: -5 }}
          >
            <FiArrowLeft /> Back to Login
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default SignUpForm;