import React, { useEffect, useState } from 'react';
import { Fish, Plus, AlertTriangle, ShieldAlert, CheckCircle2, Calendar } from 'lucide-react';
import { api } from '../services/api';
import { Farm, Pond, Species, Batch } from '../types';
import { useTranslation } from '../context/LanguageContext';

export const BatchesPage: React.FC = () => {
  const { t } = useTranslation();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [species, setSpecies] = useState<Species[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Modal Siembra HU-02
  const [showModal, setShowModal] = useState<boolean>(false);
  const [batchCode, setBatchCode] = useState<string>('');
  const [pondId, setPondId] = useState<string>('');
  const [speciesId, setSpeciesId] = useState<string>('');
  const [stockingDate, setStockingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [quantity, setQuantity] = useState<number>(1500);
  const [initialWeightG, setInitialWeightG] = useState<number>(5.0);
  const [forceStocking, setForceStocking] = useState<boolean>(false);

  const [overcrowdingError, setOvercrowdingError] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedFarmId) {
      loadFarmDetails(selectedFarmId);
    }
  }, [selectedFarmId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [farmsData, speciesData] = await Promise.all([api.getFarms(), api.getSpecies()]);
      setFarms(farmsData);
      setSpecies(speciesData);
      if (speciesData.length > 0) setSpeciesId(speciesData[0].id);
      if (farmsData.length > 0) {
        setSelectedFarmId(farmsData[0].id);
      }
    } catch (err) {
      console.error('Error cargando datos iniciales:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFarmDetails = async (farmId: string) => {
    try {
      const [pondsData, batchesData] = await Promise.all([
        api.getPonds(farmId),
        api.getBatchesByFarm(farmId)
      ]);
      setPonds(pondsData);
      setBatches(batchesData);
      if (pondsData.length > 0) setPondId(pondsData[0].id);
    } catch (err) {
      console.error('Error cargando detalles de la granja:', err);
    }
  };

  // Previsualización de alerta de sobrecupo (HU-02)
  const selectedPond = ponds.find((p) => p.id === pondId);
  const projectedBiomassKg = ((quantity * 500) / 1000).toFixed(2);
  const pondCapacityKg = selectedPond ? selectedPond.maxBiomassCapacityKg : 0;
  const isOvercrowded = selectedPond && Number(projectedBiomassKg) > pondCapacityKg;
  const overcrowdingPct = isOvercrowded && pondCapacityKg > 0
    ? (((Number(projectedBiomassKg) - pondCapacityKg) / pondCapacityKg) * 100).toFixed(1)
    : '0';

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setOvercrowdingError(null);

    try {
      const created = await api.createBatch({
        farmId: selectedFarmId,
        pondId: pondId || undefined,
        speciesId,
        batchCode: batchCode.trim(),
        stockingDate,
        initialQuantity: Number(quantity),
        initialAvgWeightG: Number(initialWeightG),
        forceStocking
      });

      setBatches([created, ...batches]);
      setShowModal(false);
      setBatchCode('');
      setForceStocking(false);
      setFeedbackMsg(`¡Lote ${created.batchCode} sembrado con éxito!`);
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      if (err.message && err.message.includes('sobrepoblación')) {
        setOvercrowdingError(err.message);
      } else {
        alert(err.message || 'Error al registrar la siembra');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-semibold text-sm">{feedbackMsg}</span>
        </div>
      )}

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Fish className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            {t('batches_title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('batches_subtitle')}
          </p>
        </div>
        <button
          onClick={() => {
            setBatchCode(`LOTE-${Date.now().toString().slice(-4)}`);
            setShowModal(true);
          }}
          disabled={!selectedFarmId || ponds.length === 0}
          className="btn-field bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          {t('btn_new_batch')}
        </button>
      </div>

      {/* Selector de Granja */}
      {farms.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
          <div className="flex items-center gap-3 w-full">
            <Fish className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <select
              value={selectedFarmId}
              onChange={(e) => setSelectedFarmId(e.target.value)}
              className="font-bold text-slate-900 dark:text-white bg-transparent border-0 focus:ring-0 cursor-pointer text-base w-full"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id} className="dark:bg-slate-900 text-slate-900 dark:text-white">
                  Granja: {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Listado de Lotes */}
      <div>
        <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mb-4">
          Lotes Registrados ({batches.length})
        </h2>

        {batches.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
            <Fish className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="font-bold text-slate-700 dark:text-slate-200">No hay lotes sembrados en esta granja.</p>
            <p className="text-xs text-slate-400 mt-1">Haz clic en "Sembrar Nuevo Lote" para iniciar el ciclo productivo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {batches.map((b) => (
              <div
                key={b.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4 hover:shadow-md transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-md">
                      {b.speciesCommonName}
                    </span>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">{b.batchCode}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                      Estanque: {b.pondCodeName || 'No asignado'}
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {b.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Población Inicial</p>
                    <p className="text-base font-black text-slate-900 dark:text-white">{b.initialQuantity.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400">Peso: {b.initialAvgWeightG} g/pez</p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Biomasa Siembra</p>
                    <p className="text-base font-black text-slate-900 dark:text-white">{b.initialBiomassKg} kg</p>
                    <p className="text-[10px] text-slate-400">Fecha: {b.stockingDate}</p>
                  </div>
                </div>

                {b.overcrowdingWarning && (
                  <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-2.5 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Lote sembrado con sobrecupo autorizado (+{b.overcrowdingPercentage}%)</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Siembra HU-02 */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto transition-colors">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Siembra de Lote & Validación de Sobrecupo (HU-02)</h3>

            {overcrowdingError && (
              <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div className="text-xs text-red-800 dark:text-red-300">
                  <p className="font-bold mb-1">¡Alerta de Sobrecupo Activa!</p>
                  <p>{overcrowdingError}</p>
                  <p className="mt-2 text-slate-700 dark:text-slate-300 font-medium">
                    Marca la casilla "Forzar siembra bajo criterio técnico" a continuación si cuentas con un plan de desdoble/traslado programado.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Código de Lote *</label>
                <input
                  type="text"
                  required
                  value={batchCode}
                  onChange={(e) => setBatchCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Estanque Asignado *</label>
                  <select
                    value={pondId}
                    onChange={(e) => setPondId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm dark:text-white"
                  >
                    {ponds.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.codeName} (Cap. {p.maxBiomassCapacityKg} kg)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Especie Biológica *</label>
                  <select
                    value={speciesId}
                    onChange={(e) => setSpeciesId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm dark:text-white"
                  >
                    {species.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.commonName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Cantidad *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Peso Inicial (g) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={initialWeightG}
                    onChange={(e) => setInitialWeightG(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Fecha Siembra *</label>
                  <input
                    type="date"
                    required
                    value={stockingDate}
                    onChange={(e) => setStockingDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                  />
                </div>
              </div>

              {/* Indicador de Sobrecupo en Vivo */}
              <div
                className={`p-4 rounded-2xl border text-xs space-y-1 transition-colors ${
                  isOvercrowded
                    ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>Proyección Biomasa a Cosecha (500g):</span>
                  <span className="text-sm font-black">{projectedBiomassKg} kg</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                  <span>Capacidad Máxima Estanque:</span>
                  <span className="font-semibold">{pondCapacityKg} kg</span>
                </div>
                {isOvercrowded && (
                  <p className="pt-2 text-red-600 dark:text-red-400 font-bold border-t border-amber-200 dark:border-amber-800">
                    ⚠️ Esta siembra excederá la capacidad técnica del estanque en un +{overcrowdingPct}%.
                  </p>
                )}
              </div>

              {isOvercrowded && (
                <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-2xl">
                  <input
                    type="checkbox"
                    id="forceStocking"
                    checked={forceStocking}
                    onChange={(e) => setForceStocking(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                  />
                  <label htmlFor="forceStocking" className="text-xs font-bold text-red-800 dark:text-red-300 cursor-pointer">
                    Forzar siembra bajo criterio técnico (requiere desdoble posterior)
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  {t('btn_cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-sm"
                >
                  Confirmar Siembra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
