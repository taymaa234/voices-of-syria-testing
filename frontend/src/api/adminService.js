import client from './client';

const ADMIN_BASE = '/admin/stories';

export const getPendingStories = async () => {
  const res = await client.get(`${ADMIN_BASE}/pending`);
  return res.data;
};

export const approveStory = async (id) => {
  const res = await client.put(`${ADMIN_BASE}/${id}/approve`);
  return res.data;
};

export const rejectStory = async (id) => {
  // backend schema returns Story; do NOT send a message body — backend reject endpoint doesn't accept it
  const res = await client.put(`${ADMIN_BASE}/${id}/reject`);
  return res.data;
};

export const requestModification = async (id, note) => {
  // backend expects a raw string in the request body. Send a valid JSON string value to ensure
  // the server's message binder receives the text correctly.
  const payload = JSON.stringify(note);
  const res = await client.put(`${ADMIN_BASE}/${id}/request-modification`, payload);
  return res.data;
};

/**
 * Get all registered users (USER role)
 */
export const getAllUsers = async () => {
  const res = await client.get('/admin/users');
  return res.data;
};
