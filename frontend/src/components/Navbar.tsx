import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Fish,
  Layers,
  Activity,
  Utensils,
  DollarSign,
  Wifi,
  WifiOff,
  RefreshCw,
  Home,
  Sun,
  Moon,
  Globe,
  Download
} from 'lucide-react';
import { getPendingFeedingsCount, syncPendingFeedings } from '../services/offlineSync';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../context/LanguageContext';
import { usePwa } from '../context/PwaContext';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useTranslation();
  const { isInstallable, isStandalone, installApp } = usePwa();

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    const interval = setInterval(async () => {
      const count = await getPendingFeedingsCount();
      setPendingCount(count);
    }, 2000);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(interval);
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncPendingFeedings();
    const count = await getPendingFeedingsCount();
    setPendingCount(count);
    setIsSyncing(false);
  };

  const navItems = [
    { label: t('nav_home'), path: '/', icon: Home },
    { label: t('nav_farms'), path: '/farms', icon: Layers },
    { label: t('nav_batches'), path: '/batches', icon: Fish },
    { label: t('nav_biometries'), path: '/biometries', icon: Activity },
    { label: t('nav_feeding'), path: '/feeding', icon: Utensils },
    { label: t('nav_finances'), path: '/finances', icon: DollarSign },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo y Nombre con icono dual Peces + Granja */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="bg-gradient-to-tr from-emerald-600 to-teal-500 text-white p-2 rounded-2xl shadow-sm group-hover:scale-105 transition-transform duration-200">
                <Fish className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <span className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 leading-tight">
                  AgroPrecision
                  <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    AI
                  </span>
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block leading-none">
                  {t('app_subtitle')}
                </span>
              </div>
            </Link>

            {/* Menú Desktop */}
            <nav className="hidden xl:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Controles de Conectividad, Idioma, Tema e Instalación Móvil */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Botón de Instalación PWA en Celular */}
              {!isStandalone && (
                <button
                  onClick={installApp}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition active:scale-95"
                  title={t('btn_install_title')}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('btn_install_app')}</span>
                  <span className="sm:hidden">App</span>
                </button>
              )}

              {/* Selector de Idioma (ES / EN) */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                title={t('lang_toggle')}
              >
                <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="uppercase">{language}</span>
              </button>

              {/* Selector de Tema (Modo Claro / Modo Oscuro) */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                title={t('theme_toggle')}
              >
                {theme === 'light' ? (
                  <Moon className="w-4 h-4 text-slate-700" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400" />
                )}
              </button>

              {/* Indicador de Conectividad */}
              <div className="hidden sm:flex items-center">
                {isOnline ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <Wifi className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    {t('status_online')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse">
                    <WifiOff className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    {t('status_offline')}
                  </span>
                )}
              </div>

              {/* Contador & Botón de Sincronización Manual */}
              {pendingCount > 0 && (
                <button
                  onClick={handleManualSync}
                  disabled={!isOnline || isSyncing}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 transition active:scale-95"
                  title="Sincronizar raciones locales con el servidor"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{pendingCount}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Barra de Navegación Inferior Móvil (Ergonomía de Campo con Pulgar) */}
      <nav className="xl:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 safe-bottom shadow-lg transition-colors duration-200">
        <div className="flex items-center justify-around py-1.5 px-1 max-w-lg mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold transition-transform duration-150 active:scale-90 ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <div
                  className={`p-1 rounded-xl mb-0.5 transition-colors ${
                    isActive ? 'bg-emerald-50 dark:bg-emerald-950/70' : 'bg-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="truncate max-w-[60px] text-center">{item.label.split(' ')[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};
