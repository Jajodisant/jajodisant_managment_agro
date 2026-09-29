import React, { useEffect, useState } from 'react';
import { Fish, Plus, AlertTriangle, ShieldAlert, CheckCircle2, Calendar, Scale, Layers } from 'lucide-react';
import { api } from '../services/api';
import { Farm, Pond, Species, Batch } from '../types';
import { useTranslation } from '../context/LanguageContext';

export const BatchesPage: React.FC = () => {
  const { t, language } = useTranslation();
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
      setFeedbackMsg(
        language === 'es'
          ? `¡Lote ${created.batchCode} registrado con éxito en la bitácora!`
          : `Batch ${created.batchCode} successfully logged in journal!`
      );
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      if (err.message && err.message.includes('sobrepoblación')) {
        setOvercrowdingError(err.message);
      } else {
        alert(err.message || 'Error al registrar la siembra');
      }
    }
  };

  const getSpeciesAvatar = (speciesName: string = '') => {
    const isFish = !speciesName.toLowerCase().includes('cerd') && !speciesName.toLowerCase().includes('porc') && !speciesName.toLowerCase().includes('pig');
    if (isFish) {
      return (
        <div className="w-10 h-10 rounded-[4px] bg-[#3B5568]/15 text-[#3B5568] dark:text-[#8EA8BA] border border-[#3B5568]/30 flex items-center justify-center shrink-0">
          <Fish className="w-5 h-5" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-[4px] bg-[#8A4B2A]/15 text-[#8A4B2A] dark:text-[#D99675] border border-[#8A4B2A]/30 flex items-center justify-center shrink-0">
        <span className="font-serif font-bold text-sm">🐖</span>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="card-paper bg-[#EDF3EE] dark:bg-[#18231C] border-[#2E4A36] text-[#2E4A36] dark:text-[#86A98F] px-4 py-3 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-semibold text-sm">{feedbackMsg}</span>
        </div>
      )}

      {/* Cabecera Estilo Cuaderno */}
      <div className="border-b border-[#E2D9CA] dark:border-[#332E27] pb-4 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="notebook-stamp">
              FOLIO #02 • LOTES & SIEMBRAS
            </span>
            <span className="text-xs text-[#666159] dark:text-[#9E9689] uppercase tracking-wider font-mono">
              NORMA HU-02
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#1F1D1A] dark:text-[#EDE6DA] font-semibold tracking-tight">
            {t('batches_title')}
          </h1>
          <p className="text-sm text-[#666159] dark:text-[#9E9689] mt-0.5 max-w-2xl">
            {t('batches_subtitle')}
          </p>
        </div>

        <button
          onClick={() => {
            setBatchCode(`LT-${Date.now().toString().slice(-4)}`);
            setShowModal(true);
          }}
          disabled={!selectedFarmId || ponds.length === 0}
          className="btn-primary text-xs sm:text-sm px-4 h-11 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>{t('btn_new_batch')}</span>
        </button>
      </div>

      {/* Selector de Granja */}
      {farms.length > 0 && (
        <div className="card-paper p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[4px] bg-[#3B5568]/10 text-[#3B5568] dark:text-[#8EA8BA] border border-[#3B5568]/20 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666159] dark:text-[#9E9689] block">
                {language === 'es' ? 'Granja de Producción' : 'Production Farm'}
              </span>
              <select
                value={selectedFarmId}
                onChange={(e) => setSelectedFarmId(e.target.value)}
                className="font-serif font-semibold text-base sm:text-lg text-[#1F1D1A] dark:text-[#EDE6DA] bg-transparent border-0 focus:ring-0 cursor-pointer p-0 w-full"
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id} className="bg-[#FBF8F1] dark:bg-[#1F1C18] text-[#1F1D1A] dark:text-[#EDE6DA]">
                    {f.name} • {f.pondsCount} estanques disponibles
                  </option>
                ))}
              </select>
            </div>
          </div>
          <span className="text-xs font-mono text-[#666159] dark:text-[#9E9689]">
            Lotes activos en granja: {batches.length}
          </span>
        </div>
      )}

      {/* Listado de Lotes */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#E2D9CA] dark:border-[#332E27] pb-2">
          <h2 className="text-lg font-serif font-semibold text-[#1F1D1A] dark:text-[#EDE6DA]">
            {language === 'es' ? 'Fichas de Lotes Sembrados' : 'Stocked Batch Records'} ({batches.length})
          </h2>
          <span className="text-xs text-[#666159] dark:text-[#9E9689] font-mono">
            {language === 'es' ? 'Control de densidad y biomasa' : 'Density & biomass tracking'}
          </span>
        </div>

        {batches.length === 0 ? (
          <div className="card-notebook p-8 text-center">
            <Fish className="w-10 h-10 text-[#666159] dark:text-[#9E9689] mx-auto mb-2 opacity-60" />
            <h3 className="font-serif font-semibold text-base text-[#1F1D1A] dark:text-[#EDE6DA]">
              {language === 'es' ? 'No hay lotes sembrados en esta granja.' : 'No batches stocked in this farm.'}
            </h3>
            <p className="text-xs text-[#666159] dark:text-[#9E9689] max-w-sm mx-auto mt-1 mb-4">
              {language === 'es'
                ? 'Registra la primera siembra de alevinos o lechones indicando la cantidad inicial y el peso promedio de entrada.'
                : 'Log your first stocking of fingerlings or piglets with initial quantity and entry average weight.'}
            </p>
            <button
              onClick={() => {
                setBatchCode(`LT-${Date.now().toString().slice(-4)}`);
                setShowModal(true);
              }}
              disabled={!selectedFarmId || ponds.length === 0}
              className="btn-primary text-xs h-10 px-4 inline-flex disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{t('btn_new_batch')}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map((b) => (
              <div
                key={b.id}
                className="card-notebook p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-3">
                      {getSpeciesAvatar(b.speciesCommonName)}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif font-bold text-lg text-[#1F1D1A] dark:text-[#EDE6DA]">
                            {b.batchCode}
                          </h3>
                        </div>
                        <span className="notebook-stamp text-[10px] py-0.5">
                          {b.speciesCommonName}
                        </span>
                      </div>
                    </div>

                    <span className="status-badge-green text-[10px] py-0.5 uppercase font-mono">
                      {b.status}
                    </span>
                  </div>

                  <p className="text-xs text-[#666159] dark:text-[#9E9689] font-medium mt-1">
                    {t('label_pond')}: <span className="font-semibold text-[#1F1D1A] dark:text-[#EDE6DA]">{b.pondCodeName || 'Sin estanque'}</span>
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#DDD4C4] dark:border-[#38342F] text-xs">
                    <div className="p-2.5 bg-[#F4EFE3]/70 dark:bg-[#141210]/60 rounded-[4px] border border-[#DDD4C4] dark:border-[#38342F]">
                      <span className="text-[10px] uppercase font-semibold text-[#666159] dark:text-[#9E9689] block">
                        Población
                      </span>
                      <span className="font-serif font-bold text-base text-[#1F1D1A] dark:text-[#EDE6DA] metric-number block">
                        {b.initialQuantity.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-[#666159] dark:text-[#9E9689]">
                        {b.initialAvgWeightG} g/individuo
                      </span>
                    </div>

                    <div className="p-2.5 bg-[#F4EFE3]/70 dark:bg-[#141210]/60 rounded-[4px] border border-[#DDD4C4] dark:border-[#38342F]">
                      <span className="text-[10px] uppercase font-semibold text-[#666159] dark:text-[#9E9689] block">
                        Biomasa Siembra
                      </span>
                      <span className="font-serif font-bold text-base text-[#2E4A36] dark:text-[#86A98F] metric-number block">
                        {b.initialBiomassKg} kg
                      </span>
                      <span className="text-[10px] text-[#666159] dark:text-[#9E9689]">
                        {b.stockingDate}
                      </span>
                    </div>
                  </div>

                  {b.overcrowdingWarning && (
                    <div className="mt-3 p-2 rounded-[4px] bg-[#A32A26]/10 border border-[#A32A26]/20 flex items-center gap-2 text-xs text-[#A32A26] dark:text-[#E5807D]">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Sobrecupo autorizado (+{b.overcrowdingPercentage}%)</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal Siembra HU-02 (Estilo Ficha de Siembra de Cuaderno) */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-[#1F1D1A]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-paper max-w-lg w-full p-6 space-y-4 shadow-xl border border-[#E2D9CA] dark:border-[#332E27] max-h-[90vh] overflow-y-auto">
            <div className="border-b border-[#E2D9CA] dark:border-[#332E27] pb-2">
              <span className="notebook-stamp text-[10px]">ACTA DE SIEMBRA HU-02</span>
              <h3 className="text-lg font-serif font-bold text-[#1F1D1A] dark:text-[#EDE6DA] mt-1">
                Registrar Siembra de Nuevo Lote
              </h3>
            </div>

            {overcrowdingError && (
              <div className="p-3 rounded-[4px] bg-[#A32A26]/10 border border-[#A32A26]/30 text-xs text-[#A32A26] dark:text-[#E5807D] space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>¡Alerta Preventiva de Sobrecupo!</span>
                </div>
                <p>{overcrowdingError}</p>
                <p className="text-[11px] opacity-80 pt-1">
                  Marca la casilla "Forzar siembra bajo criterio técnico" si cuentas con un plan de desdoble programado.
                </p>
              </div>
            )}

            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                  Código Identificador del Lote *
                </label>
                <input
                  type="text"
                  required
                  value={batchCode}
                  onChange={(e) => setBatchCode(e.target.value)}
                  placeholder="ej. LT-TIL-2026-01"
                  className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] focus:border-[#2E4A36] outline-none text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                    Especie *
                  </label>
                  <select
                    value={speciesId}
                    onChange={(e) => setSpeciesId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                  >
                    {species.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.commonName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                    Estanque Destino *
                  </label>
                  <select
                    value={pondId}
                    onChange={(e) => setPondId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                  >
                    {ponds.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.codeName} (Cap: {p.maxBiomassCapacityKg} kg)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                    Cantidad (Inds) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                    Peso Entrada (g) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={initialWeightG}
                    onChange={(e) => setInitialWeightG(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                    Fecha Siembra *
                  </label>
                  <input
                    type="date"
                    required
                    value={stockingDate}
                    onChange={(e) => setStockingDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                  />
                </div>
              </div>

              {/* Caja de Cálculo de Aforo y Sobrecupo */}
              <div className="bg-[#EDF3EE] dark:bg-[#18231C] border border-[#2E4A36]/30 rounded-[4px] p-4 space-y-2">
                <span className="notebook-stamp text-[10px]">EVALUACIÓN HU-02</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[#666159] dark:text-[#9E9689] block">Biomasa Siembra:</span>
                    <span className="font-serif font-bold text-base text-[#1F1D1A] dark:text-[#EDE6DA]">
                      {((quantity * initialWeightG) / 1000).toFixed(2)} kg
                    </span>
                  </div>
                  <div>
                    <span className="text-[#666159] dark:text-[#9E9689] block">Capacidad Estanque:</span>
                    <span className="font-serif font-bold text-base text-[#1F1D1A] dark:text-[#EDE6DA]">
                      {pondCapacityKg} kg
                    </span>
                  </div>
                </div>

                {isOvercrowded && (
                  <div className="pt-2 border-t border-[#2E4A36]/20 text-xs text-[#A32A26] dark:text-[#E5807D] font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Sobrecupo proyectado: +{overcrowdingPct}% sobre aforo máximo.</span>
                  </div>
                )}
              </div>

              {isOvercrowded && (
                <div className="flex items-center gap-3 p-3 bg-[#F4EFE3]/80 dark:bg-[#141210]/60 rounded-[4px] border border-[#DDD4C4] dark:border-[#38342F]">
                  <input
                    type="checkbox"
                    id="force"
                    checked={forceStocking}
                    onChange={(e) => setForceStocking(e.target.checked)}
                    className="w-4 h-4 text-[#2E4A36] rounded"
                  />
                  <label htmlFor="force" className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] cursor-pointer">
                    Forzar siembra bajo criterio técnico zootécnico (Plan de desdoble)
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2D9CA] dark:border-[#332E27]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary text-xs h-10 px-4"
                >
                  {t('btn_cancel')}
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs h-10 px-4"
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
