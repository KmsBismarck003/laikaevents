import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [customColor, setCustomColor] = useState(() => localStorage.getItem('themeColor') || 'default');
  const [sidebarOnly, setSidebarOnly] = useState(() => localStorage.getItem('sidebarOnly') === 'true');

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    localStorage.setItem('themeColor', customColor);
    localStorage.setItem('sidebarOnly', sidebarOnly ? 'true' : 'false');

    if (theme === 'dark') {
      const colors = {
        default: { bg: '#121212', card: '#1E1E1E', text: '#FFFFFF', border: 'rgba(255, 255, 255, 0.15)' },
        github: { bg: '#0d1117', card: '#161b22', text: '#FFFFFF', border: 'rgba(255, 255, 255, 0.15)' },
        charcoal: { bg: '#1b1e23', card: '#22272e', text: '#FFFFFF', border: 'rgba(255, 255, 255, 0.15)' },
        midnight: { bg: '#050505', card: '#0f0f0f', text: '#FFFFFF', border: 'rgba(255, 255, 255, 0.15)' },
        grey: { bg: '#2b2b2b', card: '#343434', text: '#FFFFFF', border: 'rgba(255, 255, 255, 0.15)' }
      }[customColor] || { bg: '#121212', card: '#1E1E1E', text: '#FFFFFF', border: 'rgba(255,255,255,0.08)' };

      // Sidebar y Navbar SIEMPRE en el color del subtema oscuro
      root.style.setProperty('--bg-sidebar', colors.card);
      root.style.setProperty('--text-sidebar', colors.text);

      if (sidebarOnly) {
        // Modo Solo Sidebar: El contenido de la página se queda en blanco (Light Mode)
        root.style.setProperty('--bg-primary', '#F8FAFC');
        root.style.setProperty('--bg-card', '#FFFFFF');
        root.style.setProperty('--text-primary', '#000000');
        root.style.setProperty('--border-color', '#000000'); // alto contraste
      } else {
        // Modo Oscuro Completo en Todo el Sistema
        root.style.setProperty('--bg-primary', colors.bg);
        root.style.setProperty('--bg-card', colors.card);
        root.style.setProperty('--text-primary', colors.text);
        root.style.setProperty('--border-color', colors.border);
      }
    } else {
      // Light Mode (Predeterminado - Alto contraste)
      root.style.setProperty('--bg-primary', '#F8FAFC');
      root.style.setProperty('--bg-card', '#FFFFFF');
      root.style.setProperty('--text-primary', '#000000');
      root.style.setProperty('--bg-sidebar', '#000000');
      root.style.setProperty('--text-sidebar', '#FFFFFF');
      root.style.setProperty('--border-color', '#000000');
    }
  }, [theme, customColor, sidebarOnly]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const value = {
    theme,
    setTheme,
    customColor,
    setCustomColor,
    sidebarOnly,
    setSidebarOnly,
    toggleTheme,
    isDark: theme === 'dark'
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return context;
};

export default ThemeContext;
