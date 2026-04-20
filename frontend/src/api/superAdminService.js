// frontend/src/api/superAdminService.js
import client from './client';

const SUPER_ADMIN_BASE = '/super-admin';

/**
 * Get all admin users
 * GET /super-admin/admins
 */
export const getAllAdmins = async () => {
  const res = await client.get(`${SUPER_ADMIN_BASE}/admins`);
  return res.data;
};

/**
 * Create a new admin user
 * POST /super-admin/admins
 * 
 * @param {Object} adminData - Admin creation data
 * @param {string} adminData.name - Admin name (2-100 characters)
 * @param {string} adminData.email - Admin email
 * @param {string} adminData.password - Admin password (min 8 characters)
 * @param {string} [adminData.profileImageUrl] - Optional profile image URL
 */
export const createAdmin = async (adminData) => {
  const res = await client.post(`${SUPER_ADMIN_BASE}/admins`, adminData);
  return res.data;
};

/**
 * Delete an admin user
 * DELETE /super-admin/admins/{id}
 * 
 * @param {number} id - Admin user ID
 */
export const deleteAdmin = async (id) => {
  const res = await client.delete(`${SUPER_ADMIN_BASE}/admins/${id}`);
  return res.data;
};
