import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Fish,
  Activity,
  Utensils,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Plus,
  Download,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { Farm, Batch } from '../types';
import { useTranslation } from '../context/LanguageContext';
import { usePwa } from '../context/PwaContext';

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { isInstallable, isStandalone, installApp } = usePwa();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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
      }
    } catch (err) {
      console.error('Error cargando métricas:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeBatches = batches.filter((b) => b.status !== 'harvested' && b.status !== 'cancelled');
  const totalBiomass = activeBatches.reduce((acc, b) => acc + (b.initialBiomassKg || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner de Instalación Móvil Nativa (Si no está instalada aún) */}
      {!isStandalone && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-4 sm:p-5 rounded-3xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm shrink-0">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base flex items-center gap-1.5">
                {t('btn_install_app')}
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/25 uppercase">PWA</span>
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Instala la aplicación en tu celular para registrar alimentación y biometrías sin señal en campo.
              </p>
            </div>
          </div>
          <button
            onClick={installApp}
            className="w-full sm:w-auto px-5 py-2.5 bg-white text-emerald-900 font-extrabold text-xs rounded-xl shadow-sm hover:bg-emerald-50 transition active:scale-95 text-center shrink-0"
          >
            Instalar Ahora
          </button>
        </div>
      )}

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            {t('dashboard_title')}
            <Sparkles className="w-5 h-5 text-emerald-500" />
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('dashboard_subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/farms"
            className="btn-field bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
          >
            <Plus className="w-5 h-5" />
            {t('btn_new_pond')}
          </Link>
        </div>
      </div>

      {/* Tarjetas de Métricas Clave */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Granjas Activas</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">{loading ? '...' : farms.length}</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('active_batches')}</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">{loading ? '...' : activeBatches.length}</p>
          </div>
          <div className="p-3 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-2xl">
            <Fish className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('total_biomass')}</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              {loading ? '...' : `${totalBiomass.toLocaleString()} kg`}
            </p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('fcr_global')}</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">≤ 1.35</p>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-2xl">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Módulos Operativos de Campo */}
      <div>
        <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mb-4">
          Acciones Operativas Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link
            to="/feeding"
            className="group bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 rounded-3xl shadow-md hover:shadow-lg transition-all flex flex-col justify-between"
          >
            <div>
              <div className="p-3 bg-white/20 w-fit rounded-2xl backdrop-blur-sm mb-4">
                <Utensils className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black">{t('nav_feeding')}</h3>
              <p className="text-emerald-100 text-xs sm:text-sm mt-1">
                Consulta la cuota por biomasa viva (HU-03) y registra suministros en campo con modo sin conexión (HU-04).
              </p>
            </div>
            <div className="flex items-center gap-1 font-bold text-sm mt-6 group-hover:translate-x-1 transition">
              <span>{t('btn_feed_touch')}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          <Link
            to="/biometries"
            className="group bg-gradient-to-br from-teal-700 to-cyan-800 text-white p-6 rounded-3xl shadow-md hover:shadow-lg transition-all flex flex-col justify-between"
          >
            <div>
              <div className="p-3 bg-white/20 w-fit rounded-2xl backdrop-blur-sm mb-4">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black">{t('nav_biometries')}</h3>
              <p className="text-teal-100 text-xs sm:text-sm mt-1">
                Ingresa pesajes de muestra para computar biomasa, ganancia diaria (GMD) y semáforo de FCR automático (HU-05).
              </p>
            </div>
            <div className="flex items-center gap-1 font-bold text-sm mt-6 group-hover:translate-x-1 transition">
              <span>{t('btn_new_sampling')}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          <Link
            to="/finances"
            className="group bg-gradient-to-br from-slate-900 to-slate-950 text-white p-6 rounded-3xl shadow-md hover:shadow-lg border border-slate-800 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="p-3 bg-white/20 w-fit rounded-2xl backdrop-blur-sm mb-4">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black">{t('nav_finances')}</h3>
              <p className="text-slate-300 text-xs sm:text-sm mt-1">
                Monitorea el costo acumulado de producción y el costo por kilogramo producido ($/kg) en tiempo real (HU-06).
              </p>
            </div>
            <div className="flex items-center gap-1 font-bold text-sm mt-6 group-hover:translate-x-1 transition">
              <span>{t('btn_record_cost')}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </div>

      {/* Lotes activos recientes */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 transition-colors">
        <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mb-4">
          {t('active_batches')}
        </h2>
        {batches.length === 0 ? (
          <div className="text-center py-10 text-slate-500 dark:text-slate-400">
            <Fish className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p>Aún no hay lotes registrados.</p>
            <Link to="/batches" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline mt-1 inline-block">
              {t('btn_new_batch')}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-800 text-xs uppercase">
                <tr>
                  <th className="py-3 px-4">Lote</th>
                  <th className="py-3 px-4">Especie</th>
                  <th className="py-3 px-4">Estanque</th>
                  <th className="py-3 px-4">Población Inicial</th>
                  <th className="py-3 px-4">Biomasa Inicial</th>
                  <th className="py-3 px-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">{b.batchCode}</td>
                    <td className="py-3 px-4">{b.speciesCommonName}</td>
                    <td className="py-3 px-4">{b.pondCodeName || 'Sin estanque'}</td>
                    <td className="py-3 px-4">{b.initialQuantity.toLocaleString()}</td>
                    <td className="py-3 px-4 font-bold text-emerald-700 dark:text-emerald-400">{b.initialBiomassKg} kg</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
