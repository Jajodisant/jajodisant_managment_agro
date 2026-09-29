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
  Home
} from 'lucide-react';
import { getPendingFeedingsCount, syncPendingFeedings } from '../services/offlineSync';

export const Navbar: React.FC = () => {
  const location = useLocation();
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
    { label: 'Inicio', path: '/', icon: Home },
    { label: 'Granjas & Estanques', path: '/farms', icon: Layers },
    { label: 'Lotes & Siembras', path: '/batches', icon: Fish },
    { label: 'Biometrías & FCR', path: '/biometries', icon: Activity },
    { label: 'Alimentación Campo', path: '/feeding', icon: Utensils },
    { label: 'Finanzas ($/kg)', path: '/finances', icon: DollarSign },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo y Nombre */}
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-sm">
              <Fish className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight block">AgroPiscícola</span>
              <span className="text-xs text-slate-500 font-medium block leading-none">MVP Offline-First</span>
            </div>
          </Link>

          {/* Menú Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Conectividad & Sincronización */}
          <div className="flex items-center gap-3">
            {isOnline ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Wifi className="w-3.5 h-3.5" />
                Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                <WifiOff className="w-3.5 h-3.5" />
                Offline
              </span>
            )}

            {pendingCount > 0 && (
              <button
                onClick={handleManualSync}
                disabled={!isOnline || isSyncing}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition"
                title="Sincronizar raciones locales con el servidor"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                {pendingCount} pendientes
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Menú Inferior Móvil (Táctil para operarios en campo) */}
      <nav className="md:hidden flex items-center justify-around border-t border-slate-200 bg-white py-2 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-xs font-semibold transition ${
                isActive ? 'text-emerald-600' : 'text-slate-500'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
};
