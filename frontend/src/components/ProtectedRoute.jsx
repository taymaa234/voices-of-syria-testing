// 🔒 مسار محمي - يتحقق من تسجيل الدخول والصلاحيات قبل السماح بالوصول للصفحة
// 📍 المكان: frontend/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth(); // بيانات المستخدم الحالي

  // Fallback: some routes/hook instances may mount before state updates,
  // but `localStorage` is the shared source of truth.
  const storedUser = (() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const effectiveUser = user || storedUser;
  
  // 🚫 إذا لم يسجل دخول، يتم توجيهه لصفحة تسجيل الدخول
  if (!effectiveUser) return <Navigate to="/login" replace />;
  
  // 🔐 إذا كانت هناك صلاحيات مطلوبة ولا يملكها المستخدم، يتم توجيهه للصفحة الرئيسية
  if (roles && roles.length > 0 && !roles.includes(effectiveUser.role)) {
    return <Navigate to="/" replace />;
  }
  
  // ✅ إذا كان كل شيء صحيح، يتم عرض المحتوى
  return children;
}
