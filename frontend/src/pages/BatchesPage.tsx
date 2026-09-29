import React, { useEffect, useState } from 'react';
import { Fish, Plus, AlertTriangle, ShieldAlert, CheckCircle2, Calendar } from 'lucide-react';
import { api } from '../services/api';
import { Farm, Pond, Species, Batch } from '../types';

export const BatchesPage: React.FC = () => {
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
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-semibold text-sm">{feedbackMsg}</span>
        </div>
      )}

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Lotes y Siembras (HU-02)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Control de siembras, prevención preventiva de hacinamiento y seguimiento de etapas biológicas.
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
          Sembrar Nuevo Lote
        </button>
      </div>

      {/* Selector de Granja */}
      {farms.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Fish className="w-5 h-5 text-emerald-600" />
            <select
              value={selectedFarmId}
              onChange={(e) => setSelectedFarmId(e.target.value)}
              className="font-bold text-slate-900 bg-transparent border-0 focus:ring-0 cursor-pointer text-base"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {batches.length} Lotes Registrados
          </span>
        </div>
      )}

      {/* Listado de Lotes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {batches.map((b) => (
          <div
            key={b.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
                  {b.speciesCommonName}
                </span>
                <h3 className="text-xl font-black text-slate-900">{b.batchCode}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Estanque: {b.pondCodeName || 'Sin asignar'}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800">
                {b.status}
              </span>
            </div>

            {b.overcrowdingWarning && (
              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-center gap-2 text-amber-800 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Sobrecupo autorizado (+{b.overcrowdingPercentage}%)</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <span className="text-slate-500 block font-medium">Población Sembrada</span>
                <span className="text-base font-black text-slate-900">
                  {b.initialQuantity.toLocaleString()} peces
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <span className="text-slate-500 block font-medium">Biomasa Inicial</span>
                <span className="text-base font-black text-slate-900">{b.initialBiomassKg} kg</span>
                <span className="text-[10px] text-slate-400">({b.initialAvgWeightG} g/pez)</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>Siembra: {b.stockingDate}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Siembra con Alerta de Aforo HU-02 */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900">Registrar Siembra de Lote (HU-02)</h3>

            {overcrowdingError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Alerta Preventiva de Sobrepoblación (HU-02)</span>
                </div>
                <p>{overcrowdingError}</p>
              </div>
            )}

            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Código del Lote *</label>
                  <input
                    type="text"
                    required
                    value={batchCode}
                    onChange={(e) => setBatchCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Especie *</label>
                  <select
                    value={speciesId}
                    onChange={(e) => setSpeciesId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white"
                  >
                    {species.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.commonName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Estanque Asignado *</label>
                <select
                  value={pondId}
                  onChange={(e) => setPondId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white"
                >
                  {ponds.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.codeName} (Capacidad: {p.maxBiomassCapacityKg} kg - {p.volumeM3} m³)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Cantidad Peces *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Peso Inicial (g) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={initialWeightG}
                    onChange={(e) => setInitialWeightG(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Fecha Siembra</label>
                  <input
                    type="date"
                    required
                    value={stockingDate}
                    onChange={(e) => setStockingDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  />
                </div>
              </div>

              {/* Indicador de Sobrecupo en Tiempo Real (HU-02) */}
              <div
                className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                  isOvercrowded
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>Proyección a Cosecha (500g):</span>
                  <span>{projectedBiomassKg} kg proyectados</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>Capacidad Técnica Máxima:</span>
                  <span className="font-semibold">{pondCapacityKg} kg</span>
                </div>

                {isOvercrowded && (
                  <div className="pt-2 border-t border-amber-200">
                    <p className="font-bold text-amber-800">
                      ⚠️ Sobrecupo estimado: +{overcrowdingPct}% sobre la capacidad técnica.
                    </p>
                    <label className="flex items-start gap-2 mt-2 cursor-pointer font-bold text-amber-900">
                      <input
                        type="checkbox"
                        checked={forceStocking}
                        onChange={(e) => setForceStocking(e.target.checked)}
                        className="mt-0.5 w-4 h-4 text-emerald-600 rounded"
                      />
                      <span>
                        Confirmar conscientemente la siembra con plan de desdoble/traslado registrado (forceStocking).
                      </span>
                    </label>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
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
