import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'es' | 'en';

type TranslationKey =
  | 'app_name'
  | 'app_subtitle'
  | 'nav_home'
  | 'nav_farms'
  | 'nav_batches'
  | 'nav_biometries'
  | 'nav_feeding'
  | 'nav_finances'
  | 'status_online'
  | 'status_offline'
  | 'status_pending'
  | 'btn_sync'
  | 'btn_install_app'
  | 'btn_install_title'
  | 'theme_toggle'
  | 'lang_toggle'
  | 'dashboard_title'
  | 'dashboard_subtitle'
  | 'total_biomass'
  | 'active_batches'
  | 'fcr_global'
  | 'ponds_active'
  | 'cost_kg'
  | 'farms_title'
  | 'farms_subtitle'
  | 'batches_title'
  | 'batches_subtitle'
  | 'biometries_title'
  | 'biometries_subtitle'
  | 'feeding_title'
  | 'feeding_subtitle'
  | 'finances_title'
  | 'finances_subtitle'
  | 'btn_new_pond'
  | 'btn_new_batch'
  | 'btn_new_sampling'
  | 'btn_feed_touch'
  | 'btn_record_cost'
  | 'btn_cancel'
  | 'btn_save'
  | 'overcrowding_alert'
  | 'fcr_excellent'
  | 'fcr_amber'
  | 'fcr_critical'
  | 'feed_plan_quota'
  | 'suggested_hours';

const translations: Record<Language, Record<TranslationKey, string>> = {
  es: {
    app_name: 'AgroPiscícola',
    app_subtitle: 'Peces & Cerdos • Precisión con IA',
    nav_home: 'Inicio',
    nav_farms: 'Granjas & Estanques',
    nav_batches: 'Lotes & Siembras',
    nav_biometries: 'Biometrías & FCR',
    nav_feeding: 'Alimentación Campo',
    nav_finances: 'Finanzas ($/kg)',
    status_online: 'En Línea',
    status_offline: 'Modo Offline',
    status_pending: 'pendientes',
    btn_sync: 'Sincronizar',
    btn_install_app: 'Instalar App en Celular',
    btn_install_title: 'Instalar aplicación en la pantalla de inicio',
    theme_toggle: 'Cambiar Modo Oscuro/Claro',
    lang_toggle: 'Idioma / Language',
    dashboard_title: 'Centro de Mando Agropecuario',
    dashboard_subtitle: 'Monitoreo biológico, eficiencia de conversión y costos de producción en tiempo real',
    total_biomass: 'Biomasa Activa Total',
    active_batches: 'Lotes en Producción',
    fcr_global: 'FCR Promedio Ponderado',
    ponds_active: 'Estanques en Operación',
    cost_kg: 'Costo Promedio / kg',
    farms_title: 'Granjas & Aforo de Estanques',
    farms_subtitle: 'HU-01: Cálculo de volumen m³ y capacidad de carga según aireación mecánica',
    batches_title: 'Lotes & Ciclo de Siembra',
    batches_subtitle: 'HU-02: Control de densidad y alerta preventiva de sobrecupo',
    biometries_title: 'Biometrías & Factor de Conversión (FCR)',
    biometries_subtitle: 'HU-05: Muestreos de peso, ganancia diaria (GMD) y semaforización zootécnica',
    feeding_title: 'Alimentación en Campo (Offline-First)',
    feeding_subtitle: 'HU-03 & HU-04: Plan nutricional automático y registro rápido sin internet',
    finances_title: 'Finanzas & Costo de Producción ($/kg)',
    finances_subtitle: 'HU-06: Control de costos directos e indirectos e indicador de rentabilidad',
    btn_new_pond: 'Nuevo Estanque',
    btn_new_batch: 'Sembrar Lote',
    btn_new_sampling: 'Nuevo Muestreo',
    btn_feed_touch: 'Alimentar (1-Toque)',
    btn_record_cost: 'Registrar Gasto',
    btn_cancel: 'Cancelar',
    btn_save: 'Guardar Registro',
    overcrowding_alert: 'Alerta de Sobrecupo Detectada',
    fcr_excellent: 'FCR Óptimo (Verde)',
    fcr_amber: 'Alerta Moderada (Ámbar)',
    fcr_critical: 'FCR Crítico (Rojo)',
    feed_plan_quota: 'Cuota Diaria Recomendada',
    suggested_hours: 'Horarios Recomendados',
  },
  en: {
    app_name: 'AgroPrecision',
    app_subtitle: 'Fish & Swine • Precision with AI',
    nav_home: 'Dashboard',
    nav_farms: 'Farms & Ponds',
    nav_batches: 'Batches & Stocking',
    nav_biometries: 'Biometry & FCR',
    nav_feeding: 'Field Feeding',
    nav_finances: 'Finances ($/kg)',
    status_online: 'Online',
    status_offline: 'Offline Mode',
    status_pending: 'pending',
    btn_sync: 'Sync Data',
    btn_install_app: 'Install Mobile App',
    btn_install_title: 'Install application on your home screen',
    theme_toggle: 'Toggle Dark/Light Mode',
    lang_toggle: 'Language / Idioma',
    dashboard_title: 'Farm Command Center',
    dashboard_subtitle: 'Real-time biological monitoring, conversion efficiency and production costs',
    total_biomass: 'Total Active Biomass',
    active_batches: 'Batches in Production',
    fcr_global: 'Weighted Average FCR',
    ponds_active: 'Operating Ponds',
    cost_kg: 'Average Cost / kg',
    farms_title: 'Farms & Pond Capacity',
    farms_subtitle: 'HU-01: Volume calculation (m³) and stocking capacity by mechanical aeration',
    batches_title: 'Batches & Stocking Lifecycle',
    batches_subtitle: 'HU-02: Density monitoring and preventive overcrowding warning',
    biometries_title: 'Biometry & Feed Conversion (FCR)',
    biometries_subtitle: 'HU-05: Sampling weight, daily gain (ADG) and zootechnical status indicators',
    feeding_title: 'Field Feeding (Offline-First)',
    feeding_subtitle: 'HU-03 & HU-04: Automated nutritional quota and 1-touch offline recording',
    finances_title: 'Finances & Production Cost ($/kg)',
    finances_subtitle: 'HU-06: Direct and indirect expense breakdown and profitability metric',
    btn_new_pond: 'New Pond',
    btn_new_batch: 'Stock New Batch',
    btn_new_sampling: 'New Sampling',
    btn_feed_touch: 'Feed (1-Touch)',
    btn_record_cost: 'Record Expense',
    btn_cancel: 'Cancel',
    btn_save: 'Save Record',
    overcrowding_alert: 'Overcrowding Warning Detected',
    fcr_excellent: 'Optimal FCR (Green)',
    fcr_amber: 'Moderate Alert (Amber)',
    fcr_critical: 'Critical FCR (Red)',
    feed_plan_quota: 'Recommended Daily Quota',
    suggested_hours: 'Suggested Feeding Times',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('agro_lang') as Language | null;
      if (saved && (saved === 'es' || saved === 'en')) return saved;
      if (navigator.language.startsWith('en')) return 'en';
    }
    return 'es';
  });

  useEffect(() => {
    localStorage.setItem('agro_lang', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'es' ? 'en' : 'es'));
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation debe ser utilizado dentro de un LanguageProvider');
  }
  return context;
};
