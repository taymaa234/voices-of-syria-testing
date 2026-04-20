import client from './client';
import axios from 'axios';
import { BASE_URL, API_BASE_PATH } from './config';

// إنشاء client بدون توكن للطلبات العامة
const publicClient = axios.create({
  baseURL: `${process.env.REACT_APP_BASE_URL || BASE_URL || ''}${process.env.REACT_APP_API_BASE_PATH || API_BASE_PATH || ''}`,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

/**
 * جلب تعليقات قصة معينة
 */
export const getCommentsByStory = async (storyId) => {
  const res = await publicClient.get(`/public/comments/story/${storyId}`);
  return res.data;
};

/**
 * إضافة تعليق جديد
 * @param {boolean} asGuest - إذا true، يرسل الطلب بدون توكن
 */
export const addComment = async (storyId, content, authorName = null, asGuest = false) => {
  const body = { content };
  if (authorName) {
    body.authorName = authorName;
  }
  
  // إذا كان زائر، نستخدم publicClient بدون توكن
  if (asGuest) {
    const res = await publicClient.post(`/public/comments/story/${storyId}`, body);
    return res.data;
  }
  
  // إذا كان مستخدم مسجل، نستخدم client مع التوكن
  const res = await client.post(`/public/comments/story/${storyId}`, body);
  return res.data;
};

/**
 * حذف تعليق
 */
export const deleteComment = async (commentId) => {
  const res = await client.delete(`/comments/${commentId}`);
  return res.data;
};

/**
 * حذف تعليق بواسطة الضيف باستخدام التوكن
 */
export const deleteGuestComment = async (commentId, deleteToken) => {
  const res = await publicClient.delete(`/public/comments/${commentId}?deleteToken=${deleteToken}`);
  return res.data;
};

/**
 * حذف تعليق بواسطة الأدمن
 */
export const deleteCommentByAdmin = async (commentId) => {
  const res = await client.delete(`/admin/comments/${commentId}`);
  return res.data;
};

/**
 * جلب عدد التعليقات على قصة
 */
export const getCommentsCount = async (storyId) => {
  const res = await publicClient.get(`/public/comments/story/${storyId}/count`);
  return res.data;
};
