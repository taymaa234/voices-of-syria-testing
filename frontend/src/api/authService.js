import client from './client';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from './config';

const authBase = '/auth';

export const registerUser = async ({ name, email, password, role } = {}) => {
  const body = { name, email, password };
  if (role) body.role = role;
  const res = await client.post(`${authBase}/register`, body);
  return res.data;
};

export const verifyEmail = async ({ email, code }) => {
  const res = await client.post(`${authBase}/verify`, null, {
    params: { email, code },
  });
  return res.data;
};

export const requestPasswordReset = async (email) => {
  const res = await client.post(`${authBase}/forgot-password`, { email });
  return res.data;
};

export const verifyResetCode = async ({ email, code }) => {
  const res = await client.post(`${authBase}/verify-reset-code`, { email, code });
  return res.data;
};

export const resetPassword = async ({ email, code, newPassword }) => {
  const res = await client.post(`${authBase}/reset-password`, { email, code, password: newPassword });
  return res.data;
};

export const loginUser = async ({ email, password }) => {
  console.log('Login attempt:', { email, password: '***' }); // ⬅️ logging للبيانات المرسلة
  try {
    const res = await client.post(`${authBase}/login`, { email, password });
    console.log('Login response:', res.data); // ⬅️ logging للـ response
    const data = res.data;
    if (data?.accessToken) {
      console.log('Saving access token');
      localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    }
    if (data?.refreshToken) {
      console.log('Saving refresh token');
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    }
    if (data?.user) {
      console.log('User object from login:', data.user); // ⬅️ logging للـ user object
      try { localStorage.setItem('user', JSON.stringify(data.user)); } catch (e) {}
    }
    return data;
  } catch (error) {
    console.error('Login API error:', error); // ⬅️ logging للخطأ
    console.error('Error response:', error.response?.data); // ⬅️ logging لتفاصيل الخطأ
    throw error;
  }
};;

export const logoutUser = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem('user');
};

export const refreshToken = async (refreshToken) => {
  const res = await client.post(`${authBase}/refresh-token`, { refreshToken });
  return res.data;
};

export const uploadAvatar = async (formData) => {
  const res = await client.post(`${authBase}/profile/avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

// الحصول على بيانات المستخدم الحالي
export const getCurrentUser = async () => {
  const res = await client.get('/user/me');
  return res.data;
};

// تحديث بيانات البروفايل (الاسم وصورة البروفايل)
export const updateProfile = async ({ name, profileImageUrl }) => {
  const res = await client.put('/user/profile', { name, profileImageUrl });
  // تحديث localStorage
  if (res.data) {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const updatedUser = { ...currentUser, ...res.data };
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }
  return res.data;
};

// تغيير كلمة المرور
export const changePassword = async ({ currentPassword, newPassword }) => {
  const res = await client.put('/user/change-password', { currentPassword, newPassword });
  return res.data;
};

// NOTE: Super-admin creation is protected on the backend and must be performed
// via the `/super-admin/admins` endpoints by an authenticated SUPER_ADMIN.
// The previous helper attempted to register a SUPER_ADMIN via `/auth/register`,
// but `UserService.register()` forces new users to `UserRole.USER`.
// Keep no client helper here to avoid confusion.
