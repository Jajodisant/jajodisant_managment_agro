import React, { useEffect, useState } from 'react';
import {
  Utensils,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  WifiOff,
  Wifi,
  Layers,
  Thermometer,
  Droplets,
  DollarSign,
  Package,
  Calendar
} from 'lucide-react';
import { api } from '../services/api';
import { Farm, Batch, DailyFeedingPlan, FeedingRecord } from '../types';
import { saveFeedingOffline, getPendingFeedingsCount, syncPendingFeedings } from '../services/offlineSync';
import { useTranslation } from '../context/LanguageContext';

export const FeedingPage: React.FC = () => {
  const { t, language } = useTranslation();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [feedingPlan, setFeedingPlan] = useState<DailyFeedingPlan | null>(null);
  const [feedingHistory, setFeedingHistory] = useState<FeedingRecord[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Formulario de Alimentación
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [feedingDate, setFeedingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [rationNumber, setRationNumber] = useState<number>(1);
  const [feedingTime, setFeedingTime] = useState<string>(
    new Date().toTimeString().slice(0, 5)
  );
  const [feedBrandType, setFeedBrandType] = useState<string>('Extrusado 38% Proteína');
  const [suppliedQuantityKg, setSuppliedQuantityKg] = useState<number>(5.0);
  const [costPerKg, setCostPerKg] = useState<number>(4500);
  const [waterTemperatureC, setWaterTemperatureC] = useState<string>('26.5');
  const [dissolvedOxygenMgL, setDissolvedOxygenMgL] = useState<string>('5.8');

  useEffect(() => {
    loadFarms();

    const handleOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 2500);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(interval);
    };
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
      loadBatchFeedingData(selectedBatchId);
    } else {
      setFeedingPlan(null);
      setFeedingHistory([]);
    }
  }, [selectedBatchId]);

  const updatePendingCount = async () => {
    try {
      const count = await getPendingFeedingsCount();
      setPendingCount(count);
    } catch (err) {
      console.error('Error al consultar registros pendientes:', err);
    }
  };

  const loadFarms = async () => {
    try {
      setLoading(true);
      const data = await api.getFarms();
      setFarms(data);
      if (data.length > 0) {
        setSelectedFarmId(data[0].id);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al cargar granjas');
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

  const loadBatchFeedingData = async (batchId: string) => {
    try {
      setLoading(true);
      const [plan, history] = await Promise.all([
        api.getDailyFeedingPlan(batchId).catch(() => null),
        api.getFeedingHistory(batchId).catch(() => [])
      ]);
      setFeedingPlan(plan);
      setFeedingHistory(history);
      if (plan) {
        setSuppliedQuantityKg(Number(plan.rationQuotaKg.toFixed(2)));
        if (plan.suggestedProteinPct) {
          setFeedBrandType(`Extrusado ${plan.suggestedProteinPct}% Proteína`);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al cargar datos nutricionales');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    if (!navigator.onLine) {
      setErrorMessage('Sin conexión a internet. No es posible sincronizar.');
      return;
    }
    try {
      setIsSyncing(true);
      setErrorMessage(null);
      const syncedCount = await syncPendingFeedings();
      await updatePendingCount();
      setSuccessMessage(
        language === 'es'
          ? `¡Sincronización completada! ${syncedCount} raciones guardadas en el servidor.`
          : `Sync complete! ${syncedCount} feed rations uploaded to server.`
      );
      if (selectedBatchId) {
        await loadBatchFeedingData(selectedBatchId);
      }
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error durante la sincronización');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRecordFeeding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId) return;

    const payload = {
      feedingDate,
      rationNumber: Number(rationNumber),
      feedingTime,
      feedBrandType,
      suppliedQuantityKg: Number(suppliedQuantityKg),
      costPerKg,
      waterTemperatureC: waterTemperatureC ? parseFloat(waterTemperatureC) : undefined,
      dissolvedOxygenMgL: dissolvedOxygenMgL ? parseFloat(dissolvedOxygenMgL) : undefined
    };

    setSubmitting(true);
    setErrorMessage(null);

    // MODO OFFLINE FIRST
    if (!navigator.onLine) {
      try {
        await saveFeedingOffline({
          batchId: selectedBatchId,
          ...payload
        });
        await updatePendingCount();
        setSuccessMessage(
          language === 'es'
            ? '📱 Ración asentada OFFLINE en dispositivo. Se sincronizará automáticamente al volver internet.'
            : '📱 Ration recorded OFFLINE on device. It will auto-sync when internet is restored.'
        );
        setIsModalOpen(false);
        resetForm();
      } catch (err: any) {
        setErrorMessage('Error al guardar localmente: ' + err.message);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // MODO ONLINE
    try {
      await api.recordFeeding(selectedBatchId, payload);
      setSuccessMessage(
        language === 'es'
          ? 'Ración asentada en el servidor y en la bitácora con éxito.'
          : 'Feed ration recorded on server and logbook successfully.'
      );
      setIsModalOpen(false);
      resetForm();
      await loadBatchFeedingData(selectedBatchId);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      try {
        await saveFeedingOffline({
          batchId: selectedBatchId,
          ...payload
        });
        await updatePendingCount();
        setSuccessMessage(
          language === 'es'
            ? 'Respaldo offline: Ración asegurada en el dispositivo ante corte de señal.'
            : 'Offline fallback: Ration secured in local device storage.'
        );
        setIsModalOpen(false);
        resetForm();
      } catch (dbErr: any) {
        setErrorMessage(err.message || 'Error al registrar la ración');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFeedingDate(new Date().toISOString().split('T')[0]);
    setRationNumber((prev) => prev + 1);
    setFeedingTime(new Date().toTimeString().slice(0, 5));
    if (feedingPlan) {
      setSuppliedQuantityKg(Number(feedingPlan.rationQuotaKg.toFixed(2)));
    }
  };

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);
  const totalKgSuppliedToday = feedingHistory
    .filter((r) => r.feedingDate === new Date().toISOString().split('T')[0])
    .reduce((sum, r) => sum + r.suppliedQuantityKg, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Feedback */}
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
              FOLIO #03 • ALIMENTACIÓN OFFLINE-FIRST
            </span>
            <span className="text-xs text-[#666159] dark:text-[#9E9689] uppercase tracking-wider font-mono">
              NORMAS HU-03 & HU-04
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#1F1D1A] dark:text-[#EDE6DA] font-semibold tracking-tight">
            {t('feeding_title')}
          </h1>
          <p className="text-sm text-[#666159] dark:text-[#9E9689] mt-0.5 max-w-2xl">
            {t('feeding_subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {pendingCount > 0 && (
            <button
              onClick={handleManualSync}
              disabled={!isOnline || isSyncing}
              className="btn-secondary text-xs sm:text-sm px-3.5 h-11"
              title="Sincronizar raciones"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{t('btn_sync')} ({pendingCount})</span>
            </button>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            disabled={!selectedBatchId}
            className="btn-primary text-xs sm:text-sm px-4 h-11 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>{t('btn_feed_touch')}</span>
          </button>
        </div>
      </div>

      {/* Selectores de Granja y Lote */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card-paper p-4 flex items-center gap-3">
          <Layers className="w-5 h-5 text-[#2E4A36] dark:text-[#86A98F] shrink-0" />
          <div className="flex-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#666159] dark:text-[#9E9689] block mb-1">
              {language === 'es' ? 'Granja Seleccionada' : 'Selected Farm'}
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
          <Utensils className="w-5 h-5 text-[#2E4A36] dark:text-[#86A98F] shrink-0" />
          <div className="flex-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#666159] dark:text-[#9E9689] block mb-1">
              {language === 'es' ? 'Lote de Alimentación' : 'Feeding Batch'}
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
                    Lote {batch.batchCode} • {batch.speciesCommonName}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Barra Discreta de Conectividad de Campo */}
      <div className="card-paper py-2.5 px-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isOnline ? 'bg-[#2A6B3D]' : 'bg-[#9C631B] animate-pulse'
            }`}
          />
          <span className="font-semibold text-[#1F1D1A] dark:text-[#EDE6DA]">
            {isOnline ? t('status_online') : `${t('status_offline')} (IndexedDB Local)`}
          </span>
        </div>
        <span className="text-[#666159] dark:text-[#9E9689] font-mono">
          Raciones locales pendientes: <strong className="text-[#1F1D1A] dark:text-[#EDE6DA]">{pendingCount}</strong>
        </span>
      </div>

      {/* HU-03: Plan Diario Calculado según Biomasa (Estilo Cuaderno) */}
      {feedingPlan && (
        <section className="card-notebook-forest p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-3 border-b border-[#E2D9CA] dark:border-[#332E27] pb-3">
            <div>
              <span className="notebook-stamp text-[10px]">PLAN NUTRICIONAL HU-03</span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1F1D1A] dark:text-[#EDE6DA] mt-1">
                Lote {feedingPlan.batchCode} — {feedingPlan.speciesCommonName}
              </h2>
              <p className="text-xs text-[#666159] dark:text-[#9E9689] mt-0.5 font-mono">
                Biomasa activa: <strong className="text-[#1F1D1A] dark:text-[#EDE6DA]">{feedingPlan.currentBiomassKg.toFixed(1)} kg</strong> | Peso Promedio: <strong className="text-[#1F1D1A] dark:text-[#EDE6DA]">{feedingPlan.currentAvgWeightG.toFixed(1)} g</strong>
              </p>
            </div>

            <div className="text-left md:text-right">
              <span className="font-serif font-bold text-2xl sm:text-3xl text-[#2E4A36] dark:text-[#86A98F] metric-number block">
                {feedingPlan.totalDailyQuotaKg.toFixed(2)} kg
              </span>
              <span className="text-[11px] text-[#666159] dark:text-[#9E9689] font-mono uppercase">
                {t('feed_plan_quota')} ({feedingPlan.recommendedBiomassPercentage.toFixed(1)}% Biomasa)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-[#F4EFE3]/70 dark:bg-[#141210]/60 rounded-[4px] border border-[#DDD4C4] dark:border-[#38342F]">
              <span className="text-[10px] uppercase font-semibold text-[#666159] dark:text-[#9E9689] block">Por Ración</span>
              <span className="font-serif font-bold text-xl text-[#1F1D1A] dark:text-[#EDE6DA] metric-number block">
                {feedingPlan.rationQuotaKg.toFixed(2)} kg
              </span>
              <span className="text-[10px] text-[#666159] dark:text-[#9E9689] block mt-0.5">
                {feedingPlan.dailyFrequency} raciones / día
              </span>
            </div>

            <div className="p-3 bg-[#F4EFE3]/70 dark:bg-[#141210]/60 rounded-[4px] border border-[#DDD4C4] dark:border-[#38342F]">
              <span className="text-[10px] uppercase font-semibold text-[#666159] dark:text-[#9E9689] block">Proteína Requerida</span>
              <span className="font-serif font-bold text-xl text-[#1F1D1A] dark:text-[#EDE6DA] metric-number block">
                {feedingPlan.suggestedProteinPct}%
              </span>
              <span className="text-[10px] text-[#666159] dark:text-[#9E9689] block mt-0.5">
                Nivel óptimo especie
              </span>
            </div>

            <div className="p-3 bg-[#F4EFE3]/70 dark:bg-[#141210]/60 rounded-[4px] border border-[#DDD4C4] dark:border-[#38342F] col-span-2">
              <span className="text-[10px] uppercase font-semibold text-[#666159] dark:text-[#9E9689] block mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#2E4A36] dark:text-[#86A98F]" />
                <span>{t('suggested_hours')}</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {feedingPlan.suggestedHours && feedingPlan.suggestedHours.map((hour, idx) => (
                  <span key={idx} className="notebook-stamp font-mono text-xs">
                    {hour}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Historial de Raciones en Formato Libro */}
      <section className="card-paper p-0 overflow-hidden">
        <div className="p-4 border-b border-[#E2D9CA] dark:border-[#332E27] flex items-center justify-between bg-[#F8F4EB] dark:bg-[#181613]">
          <div className="flex items-center gap-3">
            <h2 className="font-serif font-semibold text-base text-[#1F1D1A] dark:text-[#EDE6DA]">
              {language === 'es' ? 'Raciones Suministradas en Bitácora' : 'Rations Logged in Journal'}
            </h2>
            <span className="notebook-stamp text-[10px] py-0.5">
              Hoy: {totalKgSuppliedToday.toFixed(2)} kg
            </span>
          </div>
          <span className="text-xs font-mono text-[#666159] dark:text-[#9E9689]">
            {feedingHistory.length} entregas
          </span>
        </div>

        {feedingHistory.length === 0 ? (
          <div className="p-8 text-center">
            <Utensils className="w-10 h-10 text-[#666159] dark:text-[#9E9689] mx-auto mb-2 opacity-60" />
            <h3 className="font-serif font-semibold text-base text-[#1F1D1A] dark:text-[#EDE6DA]">
              {language === 'es' ? 'Sin raciones registradas para este lote.' : 'No rations recorded for this batch.'}
            </h3>
            <p className="text-xs text-[#666159] dark:text-[#9E9689] max-w-sm mx-auto mt-1 mb-4">
              {language === 'es'
                ? 'Usa el botón "Alimentar (1-Toque)" para registrar las entregas en campo sin depender de conexión a internet.'
                : 'Use "Feed (1-Touch)" to log field rations without depending on internet connection.'}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={!selectedBatchId}
              className="btn-primary text-xs h-10 px-4 inline-flex disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Primera Ración</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-[#1F1D1A] dark:text-[#EDE6DA]">
              <thead className="border-b border-[#E2D9CA] dark:border-[#332E27] text-[11px] uppercase tracking-wider font-semibold text-[#666159] dark:text-[#9E9689] bg-[#F4EFE3]/50 dark:bg-[#141210]/50 font-serif">
                <tr>
                  <th className="px-4 py-3">Fecha & Hora</th>
                  <th className="px-4 py-3">Turno</th>
                  <th className="px-4 py-3">Alimento Suministrado</th>
                  <th className="px-4 py-3">Cantidad</th>
                  <th className="px-4 py-3">Costo Ración</th>
                  <th className="px-4 py-3">Parámetros Agua</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2D9CA] dark:divide-[#332E27]">
                {feedingHistory.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#F4EFE3]/50 dark:hover:bg-[#181613] transition">
                    <td className="px-4 py-3 font-mono text-xs">
                      {rec.feedingDate} • {rec.feedingTime}
                    </td>
                    <td className="px-4 py-3 font-mono">Ración #{rec.rationNumber}</td>
                    <td className="px-4 py-3">{rec.feedBrandType}</td>
                    <td className="px-4 py-3 font-bold text-[#2E4A36] dark:text-[#86A98F] metric-number">
                      {rec.suppliedQuantityKg.toFixed(2)} kg
                    </td>
                    <td className="px-4 py-3 font-mono">
                      ${rec.totalRationCost ? rec.totalRationCost.toLocaleString() : (rec.suppliedQuantityKg * (rec.costPerKg || 4500)).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#666159] dark:text-[#9E9689] font-mono">
                      {rec.waterTemperatureC ? `${rec.waterTemperatureC}°C` : '—'} | {rec.dissolvedOxygenMgL ? `${rec.dissolvedOxygenMgL} mg/L` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal: Registro Rápido 1-Toque (HU-04) */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
          className="fixed inset-0 z-50 bg-[#1F1D1A]/50 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="card-paper max-w-lg w-full p-6 space-y-4 shadow-xl border border-[#E2D9CA] dark:border-[#332E27] max-h-[90vh] overflow-y-auto cursor-default">
            <div className="border-b border-[#E2D9CA] dark:border-[#332E27] pb-2">
              <span className="notebook-stamp text-[10px]">RACIÓN EN CAMPO HU-04</span>
              <h3 className="text-lg font-serif font-bold text-[#1F1D1A] dark:text-[#EDE6DA] mt-1">
                Asentar Ración de Concentrado
              </h3>
            </div>

            <form onSubmit={handleRecordFeeding} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                    Cantidad Suministrada (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    required
                    value={suppliedQuantityKg}
                    onChange={(e) => setSuppliedQuantityKg(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] text-base font-bold text-[#2E4A36] dark:text-[#86A98F]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                    Turno / Número de Ración *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={rationNumber}
                    onChange={(e) => setRationNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={feedingDate}
                    onChange={(e) => setFeedingDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                    Hora Suministro *
                  </label>
                  <input
                    type="time"
                    required
                    value={feedingTime}
                    onChange={(e) => setFeedingTime(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                  Tipo / Marca del Concentrado
                </label>
                <input
                  type="text"
                  required
                  value={feedBrandType}
                  onChange={(e) => setFeedBrandType(e.target.value)}
                  placeholder="ej. Extrusado 38% Proteína Iniciación"
                  className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                    Costo / kg (COP)
                  </label>
                  <input
                    type="number"
                    step="50"
                    value={costPerKg}
                    onChange={(e) => setCostPerKg(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                    Temp. Agua (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={waterTemperatureC}
                    onChange={(e) => setWaterTemperatureC(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                    Oxígeno (mg/L)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={dissolvedOxygenMgL}
                    onChange={(e) => setDissolvedOxygenMgL(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                  />
                </div>
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
                  {submitting ? 'Asentando...' : 'Asentar Ración'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
