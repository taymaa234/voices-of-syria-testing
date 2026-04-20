// 👑 لوحة تحكم السوبر أدمن - هنا السوبر أدمن يدير حسابات الأدمن
// 📍 المكان: frontend/src/components/SuperAdminView.jsx
import React, { useState, useEffect } from 'react';
import {
  FiShield,
  FiUserPlus,
  FiMessageSquare,
  FiTrash2,
  FiMail,
  FiUser,
  FiLock,
  FiLogOut,
  FiAlertCircle,
  FiX
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import styles from './SuperAdminView.module.css';
import { getAllAdmins, createAdmin, deleteAdmin } from '../api/superAdminService';
import ThemeToggle from './ThemeToggle';

const SuperAdminView = ({ onLogout }) => {
  const navigate = useNavigate();
  // 📊 حالات البيانات
  const [admins, setAdmins] = useState([]); // قائمة الأدمن
  const [isLoading, setIsLoading] = useState(true); // حالة التحميل
  const [showCreateModal, setShowCreateModal] = useState(false); // إظهار نافذة إنشاء أدمن
  
  // 📝 حالات نموذج إنشاء أدمن جديد
  const [newAdminName, setNewAdminName] = useState(''); // اسم الأدمن الجديد
  const [newAdminEmail, setNewAdminEmail] = useState(''); // بريد الأدمن الجديد
  const [newAdminPassword, setNewAdminPassword] = useState(''); // كلمة مرور الأدمن الجديد
  const [isCreating, setIsCreating] = useState(false); // حالة إنشاء الأدمن

  // 🔄 تحميل قائمة الأدمن عند بداية تشغيل الكومبوننت
  useEffect(() => {
    fetchAdmins();
  }, []);

  // 📚 جلب قائمة الأدمن
  const fetchAdmins = async () => {
    try {
      setIsLoading(true);
      const data = await getAllAdmins();
      setAdmins(data);
    } catch (error) {
      toast.error(error.message || 'Failed to load admins');
    } finally {
      setIsLoading(false);
    }
  };

  // ➕ إنشاء أدمن جديد
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    
    // التحقق من الحقول المطلوبة
    if (!newAdminName.trim() || !newAdminEmail.trim() || !newAdminPassword.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setIsCreating(true);
      
      const newAdmin = await createAdmin({
        name: newAdminName,
        email: newAdminEmail,
        password: newAdminPassword
      });

      setAdmins([...admins, newAdmin]);
      toast.success('Admin created successfully!');
      
      // Reset form
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPassword('');
      setShowCreateModal(false);
    } catch (error) {
      toast.error(error.message || 'Failed to create admin');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) {
      return;
    }

    try {
      await deleteAdmin(adminId);
      setAdmins(admins.filter(admin => admin.id !== adminId));
      toast.success('Admin deleted successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to delete admin');
    }
  };

  return (
    <div className={styles.superAdminPage}>
      <header className={styles.topBar}>
        <div className={styles.brand}>
          <FiShield />
          <span>Super Admin Panel</span>
        </div>
        <div className={styles.topBarRight}>
          <ThemeToggle />
          <button onClick={() => navigate('/chat')} className={styles.aiChatBtn}>
            <FiMessageSquare />
            <span>Ask AI about the platform content</span>
          </button>
          <button onClick={onLogout} className={styles.logoutBtn}>
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <main className={styles.mainContent}>
        <section className={styles.header}>
          <div>
            <h1>Admin Management</h1>
            <p>Create and manage admin accounts</p>
          </div>
          <button 
            className={styles.createBtn}
            onClick={() => setShowCreateModal(true)}
          >
            <FiUserPlus />
            <span>Create New Admin</span>
          </button>
        </section>

        <section className={styles.statsBar}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Admins</span>
            <span className={styles.statValue}>{admins.length}</span>
          </div>
        </section>

        <section className={styles.adminsSection}>
          {isLoading ? (
            <div className={styles.loadingState}>
              <p>Loading admins...</p>
            </div>
          ) : admins.length === 0 ? (
            <div className={styles.emptyState}>
              <FiAlertCircle />
              <p>No admins found. Create your first admin account.</p>
            </div>
          ) : (
            <div className={styles.adminsGrid}>
              {admins.map((admin) => (
                <div key={admin.id} className={styles.adminCard}>
                  <div className={styles.adminHeader}>
                    <div className={styles.adminAvatar}>
                      <FiUser />
                    </div>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDeleteAdmin(admin.id)}
                      title="Delete Admin"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                  <div className={styles.adminInfo}>
                    <h3>{admin.name}</h3>
                    <p className={styles.adminEmail}>
                      <FiMail />
                      {admin.email}
                    </p>
                    <span className={styles.roleBadge}>
                      <FiShield />
                      {admin.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Create Admin Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.modalOverlay}
            onClick={() => !isCreating && setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>
                  <FiUserPlus />
                  Create New Admin
                </h2>
                <button
                  className={styles.modalClose}
                  onClick={() => !isCreating && setShowCreateModal(false)}
                  disabled={isCreating}
                >
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleCreateAdmin} className={styles.modalForm}>
                <div className={styles.formGroup}>
                  <label>
                    <FiUser />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter admin name"
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    required
                    disabled={isCreating}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>
                    <FiMail />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="admin@example.com"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    required
                    disabled={isCreating}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>
                    <FiLock />
                    Password *
                  </label>
                  <input
                    type="password"
                    placeholder="Enter secure password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={isCreating}
                  />
                  <small>Minimum 6 characters</small>
                </div>

                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={() => setShowCreateModal(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.createButton}
                    disabled={isCreating}
                  >
                    <FiUserPlus />
                    {isCreating ? 'Creating...' : 'Create Admin'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuperAdminView;
