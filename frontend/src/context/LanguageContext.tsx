import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'es' | 'en';

const translations: Record<Language, Record<string, string>> = {
  es: {
    // App & Header
    app_name: 'AgroPrecision',
    app_tagline: 'Bitácora & Cuaderno de Campo',
    app_subtitle: 'Piscicultura & Porcicultura • Zootecnia de Precisión',
    edition_label: 'Edición Zootécnica de Campo',
    
    // Navigation Sections
    section_notebook: 'I. Cuaderno & Campo',
    section_facilities: 'II. Instalaciones & Lotes',
    section_reference: 'III. Consulta & Economía',

    // Navigation Items
    nav_home: 'Inicio & Bitácora',
    nav_feeding: 'Alimentación en Campo',
    nav_biometries: 'Biometrías & FCR',
    nav_farms: 'Granjas & Estanques',
    nav_batches: 'Lotes & Siembras',
    nav_library: 'Biblioteca Técnica',
    nav_stats: 'Estadísticas & Curvas',
    nav_finances: 'Finanzas ($/kg)',
    nav_vet: 'Consultorio Veterinario IA',

    // Mobile Navigation
    nav_mobile_home: 'Inicio',
    nav_mobile_farms: 'Granjas',
    nav_mobile_feeding: 'Campo',
    nav_mobile_library: 'Biblioteca',
    nav_mobile_finances: 'Finanzas',

    // Network & Sync Status
    status_online: 'En Línea',
    status_offline: 'Sin Conexión (Modo Campo)',
    status_pending: 'pendientes por sincronizar',
    btn_sync: 'Sincronizar Datos',
    sync_in_progress: 'Sincronizando con la nube...',
    sync_done: 'Registros al día',

    // PWA & Installation
    btn_install_app: 'Instalar Cuaderno Móvil',
    btn_install_title: 'Instalar aplicación en la pantalla de inicio para usar sin conexión',
    install_menu_label: 'Instalar en Teléfono',
    theme_toggle: 'Cambiar Modo Oscuro/Claro',
    lang_toggle: 'Cambiar Idioma',
    dark_mode_active: 'Activado',
    dark_mode_inactive: 'Desactivado',

    // Dashboard: Layout & Headlines
    dashboard_title: 'Cuaderno de Bitácora Diaria',
    dashboard_subtitle: 'Registro de tareas del día, estado biológico de estanques y control zootécnico',
    date_today: 'Hoy',
    journal_entry: 'Entrada del Cuaderno',

    // Dashboard: Pendiente Hoy (Task-first)
    pending_today_title: 'Pendiente Hoy',
    pending_today_desc: 'Tareas operativas prioritarias en campo para el día en curso',
    task_feed_due: 'Ración de Alimento Programada',
    task_feed_due_desc: 'Turno de alimentación matutina/vespertina requerida',
    task_biometry_due: 'Muestreo Biométrico Semanal',
    task_biometry_due_desc: 'Control de peso y cálculo de FCR requerido para este lote',
    task_water_quality: 'Inspección de Calidad de Agua',
    task_water_quality_desc: 'Lectura de oxígeno disuelto y temperatura recomendada',
    task_overcrowding_alert: 'Alerta de Sobrecupo en Estanque',
    task_overcrowding_alert_desc: 'Capacidad de carga superada. Requiere desdoble o transferencia',
    all_tasks_completed: 'Todas las tareas del día están completadas en la bitácora.',
    btn_execute_task: 'Completar en Campo',

    // Dashboard: Calendar & Journal View
    calendar_title: 'Calendario de Actividad Zootécnica',
    calendar_desc: 'Histórico y programación de alimentaciones, pesajes y eventos por día',
    calendar_month_sep: 'Septiembre 2026',
    calendar_day_m: 'L',
    calendar_day_t: 'M',
    calendar_day_w: 'X',
    calendar_day_th: 'J',
    calendar_day_f: 'V',
    calendar_day_sa: 'S',
    calendar_day_su: 'D',
    events_for_day: 'Eventos registrados para',
    no_events_day: 'No hay eventos anotados en el cuaderno para esta fecha.',
    add_journal_note: 'Anotar Evento en Bitácora',

    // Dashboard: Single-row KPIs
    kpi_biomass: 'Biomasa Activa',
    kpi_biomass_unit: 'kg vivos',
    kpi_batches: 'Lotes en Producción',
    kpi_batches_unit: 'lotes activos',
    kpi_fcr: 'FCR Global Ponderado',
    kpi_fcr_unit: 'kg alimento / kg peso',
    kpi_cost_kg: 'Costo Promedio / kg',
    kpi_cost_kg_unit: 'COP / kg producido',

    // Useful Empty States
    empty_no_batches_title: 'Aún no hay lotes sembrados',
    empty_no_batches_msg: 'Empieza aforando tus estanques y registrando la primera siembra de alevinos o lechones.',
    empty_no_farms_title: 'No hay granjas ni estanques configurados',
    empty_no_farms_msg: 'Configura las dimensiones de tus estanques para calcular el aforo y la capacidad máxima de carga en m³.',
    btn_create_first_farm: 'Crear Primera Granja',
    btn_create_first_pond: 'Aforar Nuevo Estanque',
    btn_stock_first_batch: 'Sembrar Primer Lote',

    // Chronological Feed & Thumbnails (Day One style)
    recent_chronological_title: 'Bitácora Cronológica de Lotes',
    view_details: 'Ver Ficha Completa',
    photo_attached: 'Foto de campo adjunta',
    take_photo_prompt: 'Adjuntar foto de campo (agua, peces, alimento)',
    thumbnail_label: 'Miniatura',

    // Species & Farm Types
    species_fish: 'Piscicultura',
    species_swine: 'Porcicultura',
    species_tilapia: 'Tilapia Roja / Negra',
    species_trout: 'Trucha Arcoíris',
    species_pig_growth: 'Cerdo en Levante',
    species_pig_finish: 'Cerdo en Ceba',

    // Standard Buttons
    btn_new_pond: 'Nuevo Estanque',
    btn_new_batch: 'Sembrar Lote',
    btn_new_sampling: 'Nuevo Muestreo',
    btn_feed_touch: 'Alimentar (1-Toque)',
    btn_record_cost: 'Registrar Gasto',
    btn_cancel: 'Cancelar',
    btn_save: 'Guardar Registro',
    btn_back: 'Volver',

    // Common labels
    label_batch: 'Lote',
    label_pond: 'Estanque',
    label_species: 'Especie',
    label_date: 'Fecha',
    label_weight: 'Peso promedio',
    label_density: 'Densidad de siembra',
    label_status: 'Estado',

    // HU-07 Optimización de Cosecha & Inflexión Biológica
    hu07_title: 'Punto de Inflexión Biológico & Cosecha Óptima (HU-07)',
    hu07_subtitle: 'Cálculo de FCR marginal y semana económica óptima de cosecha frente al precio en pie.',
    hu07_market_price: 'Precio de Mercado en Pie (COP/kg)',
    hu07_marginal_fcr: 'FCR Marginal',
    hu07_marginal_cost: 'Costo Marginal por Kg Ganado',
    hu07_marginal_margin: 'Margen Neto por Kg Adicional',
    hu07_daily_loss_gain: 'Pérdida/Ganancia Diaria Proyectada',
    hu07_target_weight: 'Peso Objetivo Comercial',
    hu07_status_optimal: '¡Cosecha Inmediata!',
    hu07_status_approaching: 'Acabado Final',
    hu07_status_growth: 'Crecimiento Eficiente',
    hu07_recommended_date: 'Fecha Sugerida de Cosecha',

    // HU-10 Swine Infrastructure
    tab_ponds: 'Estanques (Piscicultura)',
    tab_swine: 'Galpones & Corrales (Porcicultura HU-10)',
    btn_new_barn: 'Nuevo Galpón',
    btn_new_pen: 'Nuevo Corral',
    barns_section_title: 'Galpones de Alojamiento Porcícola',
    pens_section_title: 'Corrales y Aforo Zootécnico',
    no_barns_title: 'No hay galpones registrados en esta granja',
    no_barns_desc: 'Registra naves o galpones para estructurar los corrales por etapas zootécnicas (precebo, levante, ceba, maternidad).',
    no_pens_desc: 'Este galpón aún no tiene corrales. Agrega corrales calculando el aforo de cabezas según su área.',
    stage_precebo: 'Precebo (0.35 m²/lechón)',
    stage_levante: 'Levante (0.65 m²/cerdo)',
    stage_ceba: 'Ceba / Finalización (1.00 m²/cerdo)',
    stage_maternidad: 'Maternidad (4.50 m²/cerda)',
    stage_gestacion: 'Gestación (2.25 m²/cerda)',
    capacity_heads: 'Aforo Máximo de Cabezas',
    drinker_label: 'Bebederos',
    feeder_label: 'Bocas de Comedero',

    // HU-11 Swine Batches & Nutrition
    tab_batches_all: 'Todos los Lotes',
    tab_batches_fish: 'Piscicultura (Estanques)',
    tab_batches_swine: 'Porcicultura (Corrales HU-11)',
    type_fish_label: 'Acuícola / Peces (Siembra en Estanque)',
    type_swine_label: 'Porcícola / Cerdos (Alojamiento en Corral HU-11)',
    label_pen: 'Corral',
    label_barn: 'Galpón',
  },
  en: {
    // App & Header
    app_name: 'AgroPrecision',
    app_tagline: 'Field Journal & Logbook',
    app_subtitle: 'Fish & Swine Farming • Precision Zootechnics',
    edition_label: 'Field Zootechnical Edition',

    // Navigation Sections
    section_notebook: 'I. Field & Logbook',
    section_facilities: 'II. Facilities & Batches',
    section_reference: 'III. Reference & Economics',

    // Navigation Items
    nav_home: 'Dashboard & Journal',
    nav_feeding: 'Field Feeding',
    nav_biometries: 'Biometry & FCR',
    nav_farms: 'Farms & Ponds',
    nav_batches: 'Batches & Stocking',
    nav_library: 'Technical Library',
    nav_stats: 'Statistics & Curves',
    nav_finances: 'Finances ($/kg)',
    nav_vet: 'AI Veterinary Clinic',

    // Mobile Navigation
    nav_mobile_home: 'Home',
    nav_mobile_farms: 'Farms',
    nav_mobile_feeding: 'Field',
    nav_mobile_library: 'Library',
    nav_mobile_finances: 'Finances',

    // Network & Sync Status
    status_online: 'Online',
    status_offline: 'Offline (Field Mode)',
    status_pending: 'pending synchronization',
    btn_sync: 'Sync Data',
    sync_in_progress: 'Syncing with cloud...',
    sync_done: 'All records up to date',

    // PWA & Installation
    btn_install_app: 'Install Field Mobile App',
    btn_install_title: 'Install app on home screen to use offline in fields',
    install_menu_label: 'Install on Phone',
    theme_toggle: 'Toggle Dark/Light Mode',
    lang_toggle: 'Change Language',
    dark_mode_active: 'Enabled',
    dark_mode_inactive: 'Disabled',

    // Dashboard: Layout & Headlines
    dashboard_title: 'Daily Field Logbook',
    dashboard_subtitle: 'Today’s field tasks, biological pond status, and zootechnical management',
    date_today: 'Today',
    journal_entry: 'Logbook Entry',

    // Dashboard: Pendiente Hoy (Task-first)
    pending_today_title: 'Pending Today',
    pending_today_desc: 'High-priority field operations for the current day',
    task_feed_due: 'Scheduled Feed Ration',
    task_feed_due_desc: 'Morning/evening feeding round required',
    task_biometry_due: 'Weekly Biometric Sampling',
    task_biometry_due_desc: 'Weight sample and FCR calculation required for this batch',
    task_water_quality: 'Water Quality Inspection',
    task_water_quality_desc: 'Dissolved oxygen and water temperature reading recommended',
    task_overcrowding_alert: 'Pond Overcrowding Alert',
    task_overcrowding_alert_desc: 'Biomass capacity exceeded. Split or transfer required',
    all_tasks_completed: 'All daily tasks are marked as completed in the logbook.',
    btn_execute_task: 'Complete in Field',

    // Dashboard: Calendar & Journal View
    calendar_title: 'Zootechnical Activity Calendar',
    calendar_desc: 'Historical and scheduled feedings, weighings, and events by day',
    calendar_month_sep: 'September 2026',
    calendar_day_m: 'M',
    calendar_day_t: 'T',
    calendar_day_w: 'W',
    calendar_day_th: 'T',
    calendar_day_f: 'F',
    calendar_day_sa: 'S',
    calendar_day_su: 'S',
    events_for_day: 'Logged events for',
    no_events_day: 'No events recorded in the logbook for this date.',
    add_journal_note: 'Log Field Note',

    // Dashboard: Single-row KPIs
    kpi_biomass: 'Active Biomass',
    kpi_biomass_unit: 'live kg',
    kpi_batches: 'Batches in Production',
    kpi_batches_unit: 'active batches',
    kpi_fcr: 'Global Weighted FCR',
    kpi_fcr_unit: 'kg feed / kg gain',
    kpi_cost_kg: 'Average Cost / kg',
    kpi_cost_kg_unit: 'USD / kg produced',

    // Useful Empty States
    empty_no_batches_title: 'No batches stocked yet',
    empty_no_batches_msg: 'Start by gauging your ponds and stocking your first fingerlings or piglets.',
    empty_no_farms_title: 'No farms or ponds configured',
    empty_no_farms_msg: 'Set up your pond dimensions to calculate water volume and maximum biomass carrying capacity in m³.',
    btn_create_first_farm: 'Create First Farm',
    btn_create_first_pond: 'Gauge New Pond',
    btn_stock_first_batch: 'Stock First Batch',

    // Chronological Feed & Thumbnails (Day One style)
    recent_chronological_title: 'Chronological Batches Journal',
    view_details: 'View Full Entry',
    photo_attached: 'Field photo attached',
    take_photo_prompt: 'Attach field photo (water, fish, feed)',
    thumbnail_label: 'Thumbnail',

    // Species & Farm Types
    species_fish: 'Aquaculture',
    species_swine: 'Swine Farming',
    species_tilapia: 'Red / Nile Tilapia',
    species_trout: 'Rainbow Trout',
    species_pig_growth: 'Growing Pigs',
    species_pig_finish: 'Finishing Pigs',

    // Standard Buttons
    btn_new_pond: 'New Pond',
    btn_new_batch: 'Stock Batch',
    btn_new_sampling: 'New Sampling',
    btn_feed_touch: 'Feed (1-Touch)',
    btn_record_cost: 'Record Cost',
    btn_cancel: 'Cancel',
    btn_save: 'Save Record',
    btn_back: 'Back',

    // Common labels
    label_batch: 'Batch',
    label_pond: 'Pond',
    label_species: 'Species',
    label_date: 'Date',
    label_weight: 'Avg Weight',
    label_density: 'Stocking Density',
    label_status: 'Status',

    // HU-07 Harvest Optimization & Biological Inflexion
    hu07_title: 'Biological Inflexion & Optimal Harvest (HU-07)',
    hu07_subtitle: 'Marginal FCR calculation and optimal economic harvest window vs live market price.',
    hu07_market_price: 'Live Market Price (COP/kg)',
    hu07_marginal_fcr: 'Marginal FCR',
    hu07_marginal_cost: 'Marginal Cost per Kg Gained',
    hu07_marginal_margin: 'Net Margin per Additional Kg',
    hu07_daily_loss_gain: 'Projected Daily Profit/Loss',
    hu07_target_weight: 'Target Commercial Weight',
    hu07_status_optimal: 'Immediate Harvest!',
    hu07_status_approaching: 'Final Finishing',
    hu07_status_growth: 'Efficient Growth',
    hu07_recommended_date: 'Suggested Harvest Date',

    // HU-10 Swine Infrastructure
    tab_ponds: 'Ponds (Aquaculture)',
    tab_swine: 'Barns & Pens (Swine HU-10)',
    btn_new_barn: 'New Barn',
    btn_new_pen: 'New Pen',
    barns_section_title: 'Swine Housing Barns',
    pens_section_title: 'Pens & Zootechnical Capacity',
    no_barns_title: 'No barns registered in this farm',
    no_barns_desc: 'Register barns to organize pens by zootechnical phase (nursery, grower, finisher, farrowing).',
    no_pens_desc: 'This barn has no pens yet. Add pens with automatic stocking head count calculations.',
    stage_precebo: 'Nursery (0.35 m²/piglet)',
    stage_levante: 'Grower (0.65 m²/pig)',
    stage_ceba: 'Finisher (1.00 m²/pig)',
    stage_maternidad: 'Farrowing (4.50 m²/sow)',
    stage_gestacion: 'Gestation (2.25 m²/sow)',
    capacity_heads: 'Max Capacity (Heads)',
    drinker_label: 'Drinkers',
    feeder_label: 'Feeder Spaces',

    // HU-11 Swine Batches & Nutrition
    tab_batches_all: 'All Batches',
    tab_batches_fish: 'Fish (Ponds)',
    tab_batches_swine: 'Swine (Pens HU-11)',
    type_fish_label: 'Aquaculture / Fish (Stock in Pond)',
    type_swine_label: 'Swine / Pigs (House in Pen HU-11)',
    label_pen: 'Pen',
    label_barn: 'Barn',
  }
};

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
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

  const t = (key: string): string => {
    if (translations[language] && translations[language][key]) {
      return translations[language][key];
    }
    // Fallback to Spanish or original key
    if (translations.es && translations.es[key]) {
      return translations.es[key];
    }
    return key;
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
