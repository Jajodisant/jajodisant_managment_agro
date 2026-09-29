import React, { useEffect, useState } from 'react';
import {
  Activity,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Scale,
  TrendingUp,
  Skull,
  Calendar,
  Layers,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { Farm, Batch, Biometry } from '../types';
import { useTranslation } from '../context/LanguageContext';

export const BiometriesPage: React.FC = () => {
  const { t } = useTranslation();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [biometries, setBiometries] = useState<Biometry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Formulario de Biometría
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [samplingDate, setSamplingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sampledCount, setSampledCount] = useState<number>(30);
  const [totalSampleWeightG, setTotalSampleWeightG] = useState<number>(4500);
  const [observedMortality, setObservedMortality] = useState<number>(0);
  const [observations, setObservations] = useState<string>('');

  const calculatedAvgWeightG = sampledCount > 0 ? Number((totalSampleWeightG / sampledCount).toFixed(2)) : 0;

  useEffect(() => {
    loadFarms();
  }, []);

  useEffect(() => {
    if (selectedFarmId) {
      loadBatches(selectedFarmId);
    } else {
      setBatches([]);
      setSelectedBatchId('');
    }
  }, [selectedFarmId]);

  useEffect(() => {
    if (selectedBatchId) {
      loadBiometries(selectedBatchId);
    } else {
      setBiometries([]);
    }
  }, [selectedBatchId]);

  const loadFarms = async () => {
    try {
      setLoading(true);
      const data = await api.getFarms();
      setFarms(data);
      if (data.length > 0) {
        setSelectedFarmId(data[0].id);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al cargar las granjas');
    } finally {
      setLoading(false);
    }
  };

  const loadBatches = async (farmId: string) => {
    try {
      const data = await api.getBatchesByFarm(farmId);
      setBatches(data);
      if (data.length > 0) {
        setSelectedBatchId(data[0].id);
      } else {
        setSelectedBatchId('');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al cargar lotes');
    }
  };

  const loadBiometries = async (batchId: string) => {
    try {
      setLoading(true);
      const data = await api.getBiometries(batchId);
      setBiometries(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al cargar biometrías');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId) return;

    if (sampledCount <= 0 || totalSampleWeightG <= 0) {
      setErrorMessage('La cantidad muestreada y el peso total deben ser mayores a cero.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);

      await api.recordBiometry(selectedBatchId, {
        samplingDate,
        sampledCount,
        totalSampleWeightG,
        observedMortality,
        observations: observations.trim() || undefined
      });

      setSuccessMessage('Biometría registrada exitosamente. FCR y GMD calculados en tiempo real.');
      setIsModalOpen(false);
      resetForm();
      await loadBiometries(selectedBatchId);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al guardar la biometría');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSamplingDate(new Date().toISOString().split('T')[0]);
    setSampledCount(30);
    setTotalSampleWeightG(4500);
    setObservedMortality(0);
    setObservations('');
  };

  const selectedBatch = batches.find(b => b.id === selectedBatchId);
  const latestBiometry = biometries.length > 0 ? biometries[0] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Activity className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            {t('biometries_title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            {t('biometries_subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => selectedBatchId && loadBiometries(selectedBatchId)}
            className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm"
            title="Recargar biometrías"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={!selectedBatchId}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-2xl shadow-sm transition disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {t('btn_new_sampling')}
          </button>
        </div>
      </div>

      {/* Selectores de Granja y Lote */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 transition-colors">
          <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="flex-1">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Seleccionar Granja
            </label>
            <select
              value={selectedFarmId}
              onChange={(e) => setSelectedFarmId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 px-3 text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {farms.map((farm) => (
                <option key={farm.id} value={farm.id} className="dark:bg-slate-900">
                  {farm.name} ({farm.pondsCount} estanques)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 transition-colors">
          <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="flex-1">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Lote a Evaluar
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              disabled={batches.length === 0}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 px-3 text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
            >
              {batches.length === 0 ? (
                <option value="">No hay lotes en esta granja</option>
              ) : (
                batches.map((batch) => (
                  <option key={batch.id} value={batch.id} className="dark:bg-slate-900">
                    Lote {batch.batchCode} - {batch.speciesCommonName} ({batch.status})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Mensajes de Alerta */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 flex items-start gap-3 text-red-700 dark:text-red-300 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
          <div>{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3 text-emerald-800 dark:text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
          <div>{successMessage}</div>
        </div>
      )}

      {/* Tarjetas KPI de Estado Biológico Actual */}
      {selectedBatch && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Peso Promedio</span>
              <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {latestBiometry ? `${latestBiometry.calculatedAvgWeightG.toFixed(1)} g` : `${selectedBatch.initialAvgWeightG.toFixed(1)} g`}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Inicial: {selectedBatch.initialAvgWeightG.toFixed(1)} g
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">GMD (Ganancia Diaria)</span>
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {latestBiometry?.dailyWeightGainG ? `${latestBiometry.dailyWeightGainG.toFixed(2)} g/d` : '0.00 g/d'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Crecimiento promedio</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Biomasa Actual</span>
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {latestBiometry ? `${latestBiometry.estimatedBiomassKg.toFixed(1)} kg` : `${selectedBatch.initialBiomassKg.toFixed(1)} kg`}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Población: {latestBiometry?.remainingPopulation ?? selectedBatch.initialQuantity} peces
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">FCR Acumulado</span>
              {latestBiometry?.fcrStatus === 'GREEN' && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              {latestBiometry?.fcrStatus === 'AMBER' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
              {latestBiometry?.fcrStatus === 'RED' && <AlertOctagon className="w-4 h-4 text-red-600 dark:text-red-400" />}
              {!latestBiometry && <Info className="w-4 h-4 text-slate-400" />}
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {latestBiometry?.accumulatedFcr ? latestBiometry.accumulatedFcr.toFixed(2) : 'N/D'}
            </div>
            <div className="mt-1">
              {latestBiometry?.fcrStatus === 'GREEN' && (
                <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                  {t('fcr_excellent')}
                </span>
              )}
              {latestBiometry?.fcrStatus === 'AMBER' && (
                <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300">
                  {t('fcr_amber')}
                </span>
              )}
              {latestBiometry?.fcrStatus === 'RED' && (
                <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300">
                  {t('fcr_critical')}
                </span>
              )}
              {!latestBiometry && (
                <span className="text-xs text-slate-400">Sin datos de FCR</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Historial de Muestreos */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Historial de Muestreos y Evolución</h2>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{biometries.length} registros</span>
        </div>

        {biometries.length === 0 ? (
          <div className="p-12 text-center">
            <Scale className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-slate-800 dark:text-slate-200 font-bold text-base mb-1">Sin biometrías registradas</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto mb-4">
              Realiza el primer muestreo biométrico del lote para comenzar el seguimiento de FCR y tasa de crecimiento.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={!selectedBatchId}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-4 py-2 rounded-2xl shadow-sm transition disabled:opacity-50"
            >
              Registrar Primer Muestreo
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-xs uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Muestra</th>
                  <th className="px-4 py-3">Peso Promedio</th>
                  <th className="px-4 py-3">GMD</th>
                  <th className="px-4 py-3">Población Activa</th>
                  <th className="px-4 py-3">Biomasa Total</th>
                  <th className="px-4 py-3">Ganancia Neta</th>
                  <th className="px-4 py-3">Alimento Acum.</th>
                  <th className="px-4 py-3">FCR Acumulado</th>
                  <th className="px-4 py-3">Estado FCR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {biometries.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {b.samplingDate}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {b.sampledCount} peces ({b.totalSampleWeightG} g)
                    </td>
                    <td className="px-4 py-3.5 font-extrabold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                      {b.calculatedAvgWeightG.toFixed(1)} g
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {b.dailyWeightGainG ? `${b.dailyWeightGainG.toFixed(2)} g/d` : '-'}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {b.remainingPopulation ?? '-'}
                      {b.observedMortality > 0 && (
                        <span className="ml-1 text-xs text-red-500">(-{b.observedMortality})</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {b.estimatedBiomassKg.toFixed(1)} kg
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {b.netBiomassGainedKg ? `+${b.netBiomassGainedKg.toFixed(1)} kg` : '-'}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {b.accumulatedFeedKg ? `${b.accumulatedFeedKg.toFixed(1)} kg` : '-'}
                    </td>
                    <td className="px-4 py-3.5 font-black text-slate-900 dark:text-white whitespace-nowrap">
                      {b.accumulatedFcr ? b.accumulatedFcr.toFixed(2) : '-'}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {b.fcrStatus === 'GREEN' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Excelente
                        </span>
                      )}
                      {b.fcrStatus === 'AMBER' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Alerta
                        </span>
                      )}
                      {b.fcrStatus === 'RED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300">
                          <AlertOctagon className="w-3 h-3 text-red-600" />
                          Crítico
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Registro de Biometría */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 overflow-y-auto max-h-[90vh] transition-colors">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Registrar Muestreo Biométrico</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Cálculo de peso promedio y factor de conversión</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Fecha de Muestreo
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="date"
                    required
                    value={samplingDate}
                    onChange={(e) => setSamplingDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Peces Muestreados
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={sampledCount}
                    onChange={(e) => setSampledCount(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-bold"
                    placeholder="ej. 30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Peso Total Muestra (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={totalSampleWeightG}
                    onChange={(e) => setTotalSampleWeightG(Math.max(0.1, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-bold"
                    placeholder="ej. 4500"
                  />
                </div>
              </div>

              {/* Cálculo en vivo de peso promedio */}
              <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase block">
                    Peso Promedio Calculado
                  </span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">
                    {totalSampleWeightG} g / {sampledCount} peces
                  </span>
                </div>
                <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                  {calculatedAvgWeightG} g
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mortalidad Observada (Opcional)
                </label>
                <div className="relative">
                  <Skull className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="number"
                    min="0"
                    value={observedMortality}
                    onChange={(e) => setObservedMortality(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                    placeholder="0 si no hubo mortalidad"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Se restará de la población activa del estanque.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Observaciones Técnicas (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  placeholder="Comportamiento, condición corporal, pigmentación, etc."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                >
                  {t('btn_cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-2xl shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Calculando...' : t('btn_save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
