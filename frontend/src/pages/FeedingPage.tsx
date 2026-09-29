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

export const FeedingPage: React.FC = () => {
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

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
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
    const count = await getPendingFeedingsCount();
    setPendingCount(count);
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
      setErrorMessage(err.message || 'Error al obtener datos de alimentación');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    if (!navigator.onLine) {
      setErrorMessage('No hay conexión a internet para sincronizar.');
      return;
    }
    try {
      setIsSyncing(true);
      setErrorMessage(null);
      const result = await syncPendingFeedings();
      await updatePendingCount();
      if (selectedBatchId) {
        await loadBatchFeedingData(selectedBatchId);
      }
      setSuccessMessage(`Sincronización completada: ${result.success} raciones subidas al servidor.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Fallo durante la sincronización');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId) return;

    if (suppliedQuantityKg <= 0 || costPerKg < 0) {
      setErrorMessage('La cantidad suministrada y el costo por kg deben ser válidos.');
      return;
    }

    const payload = {
      feedingDate,
      rationNumber,
      feedingTime,
      feedBrandType,
      suppliedQuantityKg,
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
        setSuccessMessage('📱 Guardado OFFLINE con éxito en dispositivo. Se sincronizará automáticamente al volver internet.');
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
      setSuccessMessage('Ración registrada en el servidor con éxito.');
      setIsModalOpen(false);
      resetForm();
      await loadBatchFeedingData(selectedBatchId);
    } catch (err: any) {
      // Fallback a almacenamiento offline si la llamada de red falla
      try {
        await saveFeedingOffline({
          batchId: selectedBatchId,
          ...payload
        });
        await updatePendingCount();
        setSuccessMessage('Falla de red detectada: Se respaldó la ración en almacenamiento local offline.');
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
    setRationNumber(prev => prev + 1);
    setFeedingTime(new Date().toTimeString().slice(0, 5));
    if (feedingPlan) {
      setSuppliedQuantityKg(Number(feedingPlan.rationQuotaKg.toFixed(2)));
    }
  };

  const selectedBatch = batches.find(b => b.id === selectedBatchId);
  const totalKgSuppliedToday = feedingHistory
    .filter(r => r.feedingDate === new Date().toISOString().split('T')[0])
    .reduce((sum, r) => sum + r.suppliedQuantityKg, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Utensils className="w-8 h-8 text-emerald-600" />
            Alimentación en Campo (Offline-First)
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            HU-03 & HU-04: Tabla nutricional, cuota sugerida según biomasa y registro rápido de raciones con sincronización automática.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <button
              onClick={handleManualSync}
              disabled={!isOnline || isSyncing}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-2.5 rounded-xl shadow-sm transition disabled:opacity-50 text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              Sincronizar ({pendingCount})
            </button>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            disabled={!selectedBatchId}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition disabled:opacity-50 text-sm"
          >
            <Plus className="w-4 h-4" />
            Alimentar (1-Touch)
          </button>
        </div>
      </div>

      {/* Selectores de Granja y Lote */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <Layers className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Seleccionar Granja
            </label>
            <select
              value={selectedFarmId}
              onChange={(e) => setSelectedFarmId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {farms.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <Utensils className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Lote Objetivo
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              disabled={batches.length === 0}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
            >
              {batches.length === 0 ? (
                <option value="">No hay lotes en esta granja</option>
              ) : (
                batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    Lote {batch.batchCode} - {batch.speciesCommonName}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Estado de Red e IndexedDB */}
      <div className="flex items-center justify-between p-3 mb-6 rounded-xl bg-slate-100 border border-slate-200 text-xs">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <span className="flex items-center gap-1.5 font-bold text-emerald-700">
              <Wifi className="w-4 h-4" /> Conexión Activa (En Línea)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 font-bold text-amber-700">
              <WifiOff className="w-4 h-4" /> Modo Offline Activado (Los datos se guardan en IndexedDB local)
            </span>
          )}
        </div>
        <div className="font-semibold text-slate-600">
          Raciones pendientes de sync: <span className="font-bold text-slate-900">{pendingCount}</span>
        </div>
      </div>

      {/* Alertas */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
          <div>{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
          <div>{successMessage}</div>
        </div>
      )}

      {/* HU-03: Plan Diario Calculado según Biomasa */}
      {feedingPlan && (
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-6 sm:p-8 mb-8 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/20">
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/20 text-white">
                HU-03 • Plan Nutricional Calculado
              </span>
              <h2 className="text-2xl font-black mt-2">
                Lote {feedingPlan.batchCode} — {feedingPlan.speciesCommonName}
              </h2>
              <p className="text-emerald-100 text-xs mt-1">
                Biomasa activa: <span className="font-bold">{feedingPlan.currentBiomassKg.toFixed(1)} kg</span> | Peso Promedio: <span className="font-bold">{feedingPlan.currentAvgWeightG.toFixed(1)} g</span>
              </p>
            </div>

            <div className="text-left md:text-right">
              <div className="text-3xl font-black">{feedingPlan.totalDailyQuotaKg.toFixed(2)} kg</div>
              <div className="text-xs text-emerald-200 uppercase tracking-wider font-semibold">
                Cuota Diaria Recomendada ({feedingPlan.recommendedBiomassPercentage.toFixed(1)}% Biomasa)
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <span className="text-xs text-emerald-200 uppercase font-bold block">Por Ración</span>
              <span className="text-2xl font-black">{feedingPlan.rationQuotaKg.toFixed(2)} kg</span>
              <span className="text-xs text-emerald-200 block mt-1">{feedingPlan.dailyFrequency} raciones / día</span>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <span className="text-xs text-emerald-200 uppercase font-bold block">Proteína Sugerida</span>
              <span className="text-2xl font-black">{feedingPlan.suggestedProteinPct}%</span>
              <span className="text-xs text-emerald-200 block mt-1">Nivel óptimo especie</span>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 col-span-2">
              <span className="text-xs text-emerald-200 uppercase font-bold block mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Horarios Recomendados
              </span>
              <div className="flex flex-wrap gap-2">
                {feedingPlan.suggestedHours && feedingPlan.suggestedHours.map((hour, idx) => (
                  <span key={idx} className="bg-white text-emerald-900 px-3 py-1 rounded-xl text-xs font-extrabold shadow-sm">
                    {hour}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historial de Raciones Suministradas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-slate-900">Raciones Registradas</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              Hoy: {totalKgSuppliedToday.toFixed(2)} kg suministrados
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-500">{feedingHistory.length} raciones</span>
        </div>

        {feedingHistory.length === 0 ? (
          <div className="p-12 text-center">
            <Utensils className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-slate-800 font-bold text-base mb-1">Sin raciones registradas</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mb-4">
              Usa el botón "Alimentar (1-Touch)" para registrar las entregas de concentrado del día. Funciona con o sin señal.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={!selectedBatchId}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2 rounded-xl shadow-sm transition disabled:opacity-50"
            >
              Registrar Primera Ración
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Fecha & Hora</th>
                  <th className="px-4 py-3">Ración #</th>
                  <th className="px-4 py-3">Concentrado / Tipo</th>
                  <th className="px-4 py-3">Cantidad</th>
                  <th className="px-4 py-3">Costo / kg</th>
                  <th className="px-4 py-3">Costo Total</th>
                  <th className="px-4 py-3">Temp. Agua</th>
                  <th className="px-4 py-3">Oxígeno</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {feedingHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                      {item.feedingDate} • <span className="text-emerald-700">{item.feedingTime}</span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-bold text-slate-800">
                      Ración {item.rationNumber}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-700">
                      {item.feedBrandType}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-black text-emerald-700">
                      {item.suppliedQuantityKg.toFixed(2)} kg
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                      ${item.costPerKg.toLocaleString('es-CO')}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-bold text-slate-900">
                      ${item.totalRationCost.toLocaleString('es-CO')}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                      {item.waterTemperatureC ? `${item.waterTemperatureC} °C` : '-'}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                      {item.dissolvedOxygenMgL ? `${item.dissolvedOxygenMgL} mg/L` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Registro Rápido (1-Touch) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-emerald-600" />
                  Alimentación de Campo (1-Touch)
                </h3>
                <p className="text-xs text-slate-500">
                  {isOnline ? 'Registro directo al servidor' : 'Registro local seguro (IndexedDB Offline)'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fecha
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="date"
                      required
                      value={feedingDate}
                      onChange={(e) => setFeedingDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hora
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="time"
                      required
                      value={feedingTime}
                      onChange={(e) => setFeedingTime(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ración Número
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={rationNumber}
                    onChange={(e) => setRationNumber(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cantidad (kg)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    required
                    value={suppliedQuantityKg}
                    onChange={(e) => setSuppliedQuantityKg(Math.max(0.01, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tipo / Marca de Alimento
                </label>
                <div className="relative">
                  <Package className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={feedBrandType}
                    onChange={(e) => setFeedBrandType(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="ej. Tilapia Extrusado 38%"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Costo por Kg (COP)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="number"
                    step="50"
                    min="0"
                    required
                    value={costPerKg}
                    onChange={(e) => setCostPerKg(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="4500"
                  />
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                  <span>Costo total ración:</span>
                  <span className="font-bold text-slate-800">
                    ${(suppliedQuantityKg * costPerKg).toLocaleString('es-CO')} COP
                  </span>
                </div>
              </div>

              {/* Parámetros físico-químicos opcionales */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-600 block mb-2">
                  Parámetros de Calidad de Agua (Opcional)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                      Temperatura (°C)
                    </label>
                    <div className="relative">
                      <Thermometer className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="number"
                        step="0.1"
                        value={waterTemperatureC}
                        onChange={(e) => setWaterTemperatureC(e.target.value)}
                        className="w-full pl-8 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        placeholder="26.0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                      Oxígeno Disuelto (mg/L)
                    </label>
                    <div className="relative">
                      <Droplets className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="number"
                        step="0.1"
                        value={dissolvedOxygenMgL}
                        onChange={(e) => setDissolvedOxygenMgL(e.target.value)}
                        className="w-full pl-8 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        placeholder="5.5"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : isOnline ? 'Registrar Ración' : 'Guardar en Dispositivo (Offline)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
