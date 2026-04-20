import client from './client';

/**
 * Add a story to bookmarks
 */
export const addBookmark = async (storyId) => {
  const res = await client.post(`/api/bookmarks/${storyId}`);
  return res.data;
};

/**
 * Remove a story from bookmarks
 */
export const removeBookmark = async (storyId) => {
  const res = await client.delete(`/api/bookmarks/${storyId}`);
  return res.data;
};

/**
 * Toggle bookmark status
 */
export const toggleBookmark = async (storyId) => {
  const res = await client.post(`/api/bookmarks/toggle/${storyId}`);
  return res.data;
};

/**
 * Get all bookmarks for the current user
 */
export const getBookmarks = async () => {
  const res = await client.get('/api/bookmarks');
  return res.data;
};

/**
 * Check if a story is bookmarked
 */
export const checkBookmark = async (storyId) => {
  const res = await client.get(`/api/bookmarks/check/${storyId}`);
  return res.data;
};

/**
 * Get list of bookmarked story IDs
 */
export const getBookmarkedIds = async () => {
  const res = await client.get('/api/bookmarks/ids');
  return res.data;
};

/**
 * Get bookmark count
 */
export const getBookmarkCount = async () => {
  const res = await client.get('/api/bookmarks/count');
  return res.data;
};
