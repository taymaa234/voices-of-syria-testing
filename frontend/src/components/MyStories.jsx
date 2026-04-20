// 📖 صفحة قصصي - هنا المستخدم يشوف ويدير قصصه الشخصية
// 📍 المكان: frontend/src/components/MyStories.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useMyStories from '../hooks/useMyStories';
import { updateStory } from '../api/storyService';
import { 
    FiEdit3, FiTrash2, FiEye, FiFileText, 
    FiMic, FiVideo, FiCheck, FiClock, FiX, FiAlertCircle,
    FiSave, FiXCircle, FiAlertTriangle
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import styles from './MyStories.module.css';

const MyStories = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user")); // بيانات المستخدم المحفوظة
    
    // 📊 حالات البيانات والعمليات
    const { data: stories, loading, error, fetch, remove } = useMyStories(); // خدمة إدارة القصص
    const [editingStory, setEditingStory] = useState(null); // القصة قيد التعديل
    const [showEditModal, setShowEditModal] = useState(false); // إظهار نافذة التعديل
    const [showDeleteModal, setShowDeleteModal] = useState(false); // إظهار نافذة الحذف
    const [storyToDelete, setStoryToDelete] = useState(null); // القصة المراد حذفها
    const [deleting, setDeleting] = useState(false); // حالة الحذف
    
    // 📝 بيانات نموذج التعديل
    const [editForm, setEditForm] = useState({
        title: '',
        textContent: '',
        attacker: '',
        province: ''
    });
    const [saving, setSaving] = useState(false); // حالة الحفظ

    console.log('MyStories: Component rendered with:', { stories, loading, error });
    
    // 🔄 تحميل القصص عند بداية تشغيل الكومبوننت
    useEffect(() => {
        fetch();
    }, []);

    // 🔒 التحقق من تسجيل الدخول
    if (!user) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <h2>Access Denied</h2>
                <p>You must be logged in to view your stories.</p>
            </div>
        );
    }

    // 🗑️ بدء عملية الحذف
    const handleDelete = (story) => {
        setStoryToDelete(story);
        setShowDeleteModal(true);
    };

    // ✅ تأكيد الحذف
    const handleConfirmDelete = async () => {
        if (!storyToDelete) return;
        
        setDeleting(true);
        try {
            await remove(storyToDelete.id);
            toast.success('Story deleted successfully');
            setShowDeleteModal(false);
            setStoryToDelete(null);
        } catch (err) {
            toast.error(err.message || 'Delete failed');
        } finally {
            setDeleting(false);
        }
    };

    // ❌ إلغاء الحذف
    const handleCancelDelete = () => {
        setShowDeleteModal(false);
        setStoryToDelete(null);
    };

    // 👁️ عرض تفاصيل القصة
    const handleView = (story) => {
        navigate(`/stories/${story.id}`);
    };

    // ✏️ بدء تعديل القصة
    const handleEdit = (story) => {
        // التحقق من إمكانية التعديل (فقط القصص غير المعتمدة)
        if (story.status === 'APPROVED') {
            toast.warning('Cannot edit an approved story');
            return;
        }
        setEditingStory(story);
        setEditForm({
            title: story.title || '',
            textContent: story.textContent || '',
            attacker: story.attacker || '',
            province: story.province || ''
        });
        setShowEditModal(true);
    };

    // 🚪 إغلاق نافذة التعديل
    const handleCloseModal = () => {
        setShowEditModal(false);
        setEditingStory(null);
        setEditForm({ title: '', textContent: '', attacker: '', province: '' });
    };

    // 💾 حفظ التعديلات
    const handleSaveEdit = async () => {
        if (!editingStory) return;
        
        setSaving(true);
        try {
            const updatedData = {
                ...editForm,
                type: editingStory.type,
                incidentDate: editingStory.incidentDate
            };
            
            await updateStory(editingStory.id, updatedData);
            toast.success('Story updated successfully!');
            handleCloseModal();
            fetch(); // تحديث القائمة
        } catch (err) {
            console.error('Update error:', err);
            toast.error(err.response?.data?.message || err.message || 'Failed to update story');
        } finally {
            setSaving(false);
        }
    };

    // 📅 تنسيق التاريخ بشكل جميل
    const formatDate = (dateString) => {
        if (!dateString) return '—';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '—';
            
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            
            return `${day}/${month}/${year}`;
        } catch {
            return '—';
        }
    };

    // 🎭 تحديد أيقونة ونمط نوع القصة
    const getTypeStyle = (type) => {
        switch (type) {
            case 'TEXT': return { style: styles.typeText, icon: <FiFileText /> };
            case 'AUDIO': return { style: styles.typeAudio, icon: <FiMic /> };
            case 'VIDEO': return { style: styles.typeVideo, icon: <FiVideo /> };
            default: return { style: styles.typeText, icon: <FiFileText /> };
        }
    };

    // 🚦 تحديد نمط حالة القصة
    const getStatusStyle = (status) => {
        switch (status) {
            case 'APPROVED': return { style: styles.statusApproved, icon: <FiCheck /> }; // معتمدة
            case 'PENDING': return { style: styles.statusPending, icon: <FiClock /> }; // قيد المراجعة
            case 'REJECTED': return { style: styles.statusRejected, icon: <FiX /> }; // مرفوضة
            case 'NEEDS_MODIFICATION': return { style: styles.statusNeedsModification || styles.statusPending, icon: <FiClock /> }; // تحتاج تعديل
            default: return { style: styles.statusPending, icon: <FiClock /> };
        }
    };

    return (
        <div className={styles.container}>
            {/* 📋 رأس الصفحة */}
            <div className={styles.header}>
                <div className={styles.title}>
                    <h2>My Stories</h2>
                    <span className={styles.stats}>Manage your contributions</span>
                </div>
                <div className={styles.stats}>
                    Total: {Array.isArray(stories) ? stories.length : 0}
                </div>
            </div>

            {/* 📊 جدول القصص */}
            <div className={styles.tableWrapper}>
                {loading ? (
                    // ⏳ حالة التحميل
                    <div style={{textAlign: 'center', padding: '20px'}}>
                        <p>Loading your stories...</p>
                    </div>
                ) : error ? (
                    // ❌ حالة الخطأ
                    <div style={{textAlign: 'center', padding: '20px', color: 'red'}}>
                        <p>Error loading stories: {error.message}</p>
                        <button onClick={() => fetch()}>Retry</button>
                    </div>
                ) : !Array.isArray(stories) || stories.length === 0 ? (
                    // 📭 حالة عدم وجود قصص
                    <div style={{textAlign: 'center', padding: '20px'}}>
                        <p>No stories found. Create your first story!</p>
                    </div>
                ) : (
                    // 📋 جدول القصص
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Story Title</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Admin Message</th>
                                <th>Date</th>
                                <th style={{textAlign: 'right'}}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stories.map(story => {
                                const typeMeta = getTypeStyle(story.type);
                                const statusMeta = getStatusStyle(story.status);
                                
                                return (
                                    <tr key={story.id}>
                                        {/* 📝 عنوان القصة */}
                                        <td>
                                            <div className={styles.storyTitle}>{story.title}</div>
                                        </td>
                                        
                                        {/* 🎭 نوع القصة */}
                                        <td>
                                            <span className={`${styles.typeBadge} ${typeMeta.style}`}>
                                                {typeMeta.icon} {story.type}
                                            </span>
                                        </td>

                                        {/* 🚦 حالة القصة */}
                                        <td>
                                            <div className={`${styles.statusBadge} ${statusMeta.style}`}>
                                                {statusMeta.icon}
                                                <span>{story.status}</span>
                                            </div>
                                        </td>

                                        {/* 💬 رسالة الأدمن */}
                                        <td>
                                            {story.adminMessage ? (
                                                <div className={styles.adminMessageCell}>
                                                    <FiAlertCircle className={styles.messageIcon} />
                                                    <span className={styles.messageText}>{story.adminMessage}</span>
                                                </div>
                                            ) : (
                                                <span className={styles.noMessage}>—</span>
                                            )}
                                        </td>

                                        {/* 📅 التاريخ */}
                                        <td className={styles.storyDate}>
                                            {formatDate(story.publishDate || story.updatedAt || story.createdAt)}
                                        </td>

                                        {/* ⚡ أزرار الإجراءات */}
                                        <td>
                                            <div className={styles.actions} style={{justifyContent: 'flex-end'}}>
                                                {/* 👁️ زر العرض */}
                                                <button 
                                                    className={`${styles.actionBtn} ${styles.btnView}`} 
                                                    title="View Details"
                                                    onClick={() => handleView(story)}
                                                >
                                                    <FiEye />
                                                </button>
                                                {/* ✏️ زر التعديل */}
                                                <button 
                                                    className={`${styles.actionBtn} ${styles.btnEdit}`} 
                                                    title="Edit Story"
                                                    onClick={() => handleEdit(story)}
                                                    disabled={story.status === 'APPROVED'}
                                                    style={story.status === 'APPROVED' ? {opacity: 0.5, cursor: 'not-allowed'} : {}}
                                                >
                                                    <FiEdit3 />
                                                </button>
                                                {/* 🗑️ زر الحذف */}
                                                <button 
                                                    className={`${styles.actionBtn} ${styles.btnDelete}`} 
                                                    title="Delete"
                                                    onClick={() => handleDelete(story)}
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ✏️ نافذة التعديل */}
            {showEditModal && editingStory && (
                <div className={styles.modalOverlay} onClick={handleCloseModal}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        {/* 📋 رأس النافذة */}
                        <div className={styles.modalHeader}>
                            <h3><FiEdit3 /> Edit Story</h3>
                            <button className={styles.closeBtn} onClick={handleCloseModal}>
                                <FiXCircle />
                            </button>
                        </div>

                        {/* 💬 رسالة الأدمن إذا كانت موجودة */}
                        {editingStory.adminMessage && (
                            <div className={styles.adminMessageBox}>
                                <FiAlertCircle />
                                <div>
                                    <strong>Admin Message:</strong>
                                    <p>{editingStory.adminMessage}</p>
                                </div>
                            </div>
                        )}

                        {/* 📝 نموذج التعديل */}
                        <div className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={editForm.title}
                                    onChange={e => setEditForm({...editForm, title: e.target.value})}
                                    placeholder="Story title"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Content</label>
                                <textarea
                                    value={editForm.textContent}
                                    onChange={e => setEditForm({...editForm, textContent: e.target.value})}
                                    placeholder="Story content"
                                    rows={6}
                                />
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Province</label>
                                    <select
                                        value={editForm.province}
                                        onChange={e => setEditForm({...editForm, province: e.target.value})}
                                    >
                                        <option value="">Select Province</option>
                                        <option value="DAMASCUS">Damascus</option>
                                        <option value="ALEPPO">Aleppo</option>
                                        <option value="HOMS">Homs</option>
                                        <option value="HAMA">Hama</option>
                                        <option value="LATAKIA">Latakia</option>
                                        <option value="TARTUS">Tartus</option>
                                        <option value="IDLIB">Idlib</option>
                                        <option value="DEIR_EZ_ZOR">Deir ez-Zor</option>
                                        <option value="RAQQA">Raqqa</option>
                                        <option value="HASAKAH">Hasakah</option>
                                        <option value="DARAA">Daraa</option>
                                        <option value="SUWAYDA">Suwayda</option>
                                        <option value="QUNEITRA">Quneitra</option>
                                        <option value="RURAL_DAMASCUS">Rural Damascus</option>
                                    </select>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Attacker</label>
                                    <input
                                        type="text"
                                        value={editForm.attacker}
                                        onChange={e => setEditForm({...editForm, attacker: e.target.value})}
                                        placeholder="Attacker name"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 🔘 أزرار النافذة */}
                        <div className={styles.modalFooter}>
                            <button 
                                className={styles.cancelBtn} 
                                onClick={handleCloseModal}
                                disabled={saving}
                            >
                                <FiX /> Cancel
                            </button>
                            <button 
                                className={styles.saveBtn} 
                                onClick={handleSaveEdit}
                                disabled={saving}
                            >
                                <FiSave /> {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🗑️ نافذة تأكيد الحذف */}
            {showDeleteModal && storyToDelete && (
                <div className={styles.modalOverlay} onClick={handleCancelDelete}>
                    <div className={styles.deleteModal} onClick={e => e.stopPropagation()}>
                        <div className={styles.deleteModalIcon}>
                            <FiAlertTriangle />
                        </div>
                        <h3 className={styles.deleteModalTitle}>Delete Story</h3>
                        <p className={styles.deleteModalText}>
                            Are you sure you want to delete "<strong>{storyToDelete.title}</strong>"?
                        </p>
                        <p className={styles.deleteModalWarning}>
                            This action cannot be undone.
                        </p>
                        <div className={styles.deleteModalActions}>
                            <button 
                                className={styles.cancelBtn} 
                                onClick={handleCancelDelete}
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                            <button 
                                className={styles.deleteBtn} 
                                onClick={handleConfirmDelete}
                                disabled={deleting}
                            >
                                <FiTrash2 /> {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyStories;