// 🏠 لوحة التحكم الرئيسية للمستخدمين المسجلين - هنا يدير المستخدم قصصه
// 📍 المكان: frontend/src/components/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Dashboard.module.css';
import {
  FiHome, FiFileText, FiPlusCircle, FiSearch,
  FiSettings, FiBell, FiLogOut, FiGlobe,
  FiUser, FiMail, FiUploadCloud, FiLock, FiEye, FiEyeOff, FiHeart,
  FiMessageSquare
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import ThemeToggle from './ThemeToggle';

// استيراد الخدمات والكونات
import { logoutUser, uploadAvatar, updateProfile, changePassword } from '../api/authService';
import CreateStory from './CreateStory'; 
import MyStories from './MyStories';
import BookmarksTab from './BookmarksTab';
import BrowseStories from './BrowseStories';

const DEFAULT_AVATAR = '/placeholder-avatar.svg'; 

const Dashboard = ({ onLogout }) => {
  const navigate = useNavigate();
  // --- States (التعريفات الأساسية) ---
  const [activeTab, setActiveTab] = useState('overview');
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [profile, setProfile] = useState({
    name: 'Publisher Account',
    email: 'publisher@example.com',
    avatarUrl: DEFAULT_AVATAR,
  });
  const [editName, setEditName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  
  // Password change states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Load user data from localStorage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setProfile(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        avatarUrl: user.profileImageUrl || prev.avatarUrl,
      }));
      setEditName(user.name || '');
    }
  }, []);

  // --- Logic Functions ---

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, avatarUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // استخدام الصورة الحالية (base64 أو URL)
      let currentUrl = profile.avatarUrl;
      
      // تحديث البروفايل في الباك إند
      const updatedUser = await updateProfile({ 
        name: editName || profile.name, 
        profileImageUrl: currentUrl !== DEFAULT_AVATAR ? currentUrl : null 
      });
      
      setProfile(prev => ({ 
        ...prev, 
        name: updatedUser.name || editName,
        avatarUrl: updatedUser.profileImageUrl || currentUrl 
      }));
      setIsEditingName(false);
      toast.success('Profile updated successfully!');
      setAvatarFile(null);
    } catch (error) {
      toast.error(error.response?.data || error.message || "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setIsChangingPassword(true);
    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogoutClick = () => {
    logoutUser();
    if (onLogout) onLogout();
    toast.info("Logged out successfully");
  };

  // --- UI Render ---
  return (
    <div className={styles.dashboardContainer}>
      {/* 📋 الشريط الجانبي - هنا كل الأقسام الرئيسية */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}><FiHeart /></div>
          <span>Voices of Syria</span>
        </div>
        <nav className={styles.navMenu}>
          <button 
            className={`${styles.navItem} ${activeTab === 'overview' ? styles.active : ''}`}
            onClick={() => setActiveTab('overview')}
          >
           <FiHome /> 
  <span>Overview</span>
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === 'browse' ? styles.active : ''}`}
            onClick={() => setActiveTab('browse')}
          >
            <FiSearch /> Browse Stories
          </button>
  <button 
  className={`${styles.navItem} ${activeTab === 'my-stories' ? styles.active : ''}`}
  onClick={() => setActiveTab('my-stories')}
>
  <FiFileText /> My Stories
</button>
          <button 
            className={`${styles.navItem} ${activeTab === 'bookmarks' ? styles.active : ''}`}
            onClick={() => setActiveTab('bookmarks')}
          >
            <FiHeart /> Favorites
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === 'new-story' ? styles.active : ''}`}
            onClick={() => setActiveTab('new-story')}
          >
            <FiPlusCircle /> New Story
          </button>
          <div className={styles.navDivider} />
          <button
            className={`${styles.navItem} ${styles.aiNav}`}
            onClick={() => navigate('/chat')}
          >
            <FiMessageSquare /> Ask AI about the platform content
          </button>
          <div className={styles.navDivider} />
          <button 
            className={`${styles.navItem} ${activeTab === 'settings' ? styles.active : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <FiSettings /> Settings
          </button>
        </nav>
        <button className={styles.logoutBtn} onClick={handleLogoutClick}>
          <FiLogOut /> Logout
        </button>
      </aside>

      {/* 📄 المحتوى الرئيسي - يتغير حسب التاب المختار */}
      <main className={styles.mainContent}>
        {/* 🔝 الشريط العلوي - البحث ومعلومات المستخدم */}
        <header className={styles.topHeader}>
          <div className={styles.searchBar}>
            <FiSearch />
            <input type="text" placeholder="Search your stories..." />
          </div>
          <div className={styles.userProfileSummary}>
            <ThemeToggle />
            <FiBell className={styles.notifIcon} />
            <div className={styles.userInfo}>
              <p className={styles.userName}>{profile.name}</p>
              <p className={styles.userRole}>Publisher</p>
            </div>
            <img src={profile.avatarUrl} alt="Avatar" className={styles.topAvatar} />
          </div>
        </header>

        {/* 🏠 تاب النظرة العامة - الصفحة الرئيسية للداشبورد */}
        {activeTab === 'overview' && (
          <div className={styles.overviewContainer}>
            {/* Welcome Section */}
            <div className={styles.welcomeSection}>
              <div className={styles.welcomeContent}>
                <h1 className={styles.welcomeTitle}>
                  Welcome back, <span className={styles.userName}>{profile.name.split(' ')[0]}</span>! 👋
                </h1>
                <p className={styles.welcomeSubtitle}>What would you like to do today?</p>
              </div>
            </div>

            {/* Quick Actions - Centered Cards */}
            <div className={styles.quickActionsContainer}>
              <div className={styles.quickActionsGrid}>
                {/* Create New Story Card */}
                <button 
                  className={styles.quickActionCard}
                  onClick={() => setActiveTab('new-story')}
                >
                  <div className={styles.quickActionIconWrapper}>
                    <div className={styles.quickActionIcon} style={{ background: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)' }}>
                      <FiPlusCircle />
                    </div>
                  </div>
                  <div className={styles.quickActionContent}>
                    <h3>Create New Story</h3>
                    <p>Share your voice with the world</p>
                  </div>
                  <div className={styles.quickActionArrow}>→</div>
                </button>

                {/* Manage Stories Card */}
                <button 
                  className={styles.quickActionCard}
                  onClick={() => setActiveTab('my-stories')}
                >
                  <div className={styles.quickActionIconWrapper}>
                    <div className={styles.quickActionIcon} style={{ background: 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)' }}>
                      <FiFileText />
                    </div>
                  </div>
                  <div className={styles.quickActionContent}>
                    <h3>My Stories</h3>
                    <p>View and manage your submissions</p>
                  </div>
                  <div className={styles.quickActionArrow}>→</div>
                </button>

                {/* Profile Settings Card */}
                <button 
                  className={styles.quickActionCard}
                  onClick={() => setActiveTab('settings')}
                >
                  <div className={styles.quickActionIconWrapper}>
                    <div className={styles.quickActionIcon} style={{ background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)' }}>
                      <FiSettings />
                    </div>
                  </div>
                  <div className={styles.quickActionContent}>
                    <h3>Profile Settings</h3>
                    <p>Update your account information</p>
                  </div>
                  <div className={styles.quickActionArrow}>→</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ➕ تاب إنشاء قصة جديدة */}
        {activeTab === 'new-story' && (
          <CreateStory onBack={() => setActiveTab('overview')} />
        )}
        
        {/* 📖 تاب قصصي - يعرض قصص المستخدم */}
{activeTab === 'my-stories' && (
  <MyStories />
)}

        {/* 🔍 تاب تصفح القصص */}
        {activeTab === 'browse' && (
          <BrowseStories />
        )}

        {/* ❤️ تاب المفضلة */}
        {activeTab === 'bookmarks' && (
          <BookmarksTab />
        )}

        {/* ⚙️ تاب الإعدادات - تعديل البروفايل وكلمة المرور */}
        {activeTab === 'settings' && (
          <div className={styles.settingsContainer}>
            <div className={styles.settingsHeader}>
              <h2>Profile Settings</h2>
              <p>Manage your account information</p>
            </div>

            <form onSubmit={handleSaveProfile} className={styles.settingsForm}>
              {/* Avatar Section */}
              <div className={styles.settingsSection}>
                <h3 className={styles.sectionTitle}>Profile Picture</h3>
                <div className={styles.avatarSection}>
                  <div className={styles.avatarWrapper}>
                    <div 
                      className={styles.avatarPreview} 
                      style={{ backgroundImage: `url(${profile.avatarUrl})` }}
                    />
                    <div className={styles.avatarOverlay}>
                      <FiUploadCloud />
                    </div>
                  </div>
                  <div className={styles.avatarInfo}>
                    <label className={styles.uploadButton}>
                      <FiUploadCloud /> Change Photo
                      <input type="file" hidden onChange={handleAvatarChange} accept="image/*" />
                    </label>
                    <p className={styles.helpText}>JPG, PNG or GIF. Max size 2MB</p>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className={styles.settingsSection}>
                <h3 className={styles.sectionTitle}>Account Information</h3>
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label><FiUser /> Full Name</label>
                    {isEditingName ? (
                      <input 
                        type="text" 
                        value={editName} 
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Your full name"
                      />
                    ) : (
                      <div className={styles.editableField}>
                        <input 
                          type="text" 
                          value={profile.name} 
                          readOnly
                          className={styles.readOnlyInput}
                        />
                        <button 
                          type="button" 
                          className={styles.editButton}
                          onClick={() => { setIsEditingName(true); setEditName(profile.name); }}
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                  <div className={styles.inputGroup}>
                    <label><FiMail /> Email Address</label>
                    <input 
                      type="email" 
                      value={profile.email} 
                      readOnly
                      disabled
                      placeholder="your.email@example.com"
                      className={styles.readOnlyInput}
                    />
                    <p className={styles.helpText}>Email cannot be changed</p>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className={styles.formActions}>
                <button type="button" className={styles.secondaryButton} onClick={() => setActiveTab('overview')}>
                  Back to Overview
                </button>
                <button 
                  type="submit" 
                  className={styles.primaryButton} 
                  disabled={isSaving || (!avatarFile && !isEditingName)}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>

            {/* Change Password Section */}
            <form onSubmit={handleChangePassword} className={styles.settingsForm}>
              <div className={styles.settingsSection}>
                <h3 className={styles.sectionTitle}><FiLock /> Change Password</h3>
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label>Current Password</label>
                    <div className={styles.passwordField}>
                      <input 
                        type={showPasswords.current ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder="Enter current password"
                      />
                      <button 
                        type="button" 
                        className={styles.togglePassword}
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      >
                        {showPasswords.current ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>
                  <div className={styles.inputGroup}>
                    <label>New Password</label>
                    <div className={styles.passwordField}>
                      <input 
                        type={showPasswords.new ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Enter new password"
                      />
                      <button 
                        type="button" 
                        className={styles.togglePassword}
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      >
                        {showPasswords.new ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Confirm New Password</label>
                    <div className={styles.passwordField}>
                      <input 
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm new password"
                      />
                      <button 
                        type="button" 
                        className={styles.togglePassword}
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      >
                        {showPasswords.confirm ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.formActions}>
                <button 
                  type="submit" 
                  className={styles.primaryButton}
                  disabled={isChangingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                >
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;