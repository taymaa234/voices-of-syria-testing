// 🎨 سياق الثيم - يدير حالة الثيم (فاتح/داكن) في جميع أنحاء التطبيق
// 📍 المكان: frontend/src/context/ThemeContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

// إنشاء سياق الثيم
const ThemeContext = createContext();

// 🎯 هوك لاستخدام سياق الثيم
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// 🎨 مزود سياق الثيم
export const ThemeProvider = ({ children }) => {
  // 🔍 تحديد الثيم الأولي من localStorage أو تفضيلات النظام
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    
    // فحص تفضيلات النظام
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  };

  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    // تطبيق الثيم على المستند
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
