import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  Layers,
  Fish,
  Utensils,
  Activity,
  DollarSign,
  BarChart3,
  Sun,
  Moon,
  Globe,
  Download,
  RefreshCw,
  Home
} from 'lucide-react';
import { getPendingFeedingsCount, syncPendingFeedings } from '../../services/offlineSync';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../context/LanguageContext';
import { usePwa } from '../../context/PwaContext';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useTranslation();
  const { isInstallable, isStandalone, installApp } = usePwa();

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    const interval = setInterval(async () => {
      const count = await getPendingFeedingsCount();
      setPendingCount(count);
    }, 2500);

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

  // Colecciones estructuradas al estilo diario Day One / cuaderno de campo
  const navSections = [
    {
      title: t('section_notebook'),
      items: [
        { label: t('nav_home'), path: '/', icon: Home },
        { label: t('nav_feeding'), path: '/feeding', icon: Utensils },
        { label: t('nav_biometries'), path: '/biometries', icon: Activity },
      ]
    },
    {
      title: t('section_facilities'),
      items: [
        { label: t('nav_farms'), path: '/farms', icon: Layers },
        { label: t('nav_batches'), path: '/batches', icon: Fish },
      ]
    },
    {
      title: t('section_reference'),
      items: [
        { label: t('nav_library'), path: '/library', icon: BookOpen },
        { label: t('nav_stats'), path: '/stats', icon: BarChart3 },
        { label: t('nav_finances'), path: '/finances', icon: DollarSign },
      ]
    }
  ];

  // Máximo 5 pestañas para celular
  const mobileTabs = [
    { label: t('nav_mobile_home'), path: '/', icon: Home },
    { label: t('nav_mobile_farms'), path: '/farms', icon: Layers },
    { label: t('nav_mobile_feeding'), path: '/feeding', icon: Utensils },
    { label: t('nav_mobile_library'), path: '/library', icon: BookOpen },
    { label: t('nav_mobile_finances'), path: '/finances', icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-[#F4EFE3] dark:bg-[#141210] text-[#1F1D1A] dark:text-[#EDE6DA] flex flex-col md:flex-row transition-colors">
      {/* ========================================================================= */}
      {/* 1. Panel Izquierdo / Barra Lateral de Escritorio (Estilo Diario & Libro) */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-[#FBF8F1] dark:bg-[#1F1C18] border-r border-[#E2D9CA] dark:border-[#332E27] shrink-0 select-none">
        {/* Cabecera del libro / diario */}
        <div className="p-6 border-b border-[#E2D9CA] dark:border-[#332E27]">
          <Link to="/" className="block">
            <span className="text-xs uppercase tracking-widest text-[#666159] dark:text-[#9E9689] font-medium block">
              {t('app_tagline')}
            </span>
            <h1 className="text-2xl font-serif text-[#1F1D1A] dark:text-[#EDE6DA] font-semibold tracking-tight mt-0.5">
              {t('app_name')}
            </h1>
            <span className="text-xs text-[#666159] dark:text-[#9E9689] block mt-1">
              {t('app_subtitle')}
            </span>
          </Link>
        </div>

        {/* Lista de Colecciones / Capítulos */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {navSections.map((section) => (
            <div key={section.title}>
              <h2 className="px-2 text-[11px] font-semibold uppercase tracking-wider text-[#666159] dark:text-[#9E9689] mb-2">
                {section.title}
              </h2>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-[5px] text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-[#2E4A36] text-white font-semibold'
                            : 'text-[#1F1D1A] dark:text-[#EDE6DA] hover:bg-[#F2ECE0] dark:hover:bg-[#28241F]'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0 opacity-80" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Utilidades de Estado y Ajustes al Pie del Menú (Discretos) */}
        <div className="p-4 border-t border-[#E2D9CA] dark:border-[#332E27] space-y-3 bg-[#F8F4EB] dark:bg-[#181613]">
          {/* Conectividad Discreta */}
          <div className="flex items-center justify-between text-xs px-2">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? 'bg-[#2A6B3D]' : 'bg-[#9C631B]'
                }`}
              />
              <span className="text-[#666159] dark:text-[#9E9689] font-medium">
                {isOnline ? t('status_online') : t('status_offline')}
              </span>
            </div>
            {pendingCount > 0 && (
              <button
                onClick={handleManualSync}
                disabled={!isOnline || isSyncing}
                className="text-[11px] font-bold text-[#8A4B2A] hover:underline flex items-center gap-1"
                title={t('btn_sync')}
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                {pendingCount} {t('status_pending')}
              </button>
            )}
          </div>

          {/* Opciones Discretas (Instalación PWA, Idioma, Tema) */}
          <div className="flex items-center justify-between pt-2 border-t border-[#E2D9CA] dark:border-[#332E27] text-xs px-1 text-[#666159] dark:text-[#9E9689]">
            {/* Instalar PWA discreto (sin banners invasivos) */}
            {!isStandalone && isInstallable ? (
              <button
                onClick={installApp}
                className="flex items-center gap-1 hover:text-[#1F1D1A] dark:hover:text-[#EDE6DA] transition"
                title={t('btn_install_title')}
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t('install_menu_label')}</span>
              </button>
            ) : (
              <span className="text-[11px] text-[#948D81]">{t('edition_label')}</span>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={toggleLanguage}
                className="hover:text-[#1F1D1A] dark:hover:text-[#EDE6DA] font-semibold uppercase transition"
                title={t('lang_toggle')}
              >
                {language}
              </button>

              <button
                onClick={toggleTheme}
                className="hover:text-[#1F1D1A] dark:hover:text-[#EDE6DA] transition"
                title={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
              >
                {theme === 'light' ? (
                  <Moon className="w-3.5 h-3.5" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-[#D99675]" />
                )}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. Cabecera Móvil Sobria (Solo en Celular) */}
      {/* ========================================================================= */}
      <header className="md:hidden flex items-center justify-between px-4 py-3.5 bg-[#FBF8F1] dark:bg-[#1F1C18] border-b border-[#E2D9CA] dark:border-[#332E27] sticky top-0 z-40">
        <div>
          <Link to="/" className="block">
            <span className="text-[10px] uppercase tracking-wider text-[#666159] dark:text-[#9E9689] block">
              {t('app_tagline')}
            </span>
            <span className="text-xl font-serif font-semibold text-[#1F1D1A] dark:text-[#EDE6DA]">
              {t('app_name')}
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {/* Indicador discreto de red */}
          <span
            className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-[#2A6B3D]' : 'bg-[#9C631B]'
            }`}
            title={isOnline ? t('status_online') : t('status_offline')}
          />

          {/* Menú de Ajustes Móvil Rápido */}
          <button
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            className="p-2 text-[#666159] dark:text-[#9E9689] hover:text-[#1F1D1A] dark:hover:text-[#EDE6DA]"
            title={t('lang_toggle')}
          >
            <Globe className="w-4 h-4" />
          </button>
        </div>

        {/* Dropdown discreto de ajustes móvil */}
        {showSettingsMenu && (
          <div className="absolute right-4 top-14 bg-[#FBF8F1] dark:bg-[#1F1C18] border border-[#E2D9CA] dark:border-[#332E27] rounded-[5px] p-3 shadow-md z-50 text-xs space-y-2.5 w-48">
            <div className="flex justify-between items-center pb-2 border-b border-[#E2D9CA] dark:border-[#332E27]">
              <span>{t('theme_toggle')}:</span>
              <button
                onClick={toggleTheme}
                className="px-2 py-1 rounded bg-[#EBE5D8] dark:bg-[#28241F] font-semibold"
              >
                {theme === 'light' ? t('dark_mode_inactive') : t('dark_mode_active')}
              </button>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-[#E2D9CA] dark:border-[#332E27]">
              <span>{t('lang_toggle')}:</span>
              <button
                onClick={toggleLanguage}
                className="px-2 py-1 rounded bg-[#EBE5D8] dark:bg-[#28241F] font-semibold uppercase"
              >
                {language}
              </button>
            </div>
            {!isStandalone && isInstallable && (
              <button
                onClick={() => {
                  setShowSettingsMenu(false);
                  installApp();
                }}
                className="w-full text-left font-semibold text-[#2E4A36] dark:text-[#86A98F] pt-1 flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t('install_menu_label')}</span>
              </button>
            )}
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 3. Área de Contenido Principal (Centro / Derecha en Escritorio) */}
      {/* ========================================================================= */}
      <main className="flex-1 overflow-x-hidden pb-20 md:pb-8">
        {children}
      </main>

      {/* ========================================================================= */}
      {/* 4. Barra Inferior Móvil (Máximo 5 Pestañas Táctiles >= 48px) */}
      {/* ========================================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FBF8F1] dark:bg-[#1F1C18] border-t border-[#E2D9CA] dark:border-[#332E27] safe-bottom transition-colors">
        <div className="grid grid-cols-5 h-14 max-w-lg mx-auto">
          {mobileTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname === tab.path;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`flex flex-col items-center justify-center min-h-[48px] select-none transition-colors ${
                  isActive
                    ? 'text-[#2E4A36] dark:text-[#86A98F] font-semibold'
                    : 'text-[#666159] dark:text-[#9E9689] hover:text-[#1F1D1A] dark:hover:text-[#EDE6DA]'
                }`}
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="text-[11px] leading-tight truncate max-w-[56px] text-center">
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
