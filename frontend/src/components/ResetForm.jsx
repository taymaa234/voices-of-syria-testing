// 🔄 نموذج استعادة كلمة المرور - يسمح للمستخدمين بإعادة تعيين كلمة المرور عبر البريد الإلكتروني
// 📍 المكان: frontend/src/components/ResetForm.jsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiArrowLeft, FiSend, FiCheckCircle, FiLock, FiKey } from 'react-icons/fi';
import styles from './LoginForm.module.css';
import { toast } from 'react-toastify';
import { requestPasswordReset, verifyResetCode, resetPassword } from '../api/authService';

const ResetForm = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email, 2: code, 3: new password, 4: success
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Send reset code
  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('يرجى إدخال البريد الإلكتروني');
      return;
    }

    try {
      setIsSubmitting(true);
      await requestPasswordReset(email);
      setStep(2);
      toast.success('تم إرسال رمز التحقق إلى بريدك الإلكتروني');
    } catch (err) {
      setError(err.response?.data || 'فشل في إرسال رمز التحقق');
      toast.error('فشل في إرسال رمز التحقق');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');

    if (!code.trim()) {
      setError('يرجى إدخال رمز التحقق');
      return;
    }

    try {
      setIsSubmitting(true);
      await verifyResetCode({ email, code });
      setStep(3);
      toast.success('رمز التحقق صحيح');
    } catch (err) {
      setError(err.response?.data || 'رمز التحقق غير صحيح');
      toast.error('رمز التحقق غير صحيح');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword.trim()) {
      setError('يرجى إدخال كلمة السر الجديدة');
      return;
    }

    if (newPassword.length < 6) {
      setError('كلمة السر يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('كلمتا السر غير متطابقتين');
      return;
    }

    try {
      setIsSubmitting(true);
      await resetPassword({ email, code, newPassword });
      setStep(4);
      toast.success('تم تغيير كلمة السر بنجاح!');
    } catch (err) {
      setError(err.response?.data || 'فشل في تغيير كلمة السر');
      toast.error('فشل في تغيير كلمة السر');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <form onSubmit={handleSendCode} className={styles.loginForm}>
            {error && (
              <motion.div
                className={styles.errorMessage}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            <div className={styles.inputGroup}>
              <FiMail className={styles.inputIcon} />
              <input
                type="email"
                placeholder="البريد الإلكتروني"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.inputField}
                required
                disabled={isSubmitting}
                dir="ltr"
              />
            </div>

            <motion.button
              type="submit"
              className={styles.loginButton}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
            >
              <FiSend className={styles.buttonIcon} />
              <span>{isSubmitting ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}</span>
            </motion.button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className={styles.backButton}
              disabled={isSubmitting}
            >
              <FiArrowLeft /> العودة لتسجيل الدخول
            </button>
          </form>
        );

      case 2:
        return (
          <form onSubmit={handleVerifyCode} className={styles.loginForm}>
            {error && (
              <motion.div
                className={styles.errorMessage}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
              تم إرسال رمز التحقق إلى: <strong>{email}</strong>
            </p>

            <div className={styles.inputGroup}>
              <FiKey className={styles.inputIcon} />
              <input
                type="text"
                placeholder="رمز التحقق (6 أرقام)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={styles.inputField}
                required
                disabled={isSubmitting}
                maxLength={6}
                dir="ltr"
                style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.2rem' }}
              />
            </div>

            <motion.button
              type="submit"
              className={styles.loginButton}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? 'جاري التحقق...' : 'تحقق من الرمز'}</span>
            </motion.button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className={styles.backButton}
              disabled={isSubmitting}
            >
              <FiArrowLeft /> تغيير البريد الإلكتروني
            </button>
          </form>
        );

      case 3:
        return (
          <form onSubmit={handleResetPassword} className={styles.loginForm}>
            {error && (
              <motion.div
                className={styles.errorMessage}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            <div className={styles.inputGroup}>
              <FiLock className={styles.inputIcon} />
              <input
                type="password"
                placeholder="كلمة السر الجديدة"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={styles.inputField}
                required
                disabled={isSubmitting}
                minLength={6}
              />
            </div>

            <div className={styles.inputGroup}>
              <FiLock className={styles.inputIcon} />
              <input
                type="password"
                placeholder="تأكيد كلمة السر"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={styles.inputField}
                required
                disabled={isSubmitting}
                minLength={6}
              />
            </div>

            <motion.button
              type="submit"
              className={styles.loginButton}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? 'جاري التغيير...' : 'تغيير كلمة السر'}</span>
            </motion.button>
          </form>
        );

      case 4:
        return (
          <motion.div 
            className={styles.successState}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className={styles.successIconWrapper}>
              <FiCheckCircle size={48} color="#48bb78" />
            </div>
            <p style={{ textAlign: 'center', marginBottom: '10px' }}>
              تم تغيير كلمة السر بنجاح!
            </p>
            <p style={{ textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>
              يمكنك الآن تسجيل الدخول بكلمة السر الجديدة
            </p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className={styles.loginButton}
              style={{ marginTop: '20px' }}
            >
              تسجيل الدخول
            </button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (step) {
      case 1: return 'استعادة كلمة السر';
      case 2: return 'إدخال رمز التحقق';
      case 3: return 'كلمة السر الجديدة';
      case 4: return 'تم بنجاح!';
      default: return 'استعادة كلمة السر';
    }
  };

  const getSubtitle = () => {
    switch (step) {
      case 1: return 'أدخل بريدك الإلكتروني لاستلام رمز التحقق';
      case 2: return 'أدخل الرمز المكون من 6 أرقام';
      case 3: return 'أدخل كلمة السر الجديدة';
      case 4: return '';
      default: return '';
    }
  };

  return (
    <div className={styles.loginPageWrapper}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={styles.loginContainer}
      >
        <div className={styles.formHeader}>
          <h2 className={styles.formTitle}>{getTitle()}</h2>
          {getSubtitle() && (
            <p className={styles.formSubtitle}>{getSubtitle()}</p>
          )}
          
          {/* Progress indicator */}
          {step < 4 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '8px', 
              marginTop: '15px' 
            }}>
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: s <= step ? '#3182ce' : '#e2e8f0',
                    transition: 'background-color 0.3s'
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {renderStep()}
      </motion.div>
    </div>
  );
};

export default ResetForm;
