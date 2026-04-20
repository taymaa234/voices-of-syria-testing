// 🏠 الملف الرئيسي للتطبيق - هنا يتم تحديد جميع المسارات والصفحات
// 📍 المكان: frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/themes.css';

// 🎨 مزودات السياق والمكونات
import { ThemeProvider } from './context/ThemeContext';
import VisitorView from './components/VisitorView';
import Dashboard from './components/Dashboard';
import AdminView from './components/AdminView';
import SuperAdminView from './components/SuperAdminView';
import LoginForm from './components/LoginForm';
import SignUpForm from './components/SignUpForm';
import ResetForm from './components/ResetForm';
import CreateStory from './components/CreateStory';
import StoryDetail from './components/StoryDetail';
import useAuth from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import ChatBot from './components/ChatBot';
import ChatView from './components/ChatView';

// 📱 المحتوى الرئيسي للتطبيق - يحتوي على جميع المسارات والتوجيهات
function AppContent() {
  const { user, logout } = useAuth(); // بيانات المستخدم الحالي ودالة تسجيل الخروج
  const navigate = useNavigate(); // للتنقل بين الصفحات

  // 🎯 دالة التوجيه بعد تسجيل الدخول حسب نوع المستخدم
  const handleLoginSuccess = (role) => {
    // توجيه المستخدم حسب دوره
    // السوبر أدمن والأدمن يذهبان للوحة الإدارة
    if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
      navigate('/admin');
    } else {
      navigate('/dashboard'); // المستخدم العادي يذهب للوحة التحكم
    }
  };

  return (
    <div className="App">
      {/* 🔔 حاوي الإشعارات */}
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* 🛣️ تعريف جميع مسارات التطبيق */}
      <Routes>
        {/* 🏠 الصفحة الرئيسية للزوار */}
        <Route path="/" element={<VisitorView />} />

        {/* 🔐 صفحة تسجيل الدخول مع التوجيه التلقائي للمستخدمين المسجلين */}
        <Route path="/login" element={
          user ? (
            <Navigate to={
              user.role === 'SUPER_ADMIN' ? "/admin" :
              user.role === 'ADMIN' ? "/admin" :
              "/dashboard"
            } replace />
          ) : (
            <LoginForm onLoginSuccess={handleLoginSuccess} />
          )
        } />

        {/* 📝 صفحات التسجيل واستعادة كلمة المرور */}
        <Route path="/signup" element={<SignUpForm />} />
        <Route path="/reset-password" element={<ResetForm />} />

        {/* 🏠 لوحة تحكم المستخدم العادي */}
        <Route path="/dashboard" element={<ProtectedRoute>{<Dashboard onLogout={logout} />}</ProtectedRoute>} />
        
        {/* 👨‍💼 لوحة تحكم الأدمن */}
        <Route path="/admin" element={<ProtectedRoute roles={[ 'ADMIN', 'SUPER_ADMIN' ]}>{<AdminView onLogout={logout} />}</ProtectedRoute>} />
        
        {/* 👑 لوحة تحكم السوبر أدمن */}
        <Route path="/super-admin" element={<ProtectedRoute roles={['SUPER_ADMIN']}>{<SuperAdminView onLogout={logout} />}</ProtectedRoute>} />
        
        {/* ✍️ صفحة إنشاء قصة جديدة */}
        <Route path="/create-story" element={<ProtectedRoute>{<CreateStory />}</ProtectedRoute>} />
        
        {/* 📖 صفحة تفاصيل القصة */}
        <Route path="/stories/:id" element={<StoryDetail />} />

        {/* 🤖 صفحة الشات بوت */}
        <Route path="/chat" element={<ChatView />} />
      </Routes>

      {/* 🤖 Chatbot - يظهر في كل الصفحات */}
      <ChatBot />
    </div>
  );
}

// 🎨 المكون الجذر للتطبيق - يحتوي على مزودات السياق والتوجيه
function App() {
  return (
    <ThemeProvider> {/* مزود سياق الثيم (فاتح/داكن) */}
      <Router> {/* مزود التوجيه للتطبيق */}
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;