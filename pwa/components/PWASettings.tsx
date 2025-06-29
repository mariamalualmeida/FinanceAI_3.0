import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';

export function PWASettings() {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState(localStorage.getItem('pwa-theme') || 'light');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('pwa-theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        Configurações PWA
      </h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-700 dark:text-gray-300">Tema</span>
          <button
            onClick={toggleTheme}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm"
          >
            {theme === 'light' ? 'Escuro' : 'Claro'}
          </button>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Usuário: {user?.username}
          </p>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}