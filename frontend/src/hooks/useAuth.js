// 🔐 هوك المصادقة - يدير حالة تسجيل الدخول والمستخدم الحالي
// 📍 المكان: frontend/src/hooks/useAuth.js
import { useState, useEffect, useCallback } from 'react';
import * as authService from '../api/authService';
import { ACCESS_TOKEN_KEY } from '../api/config';

const USER_KEY = 'user';
const AUTH_UPDATED_EVENT = 'auth:updated';

const loadStoredUser = () => {
  try {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.error('❌ useAuth: Error parsing stored user:', e);
    return null;
  }
};

export default function useAuth() {
  // 👤 حالة المستخدم الحالي - يتم تحميلها من localStorage
  const [user, setUser] = useState(() => {
    try {
      return loadStoredUser();
    } catch (e) {
      console.error('❌ useAuth: Error parsing user from localStorage:', e);
      return null;
    }
  });
  
  // ⚙️ حالات العمليات
  const [loading, setLoading] = useState(false); // حالة التحميل
  const [error, setError] = useState(null); // رسائل الخطأ

  // 🔐 دالة تسجيل الدخول
  const login = useCallback(async (email, password) => {
    setLoading(true); setError(null);
    try {
      const data = await authService.loginUser({ email, password });
      console.log('useAuth: Login successful, user data:', data?.user);
      console.log('useAuth: User ID:', data?.user?.id, 'Type:', typeof data?.user?.id);
      if (data?.user) {
        setUser(data.user);
        try { localStorage.setItem(USER_KEY, JSON.stringify(data.user)); } catch (e) {}
      }
      // Sync other hook instances (ProtectedRoute/App/etc) in the same tab.
      window.dispatchEvent(new Event(AUTH_UPDATED_EVENT));
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logoutUser();
    setUser(null);
    window.dispatchEvent(new Event(AUTH_UPDATED_EVENT));
    // ⬅️ إعادة توجيه لصفحة تسجيل الدخول
    window.location.href = '/login';
  }, []);

  const register = useCallback(async (payload) => {
    setLoading(true); setError(null);
    try {
      const res = await authService.registerUser(payload);
      return res;
    } catch (err) { setError(err); throw err; } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const syncFromStorage = () => {
      // Prefer storage as the source of truth (login may write before React state sync).
      setUser(loadStoredUser());
    };

    // Initial sync (in case something wrote to localStorage before this hook mounted).
    syncFromStorage();

    window.addEventListener(AUTH_UPDATED_EVENT, syncFromStorage);
    return () => window.removeEventListener(AUTH_UPDATED_EVENT, syncFromStorage);
  }, []);

  return { user, loading, error, login, logout, register };
}
