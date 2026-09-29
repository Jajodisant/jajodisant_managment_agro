import React, { useEffect, useState } from 'react';
import {
  Activity,
  Plus,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Scale,
  TrendingUp,
  Skull,
  Calendar,
  Layers,
  Info,
  Camera
} from 'lucide-react';
import { api } from '../services/api';
import { Farm, Batch, Biometry } from '../types';
import { useTranslation } from '../context/LanguageContext';

export const BiometriesPage: React.FC = () => {
  const { t, language } = useTranslation();
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

  const handleCreateBiometry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId) return;

    try {
      setSubmitting(true);
      setErrorMessage(null);

      await api.recordBiometry(selectedBatchId, {
        samplingDate,
        sampledCount: Number(sampledCount),
        totalSampleWeightG: Number(totalSampleWeightG),
        observedMortality: Number(observedMortality),
        observations: observations.trim() || undefined
      });

      setSuccessMessage(
        language === 'es'
          ? '¡Muestreo biométrico asentado exitosamente en el cuaderno de bitácora!'
          : 'Biometric sampling recorded successfully in journal!'
      );
      setIsModalOpen(false);
      resetForm();
      await loadBiometries(selectedBatchId);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al asentar el muestreo');
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

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);
  const latestBiometry = biometries.length > 0 ? biometries[0] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Mensajes de Feedback */}
      {successMessage && (
        <div className="card-paper bg-[#EDF3EE] dark:bg-[#18231C] border-[#2E4A36] text-[#2E4A36] dark:text-[#86A98F] px-4 py-3 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-semibold text-sm">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="card-paper bg-[#A32A26]/10 border-[#A32A26]/30 text-[#A32A26] dark:text-[#E5807D] px-4 py-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="font-semibold text-sm">{errorMessage}</span>
        </div>
      )}

      {/* Cabecera Estilo Cuaderno */}
      <div className="border-b border-[#E2D9CA] dark:border-[#332E27] pb-4 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="notebook-stamp">
              FOLIO #05 • CONTROL BIOMÉTRICO
            </span>
            <span className="text-xs text-[#666159] dark:text-[#9E9689] uppercase tracking-wider font-mono">
              NORMA HU-05
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#1F1D1A] dark:text-[#EDE6DA] font-semibold tracking-tight">
            {t('biometries_title')}
          </h1>
          <p className="text-sm text-[#666159] dark:text-[#9E9689] mt-0.5 max-w-2xl">
            {t('biometries_subtitle')}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          disabled={!selectedBatchId}
          className="btn-primary text-xs sm:text-sm px-4 h-11 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>{t('btn_new_sampling')}</span>
        </button>
      </div>

      {/* Selector de Carpeta de Campo: Granja y Lote */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card-paper p-4 flex items-center gap-3">
          <Layers className="w-5 h-5 text-[#2E4A36] dark:text-[#86A98F] shrink-0" />
          <div className="flex-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#666159] dark:text-[#9E9689] block mb-1">
              {language === 'es' ? 'Granja de Producción' : 'Production Farm'}
            </label>
            <select
              value={selectedFarmId}
              onChange={(e) => setSelectedFarmId(e.target.value)}
              className="w-full bg-transparent font-serif font-semibold text-sm sm:text-base text-[#1F1D1A] dark:text-[#EDE6DA] border-0 focus:ring-0 cursor-pointer p-0"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id} className="bg-[#FBF8F1] dark:bg-[#1F1C18] text-[#1F1D1A] dark:text-[#EDE6DA]">
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="card-paper p-4 flex items-center gap-3">
          <Activity className="w-5 h-5 text-[#2E4A36] dark:text-[#86A98F] shrink-0" />
          <div className="flex-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#666159] dark:text-[#9E9689] block mb-1">
              {language === 'es' ? 'Lote en Seguimiento' : 'Monitored Batch'}
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              disabled={batches.length === 0}
              className="w-full bg-transparent font-serif font-semibold text-sm sm:text-base text-[#1F1D1A] dark:text-[#EDE6DA] border-0 focus:ring-0 cursor-pointer p-0 disabled:opacity-50"
            >
              {batches.length === 0 ? (
                <option value="">{language === 'es' ? 'No hay lotes en esta granja' : 'No batches in this farm'}</option>
              ) : (
                batches.map((batch) => (
                  <option key={batch.id} value={batch.id} className="bg-[#FBF8F1] dark:bg-[#1F1C18] text-[#1F1D1A] dark:text-[#EDE6DA]">
                    Lote {batch.batchCode} • {batch.speciesCommonName} ({batch.status})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Tarjetas KPI de Estado Biológico Actual (Estilo Cuaderno) */}
      {selectedBatch && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Peso Promedio */}
          <div className="card-paper p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#666159] dark:text-[#9E9689] mb-1">
              <span className="text-[11px] uppercase tracking-wider font-semibold">Peso Promedio</span>
              <Scale className="w-4 h-4 text-[#2E4A36] dark:text-[#86A98F]" />
            </div>
            <div className="font-serif font-bold text-2xl text-[#1F1D1A] dark:text-[#EDE6DA] metric-number mt-1">
              {latestBiometry ? `${latestBiometry.calculatedAvgWeightG.toFixed(1)} g` : `${selectedBatch.initialAvgWeightG.toFixed(1)} g`}
            </div>
            <p className="text-[11px] text-[#666159] dark:text-[#9E9689] mt-1 font-mono">
              Inicial: {selectedBatch.initialAvgWeightG.toFixed(1)} g
            </p>
          </div>

          {/* GMD */}
          <div className="card-paper p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#666159] dark:text-[#9E9689] mb-1">
              <span className="text-[11px] uppercase tracking-wider font-semibold">GMD (Ganancia Diaria)</span>
              <TrendingUp className="w-4 h-4 text-[#3B5568] dark:text-[#8EA8BA]" />
            </div>
            <div className="font-serif font-bold text-2xl text-[#1F1D1A] dark:text-[#EDE6DA] metric-number mt-1">
              {latestBiometry?.dailyWeightGainG ? `${latestBiometry.dailyWeightGainG.toFixed(2)} g/d` : '0.00 g/d'}
            </div>
            <p className="text-[11px] text-[#666159] dark:text-[#9E9689] mt-1">
              Crecimiento promedio
            </p>
          </div>

          {/* Biomasa Estimada */}
          <div className="card-paper p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#666159] dark:text-[#9E9689] mb-1">
              <span className="text-[11px] uppercase tracking-wider font-semibold">Biomasa Estimada</span>
              <Activity className="w-4 h-4 text-[#2E4A36] dark:text-[#86A98F]" />
            </div>
            <div className="font-serif font-bold text-2xl text-[#2E4A36] dark:text-[#86A98F] metric-number mt-1">
              {latestBiometry ? `${latestBiometry.estimatedBiomassKg.toFixed(1)} kg` : `${selectedBatch.initialBiomassKg.toFixed(1)} kg`}
            </div>
            <p className="text-[11px] text-[#666159] dark:text-[#9E9689] mt-1 font-mono">
              Población: {latestBiometry?.remainingPopulation ?? selectedBatch.initialQuantity} inds
            </p>
          </div>

          {/* FCR Semáforo */}
          <div className="card-paper p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#666159] dark:text-[#9E9689] mb-1">
              <span className="text-[11px] uppercase tracking-wider font-semibold">FCR Acumulado</span>
              {latestBiometry?.fcrStatus === 'GREEN' && <span className="status-badge-green text-[10px] py-0 px-1.5">Óptimo</span>}
              {latestBiometry?.fcrStatus === 'AMBER' && <span className="status-badge-amber text-[10px] py-0 px-1.5">Alerta</span>}
              {latestBiometry?.fcrStatus === 'RED' && <span className="status-badge-red text-[10px] py-0 px-1.5">Crítico</span>}
              {!latestBiometry && <span className="notebook-stamp text-[10px] py-0 px-1.5">Sin datos</span>}
            </div>
            <div className="font-serif font-bold text-2xl text-[#1F1D1A] dark:text-[#EDE6DA] metric-number mt-1">
              {latestBiometry?.accumulatedFcr ? latestBiometry.accumulatedFcr.toFixed(2) : '—'}
            </div>
            <p className="text-[11px] text-[#666159] dark:text-[#9E9689] mt-1">
              kg alimento / kg peso vivo
            </p>
          </div>
        </section>
      )}

      {/* Historial de Muestreos en Formato Libro / Bitácora */}
      <section className="card-paper p-0 overflow-hidden">
        <div className="p-4 border-b border-[#E2D9CA] dark:border-[#332E27] flex items-center justify-between bg-[#F8F4EB] dark:bg-[#181613]">
          <h2 className="font-serif font-semibold text-base text-[#1F1D1A] dark:text-[#EDE6DA]">
            {language === 'es' ? 'Historial de Muestreos y Evolución Biológica' : 'Sampling History & Biological Growth'}
          </h2>
          <span className="text-xs font-mono text-[#666159] dark:text-[#9E9689]">
            {biometries.length} {language === 'es' ? 'actas asentadas' : 'records logged'}
          </span>
        </div>

        {biometries.length === 0 ? (
          <div className="p-8 text-center">
            <Scale className="w-10 h-10 text-[#666159] dark:text-[#9E9689] mx-auto mb-2 opacity-60" />
            <h3 className="font-serif font-semibold text-base text-[#1F1D1A] dark:text-[#EDE6DA]">
              {language === 'es' ? 'Sin biometrías registradas para este lote.' : 'No biometries logged for this batch.'}
            </h3>
            <p className="text-xs text-[#666159] dark:text-[#9E9689] max-w-sm mx-auto mt-1 mb-4">
              {language === 'es'
                ? 'Realiza el primer pesaje de muestra para comenzar el cómputo automático del FCR y la tasa de ganancia diaria.'
                : 'Perform first sample weighing to start automated FCR calculation and daily gain rate.'}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={!selectedBatchId}
              className="btn-primary text-xs h-10 px-4 inline-flex disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{t('btn_new_sampling')}</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-[#1F1D1A] dark:text-[#EDE6DA]">
              <thead className="border-b border-[#E2D9CA] dark:border-[#332E27] text-[11px] uppercase tracking-wider font-semibold text-[#666159] dark:text-[#9E9689] bg-[#F4EFE3]/50 dark:bg-[#141210]/50 font-serif">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Muestra</th>
                  <th className="px-4 py-3">Peso Promedio</th>
                  <th className="px-4 py-3">GMD</th>
                  <th className="px-4 py-3">Población Activa</th>
                  <th className="px-4 py-3">Biomasa Estimada</th>
                  <th className="px-4 py-3">FCR</th>
                  <th className="px-4 py-3">Semáforo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2D9CA] dark:divide-[#332E27]">
                {biometries.map((bio) => (
                  <tr key={bio.id} className="hover:bg-[#F4EFE3]/50 dark:hover:bg-[#181613] transition">
                    <td className="px-4 py-3 font-mono text-xs">{bio.samplingDate}</td>
                    <td className="px-4 py-3 font-mono">{bio.sampledCount} inds ({bio.totalSampleWeightG} g)</td>
                    <td className="px-4 py-3 font-bold metric-number">{bio.calculatedAvgWeightG.toFixed(1)} g</td>
                    <td className="px-4 py-3 font-mono">{bio.dailyWeightGainG ? `${bio.dailyWeightGainG.toFixed(2)} g/d` : '—'}</td>
                    <td className="px-4 py-3 font-mono">{bio.remainingPopulation?.toLocaleString() ?? '—'}</td>
                    <td className="px-4 py-3 font-bold text-[#2E4A36] dark:text-[#86A98F] metric-number">
                      {bio.estimatedBiomassKg.toFixed(1)} kg
                    </td>
                    <td className="px-4 py-3 font-mono font-bold">
                      {bio.accumulatedFcr ? bio.accumulatedFcr.toFixed(2) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {bio.fcrStatus === 'GREEN' && <span className="status-badge-green text-[10px] py-0.5">Óptimo</span>}
                      {bio.fcrStatus === 'AMBER' && <span className="status-badge-amber text-[10px] py-0.5">Alerta</span>}
                      {bio.fcrStatus === 'RED' && <span className="status-badge-red text-[10px] py-0.5">Crítico</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal: Acta de Muestreo Biométrico (HU-05) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1F1D1A]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-paper max-w-lg w-full p-6 space-y-4 shadow-xl border border-[#E2D9CA] dark:border-[#332E27] max-h-[90vh] overflow-y-auto">
            <div className="border-b border-[#E2D9CA] dark:border-[#332E27] pb-2">
              <span className="notebook-stamp text-[10px]">ACTA DE PESAJES HU-05</span>
              <h3 className="text-lg font-serif font-bold text-[#1F1D1A] dark:text-[#EDE6DA] mt-1">
                Asentar Muestreo Biométrico
              </h3>
            </div>

            <form onSubmit={handleCreateBiometry} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                    Fecha del Muestreo *
                  </label>
                  <input
                    type="date"
                    required
                    value={samplingDate}
                    onChange={(e) => setSamplingDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                    Ejemplares en Muestra (n) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={sampledCount}
                    onChange={(e) => setSampledCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                    Peso Total Muestra (g) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={totalSampleWeightG}
                    onChange={(e) => setTotalSampleWeightG(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                    Mortalidad Observada (Inds)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={observedMortality}
                    onChange={(e) => setObservedMortality(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                  />
                </div>
              </div>

              {/* Caja de Cálculo Dinámico de Peso */}
              <div className="bg-[#EDF3EE] dark:bg-[#18231C] border border-[#2E4A36]/30 rounded-[4px] p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-[#666159] dark:text-[#9E9689] block">
                    Peso Promedio Resultante
                  </span>
                  <span className="font-serif font-bold text-xl text-[#2E4A36] dark:text-[#86A98F] metric-number">
                    {calculatedAvgWeightG} g
                  </span>
                </div>
                <span className="notebook-stamp text-[10px]">CÁLCULO INMEDIATO</span>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                  Observaciones de Campo (Sanidad, natas, apetito)
                </label>
                <textarea
                  rows={2}
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="ej. Buen llenado estomacal, agallas limpias, agua con buena turbidez..."
                  className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2D9CA] dark:border-[#332E27]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary text-xs h-10 px-4"
                >
                  {t('btn_cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs h-10 px-4 disabled:opacity-50"
                >
                  {submitting ? 'Asentando...' : 'Asentar Muestreo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
