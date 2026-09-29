import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Utensils,
  Activity,
  AlertTriangle,
  Plus,
  CheckCircle2,
  Layers,
  Fish,
  Camera,
  ArrowRight,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { Farm, Batch, FeedingRecord } from '../types';
import { useTranslation } from '../context/LanguageContext';

interface DayEvent {
  id: string;
  time: string;
  type: 'feeding' | 'biometry' | 'alert' | 'note';
  title: string;
  batch: string;
  species: string;
  pond: string;
  detail: string;
  hasPhoto?: boolean;
  photoUrl?: string;
}

export const DashboardPage: React.FC = () => {
  const { t, language } = useTranslation();
  const navigate = useNavigate();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Calendario interactivo
  const [selectedDay, setSelectedDay] = useState<number>(29);
  const currentMonthYear = language === 'es' ? 'Septiembre 2026' : 'September 2026';

  // Lote seleccionado para panel de lectura / detalle
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const farmsData = await api.getFarms();
      setFarms(farmsData);

      if (farmsData.length > 0) {
        const allBatches: Batch[] = [];
        for (const farm of farmsData) {
          const b = await api.getBatchesByFarm(farm.id);
          allBatches.push(...b);
        }
        setBatches(allBatches);
        if (allBatches.length > 0) {
          setSelectedBatchId(allBatches[0].id);
        }
      }
    } catch (err) {
      console.error('Error cargando datos de bitácora:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeBatches = batches.filter((b) => b.status !== 'harvested' && b.status !== 'cancelled');
  const totalBiomass = activeBatches.reduce((acc, b) => acc + (b.initialBiomassKg || 0), 0);
  const selectedBatch = batches.find((b) => b.id === selectedBatchId) || (batches.length > 0 ? batches[0] : null);

  // Generación de tareas "Pendiente hoy" según los lotes en campo
  const pendingTasks = [
    ...activeBatches.map((b) => ({
      id: `feed-${b.id}`,
      type: 'feeding' as const,
      title: t('task_feed_due'),
      batch: b.batchCode,
      pond: b.pondCodeName || 'Estanque 1',
      species: b.speciesCommonName,
      detail: `Ración 2 de 3 • ${(b.initialBiomassKg * 0.012).toFixed(1)} kg recomendados`,
      actionUrl: '/feeding',
      actionLabel: t('btn_feed_touch'),
    })),
    ...activeBatches
      .filter((b) => b.overcrowdingWarning)
      .map((b) => ({
        id: `alert-${b.id}`,
        type: 'alert' as const,
        title: t('task_overcrowding_alert'),
        batch: b.batchCode,
        pond: b.pondCodeName || 'Estanque',
        species: b.speciesCommonName,
        detail: `Densidad actual +${b.overcrowdingPercentage || 15}% sobre capacidad segura`,
        actionUrl: '/batches',
        actionLabel: t('view_details'),
      }))
  ];

  // Eventos para el calendario interactivo
  const calendarEvents: Record<number, DayEvent[]> = {
    27: [
      {
        id: 'ev-27-1',
        time: '07:30',
        type: 'feeding',
        title: 'Alimentación matutina',
        batch: batches[0]?.batchCode || 'LT-TIL-01',
        species: 'Tilapia Roja',
        pond: 'Estanque E-01',
        detail: 'Suministrado 18.5 kg de concentrado 32% proteína.',
        hasPhoto: true,
      },
    ],
    28: [
      {
        id: 'ev-28-1',
        time: '09:00',
        type: 'biometry',
        title: 'Muestreo biométrico quincenal',
        batch: batches[0]?.batchCode || 'LT-TIL-01',
        species: 'Tilapia Roja',
        pond: 'Estanque E-01',
        detail: 'Muestra de 30 ejemplares. Peso promedio: 245 g. FCR: 1.28 (Óptimo).',
        hasPhoto: true,
      },
      {
        id: 'ev-28-2',
        time: '16:00',
        type: 'feeding',
        title: 'Alimentación vespertina',
        batch: batches[0]?.batchCode || 'LT-TIL-01',
        species: 'Tilapia Roja',
        pond: 'Estanque E-01',
        detail: 'Suministrado 19.0 kg.',
      },
    ],
    29: [
      {
        id: 'ev-29-1',
        time: '07:00',
        type: 'feeding',
        title: 'Alimentación matutina (Turno 1)',
        batch: batches[0]?.batchCode || 'LT-TIL-01',
        species: 'Tilapia Roja',
        pond: 'Estanque E-01',
        detail: 'Ración suministrada sin novedades de consumo.',
        hasPhoto: true,
      },
      {
        id: 'ev-29-2',
        time: '11:30',
        type: 'note',
        title: 'Lectura de Oxígeno & Transparencia',
        batch: batches[0]?.batchCode || 'LT-TIL-01',
        species: 'Tilapia Roja',
        pond: 'Estanque E-01',
        detail: 'Oxígeno disuelto: 5.6 mg/L, Temp: 27.8 °C, Disco Secchi: 32 cm. Parámetros óptimos.',
      },
      {
        id: 'ev-29-3',
        time: '16:30',
        type: 'feeding',
        title: 'Alimentación vespertina programada',
        batch: batches[0]?.batchCode || 'LT-TIL-01',
        species: 'Tilapia Roja',
        pond: 'Estanque E-01',
        detail: 'Turno en espera de suministro en campo.',
      },
    ],
    30: [
      {
        id: 'ev-30-1',
        time: '08:00',
        type: 'biometry',
        title: 'Programación: Pesaje de lote',
        batch: batches[1]?.batchCode || 'LT-PIG-02',
        species: 'Cerdos en Ceba',
        pond: 'Galpón G-02',
        detail: 'Control de ganancia media diaria esperada (GMD).',
      },
    ],
  };

  const selectedDayEvents = calendarEvents[selectedDay] || [];

  // Miniatura visual según especie
  const getSpeciesAvatar = (speciesName: string = '') => {
    const isFish = !speciesName.toLowerCase().includes('cerd') && !speciesName.toLowerCase().includes('porc') && !speciesName.toLowerCase().includes('pig');
    if (isFish) {
      return (
        <div className="w-11 h-11 rounded-[4px] bg-[#3B5568]/15 text-[#3B5568] dark:text-[#8EA8BA] border border-[#3B5568]/30 flex items-center justify-center shrink-0">
          <Fish className="w-6 h-6" />
        </div>
      );
    }
    return (
      <div className="w-11 h-11 rounded-[4px] bg-[#8A4B2A]/15 text-[#8A4B2A] dark:text-[#D99675] border border-[#8A4B2A]/30 flex items-center justify-center shrink-0">
        <span className="font-serif font-bold text-base">🐖</span>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-7">
      {/* ========================================================================= */}
      {/* 1. Cabecera Estilo Cuaderno / Bitácora de Campo */}
      {/* ========================================================================= */}
      <div className="border-b border-[#E2D9CA] dark:border-[#332E27] pb-4 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="notebook-stamp">
              {language === 'es' ? '29 SEP 2026 • BITÁCORA' : '29 SEP 2026 • LOGBOOK'}
            </span>
            <span className="text-xs text-[#666159] dark:text-[#9E9689] uppercase tracking-wider font-mono">
              FOLIO #042
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#1F1D1A] dark:text-[#EDE6DA] font-semibold tracking-tight">
            {t('dashboard_title')}
          </h1>
          <p className="text-sm text-[#666159] dark:text-[#9E9689] mt-0.5 max-w-2xl">
            {t('dashboard_subtitle')}
          </p>
        </div>

        {/* Botones de acción rápida de cuaderno */}
        <div className="flex items-center gap-2.5">
          <Link
            to="/feeding"
            className="btn-primary text-xs sm:text-sm px-4 h-11"
            title="Registrar ración en campo"
          >
            <Utensils className="w-4 h-4" />
            <span>{t('btn_feed_touch')}</span>
          </Link>
          <Link
            to="/biometries"
            className="btn-secondary text-xs sm:text-sm px-3.5 h-11"
            title="Registrar muestreo"
          >
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">{t('btn_new_sampling')}</span>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Sección Prioritaria: PENDIENTE HOY (Ordenado por tareas) */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-serif font-semibold text-[#1F1D1A] dark:text-[#EDE6DA]">
              {t('pending_today_title')}
            </h2>
            <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-[#8A4B2A]/15 text-[#8A4B2A] dark:text-[#D99675] border border-[#8A4B2A]/30">
              {pendingTasks.length} {language === 'es' ? 'urgentes' : 'due'}
            </span>
          </div>
          <span className="text-xs text-[#666159] dark:text-[#9E9689]">
            {language === 'es' ? 'Turno en curso' : 'Current shift'}
          </span>
        </div>

        {pendingTasks.length === 0 ? (
          <div className="card-paper p-6 text-center border-l-4 border-l-[#2A6B3D]">
            <CheckCircle2 className="w-8 h-8 text-[#2A6B3D] mx-auto mb-2" />
            <h3 className="font-serif font-semibold text-base text-[#1F1D1A] dark:text-[#EDE6DA]">
              {t('all_tasks_completed')}
            </h3>
            <p className="text-xs text-[#666159] dark:text-[#9E9689] mt-1">
              {language === 'es'
                ? 'Todos los lotes tienen sus raciones y controles de muestreo al día.'
                : 'All batches have their nutritional quotas and sampling checks logged.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {pendingTasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                className={`card-paper p-4 flex flex-col justify-between border-l-[4px] ${
                  task.type === 'alert'
                    ? 'border-l-[#A32A26]'
                    : 'border-l-[#2E4A36]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="notebook-stamp">
                      {task.batch}
                    </span>
                    <span className="text-[#666159] dark:text-[#9E9689] font-mono text-[11px]">
                      {task.pond}
                    </span>
                  </div>

                  <h3 className="font-serif font-semibold text-sm sm:text-base text-[#1F1D1A] dark:text-[#EDE6DA] flex items-center gap-1.5">
                    {task.type === 'alert' ? (
                      <AlertTriangle className="w-4 h-4 text-[#A32A26] shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-[#2E4A36] dark:text-[#86A98F] shrink-0" />
                    )}
                    <span>{task.title}</span>
                  </h3>
                  <p className="text-xs text-[#666159] dark:text-[#9E9689] mt-1 leading-relaxed">
                    {task.detail}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-[#E2D9CA] dark:border-[#332E27] flex items-center justify-between">
                  <span className="text-[11px] text-[#666159] dark:text-[#9E9689]">
                    {task.species}
                  </span>
                  <Link
                    to={task.actionUrl}
                    className="text-xs font-semibold text-[#2E4A36] dark:text-[#86A98F] hover:underline flex items-center gap-1"
                  >
                    <span>{task.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 3. Fila de KPIs del Cuaderno (En una sola fila con Estados Vacíos Útiles) */}
      {/* ========================================================================= */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* KPI 1: Biomasa Activa */}
          <div className="card-paper p-4 flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#666159] dark:text-[#9E9689]">
              {t('kpi_biomass')}
            </span>
            <div className="mt-2">
              {loading ? (
                <span className="text-2xl font-serif">...</span>
              ) : activeBatches.length === 0 ? (
                <div className="text-xs text-[#666159] dark:text-[#9E9689]">
                  <p className="font-serif text-sm font-semibold text-[#1F1D1A] dark:text-[#EDE6DA]">
                    {t('empty_no_batches_title')}
                  </p>
                  <Link to="/farms" className="text-[#2E4A36] dark:text-[#86A98F] underline text-[11px] mt-0.5 inline-block">
                    {t('btn_create_first_pond')}
                  </Link>
                </div>
              ) : (
                <div>
                  <span className="text-2xl sm:text-3xl font-serif font-bold text-[#1F1D1A] dark:text-[#EDE6DA] metric-number">
                    {totalBiomass.toLocaleString()}
                  </span>
                  <span className="text-xs text-[#666159] dark:text-[#9E9689] ml-1.5">
                    {t('kpi_biomass_unit')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* KPI 2: Lotes en Producción */}
          <div className="card-paper p-4 flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#666159] dark:text-[#9E9689]">
              {t('kpi_batches')}
            </span>
            <div className="mt-2">
              {loading ? (
                <span className="text-2xl font-serif">...</span>
              ) : activeBatches.length === 0 ? (
                <div className="text-xs text-[#666159] dark:text-[#9E9689]">
                  <p className="font-serif text-sm font-semibold text-[#1F1D1A] dark:text-[#EDE6DA]">
                    0 lotes
                  </p>
                  <Link to="/batches" className="text-[#2E4A36] dark:text-[#86A98F] underline text-[11px] mt-0.5 inline-block">
                    {t('btn_stock_first_batch')}
                  </Link>
                </div>
              ) : (
                <div>
                  <span className="text-2xl sm:text-3xl font-serif font-bold text-[#1F1D1A] dark:text-[#EDE6DA] metric-number">
                    {activeBatches.length}
                  </span>
                  <span className="text-xs text-[#666159] dark:text-[#9E9689] ml-1.5">
                    {t('kpi_batches_unit')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* KPI 3: FCR Global Ponderado */}
          <div className="card-paper p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#666159] dark:text-[#9E9689]">
                {t('kpi_fcr')}
              </span>
              <span className="status-badge-green text-[10px] py-0 px-1.5">
                Óptimo
              </span>
            </div>
            <div className="mt-2">
              <span className="text-2xl sm:text-3xl font-serif font-bold text-[#2A6B3D] dark:text-[#86A98F] metric-number">
                1.32
              </span>
              <span className="text-xs text-[#666159] dark:text-[#9E9689] ml-1.5">
                kg alim / kg pez
              </span>
            </div>
          </div>

          {/* KPI 4: Costo Promedio / kg */}
          <div className="card-paper p-4 flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#666159] dark:text-[#9E9689]">
              {t('kpi_cost_kg')}
            </span>
            <div className="mt-2">
              <span className="text-2xl sm:text-3xl font-serif font-bold text-[#1F1D1A] dark:text-[#EDE6DA] metric-number">
                $ 8,420
              </span>
              <span className="text-xs text-[#666159] dark:text-[#9E9689] ml-1.5">
                COP / kg
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. Estructura Tipo Diario (Day One): Calendario Interactivo + Bitácora */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Panel Central (7 cols): Bitácora Cronológica de Lotes con Miniaturas */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2D9CA] dark:border-[#332E27] pb-2">
            <h2 className="text-lg font-serif font-semibold text-[#1F1D1A] dark:text-[#EDE6DA]">
              {t('recent_chronological_title')}
            </h2>
            <Link
              to="/batches"
              className="text-xs font-semibold text-[#2E4A36] dark:text-[#86A98F] hover:underline"
            >
              {language === 'es' ? 'Ver todos los lotes' : 'View all batches'} →
            </Link>
          </div>

          {batches.length === 0 ? (
            <div className="card-notebook p-6 text-center">
              <Fish className="w-10 h-10 text-[#666159] dark:text-[#9E9689] mx-auto mb-2 opacity-60" />
              <h3 className="font-serif font-semibold text-base text-[#1F1D1A] dark:text-[#EDE6DA]">
                {t('empty_no_batches_title')}
              </h3>
              <p className="text-xs text-[#666159] dark:text-[#9E9689] max-w-sm mx-auto mt-1 mb-4">
                {t('empty_no_batches_msg')}
              </p>
              <div className="flex justify-center gap-3">
                <Link to="/farms" className="btn-secondary text-xs h-10 px-4">
                  {t('btn_create_first_pond')}
                </Link>
                <Link to="/batches" className="btn-primary text-xs h-10 px-4">
                  {t('btn_stock_first_batch')}
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {batches.map((batch) => {
                const isSelected = selectedBatch?.id === batch.id;
                return (
                  <div
                    key={batch.id}
                    onClick={() => setSelectedBatchId(batch.id)}
                    className={`card-paper p-4 cursor-pointer transition-all border ${
                      isSelected
                        ? 'border-[#2E4A36] bg-[#F2ECE0] dark:bg-[#25211B]'
                        : 'hover:bg-[#F6F1E7] dark:hover:bg-[#24201B]'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Miniatura visual de especie */}
                      {getSpeciesAvatar(batch.speciesCommonName)}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-serif font-semibold text-sm sm:text-base text-[#1F1D1A] dark:text-[#EDE6DA] truncate">
                              {batch.batchCode}
                            </span>
                            <span className="notebook-stamp text-[10px] py-0.5">
                              {batch.speciesCommonName}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-[#666159] dark:text-[#9E9689]">
                            {batch.stockingDate}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-2.5 text-xs text-[#666159] dark:text-[#9E9689]">
                          <div>
                            <span className="block text-[10px] uppercase font-medium">{t('label_pond')}</span>
                            <span className="font-medium text-[#1F1D1A] dark:text-[#EDE6DA] truncate block">
                              {batch.pondCodeName || 'Sin estanque'}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase font-medium">Población</span>
                            <span className="font-semibold text-[#1F1D1A] dark:text-[#EDE6DA] metric-number block">
                              {batch.initialQuantity.toLocaleString()} inds
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase font-medium">Biomasa</span>
                            <span className="font-semibold text-[#2E4A36] dark:text-[#86A98F] metric-number block">
                              {batch.initialBiomassKg} kg
                            </span>
                          </div>
                        </div>

                        {batch.overcrowdingWarning && (
                          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-[#A32A26] bg-[#A32A26]/10 px-2 py-1 rounded-[3px] border border-[#A32A26]/20">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>Alerta: Capacidad de carga superada (+{batch.overcrowdingPercentage || 15}%)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel Derecho (5 cols): Vista de Calendario Zootécnico & Detalle del Día */}
        <div className="lg:col-span-5 space-y-4">
          <div className="card-paper p-4">
            <div className="flex items-center justify-between border-b border-[#E2D9CA] dark:border-[#332E27] pb-3 mb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#2E4A36] dark:text-[#86A98F]" />
                <h3 className="font-serif font-semibold text-sm sm:text-base text-[#1F1D1A] dark:text-[#EDE6DA]">
                  {currentMonthYear}
                </h3>
              </div>
              <div className="flex items-center gap-1 text-xs text-[#666159] dark:text-[#9E9689]">
                <button
                  onClick={() => setSelectedDay(Math.max(1, selectedDay - 1))}
                  className="p-1 hover:text-[#1F1D1A] dark:hover:text-[#EDE6DA]"
                  title="Día anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono text-xs px-1">Día {selectedDay}</span>
                <button
                  onClick={() => setSelectedDay(Math.min(30, selectedDay + 1))}
                  className="p-1 hover:text-[#1F1D1A] dark:hover:text-[#EDE6DA]"
                  title="Día siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Cuadrícula de Días del Mes */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
              <span className="text-[10px] text-[#666159] font-medium">L</span>
              <span className="text-[10px] text-[#666159] font-medium">M</span>
              <span className="text-[10px] text-[#666159] font-medium">X</span>
              <span className="text-[10px] text-[#666159] font-medium">J</span>
              <span className="text-[10px] text-[#666159] font-medium">V</span>
              <span className="text-[10px] text-[#666159] font-medium">S</span>
              <span className="text-[10px] text-[#666159] font-medium">D</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-xs">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
                const isSelected = selectedDay === d;
                const hasEvents = !!calendarEvents[d];
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDay(d)}
                    className={`h-9 flex flex-col items-center justify-center rounded-[3px] transition relative ${
                      isSelected
                        ? 'bg-[#2E4A36] text-white font-bold'
                        : hasEvents
                        ? 'bg-[#EAE2D2] dark:bg-[#28231C] text-[#1F1D1A] dark:text-[#EDE6DA] font-semibold'
                        : 'text-[#666159] dark:text-[#9E9689] hover:bg-[#F2ECE0] dark:hover:bg-[#28241F]'
                    }`}
                  >
                    <span>{d}</span>
                    {hasEvents && !isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8A4B2A] absolute bottom-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Línea Separadora */}
            <div className="divider-paper my-4" />

            {/* Actividad y Eventos del Día Seleccionado */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs uppercase tracking-wider font-semibold text-[#666159] dark:text-[#9E9689]">
                  {t('events_for_day')} {selectedDay} {currentMonthYear}
                </span>
                <span className="text-[11px] font-mono text-[#8A4B2A] dark:text-[#D99675]">
                  {selectedDayEvents.length} {language === 'es' ? 'anotaciones' : 'entries'}
                </span>
              </div>

              {selectedDayEvents.length === 0 ? (
                <p className="text-xs text-[#666159] dark:text-[#9E9689] italic py-3 text-center">
                  {t('no_events_day')}
                </p>
              ) : (
                <div className="space-y-2.5">
                  {selectedDayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 rounded-[4px] bg-[#F4EFE3]/80 dark:bg-[#181613] border border-[#E2D9CA] dark:border-[#332E27] text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] text-[#666159] dark:text-[#9E9689]">
                          {ev.time} • {ev.pond}
                        </span>
                        <span className="notebook-stamp text-[9px] py-0 px-1.5">
                          {ev.type}
                        </span>
                      </div>
                      <p className="font-serif font-semibold text-[#1F1D1A] dark:text-[#EDE6DA]">
                        {ev.title}
                      </p>
                      <p className="text-[#666159] dark:text-[#9E9689] leading-relaxed">
                        {ev.detail}
                      </p>
                      {ev.hasPhoto && (
                        <div className="pt-1 flex items-center gap-1.5 text-[11px] text-[#2E4A36] dark:text-[#86A98F]">
                          <Camera className="w-3.5 h-3.5" />
                          <span>{t('photo_attached')} (Muestreo #29)</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
