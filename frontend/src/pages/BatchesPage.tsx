import React, { useEffect, useState } from 'react';
import { Fish, Plus, AlertTriangle, ShieldAlert, CheckCircle2, Calendar, Scale, Layers, Home } from 'lucide-react';
import { api } from '../services/api';
import { Farm, Pond, Species, Batch, SwineBarn, SwinePen } from '../types';
import { useTranslation } from '../context/LanguageContext';

export const BatchesPage: React.FC = () => {
  const { t, language } = useTranslation();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [barns, setBarns] = useState<SwineBarn[]>([]);
  const [pens, setPens] = useState<SwinePen[]>([]);
  const [species, setSpecies] = useState<Species[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Filtro de visualización: Todos, Piscicultura, Porcicultura
  const [filterType, setFilterType] = useState<'all' | 'fish' | 'swine'>('all');

  // Modal Siembra HU-02 & HU-11
  const [showModal, setShowModal] = useState<boolean>(false);
  const [productionType, setProductionType] = useState<'fish' | 'swine'>('fish');
  const [batchCode, setBatchCode] = useState<string>('');
  const [pondId, setPondId] = useState<string>('');
  const [penId, setPenId] = useState<string>('');
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
      const [pondsData, batchesData, barnsData] = await Promise.all([
        api.getPonds(farmId),
        api.getBatchesByFarm(farmId),
        api.getSwineBarns(farmId)
      ]);
      setPonds(pondsData);
      setBatches(batchesData);
      setBarns(barnsData);
      if (pondsData.length > 0) setPondId(pondsData[0].id);

      // Cargar corrales de todos los galpones
      const penLists = await Promise.all(
        barnsData.map((b) => api.getSwinePens(b.id).catch(() => [] as SwinePen[]))
      );
      const allPens = penLists.flat();
      setPens(allPens);
      if (allPens.length > 0) setPenId(allPens[0].id);
    } catch (err) {
      console.error('Error cargando detalles de la granja:', err);
    }
  };

  // Cambio de tipo de producción (Peces vs Cerdos)
  const handleTypeChange = (type: 'fish' | 'swine') => {
    setProductionType(type);
    setOvercrowdingError(null);
    if (type === 'swine') {
      const swineSp = species.find(s => s.commonName.toLowerCase().includes('cerd') || s.commonName.toLowerCase().includes('porc') || s.commonName.toLowerCase().includes('pig'));
      if (swineSp) setSpeciesId(swineSp.id);
      setQuantity(20);
      setInitialWeightG(25000); // 25 kg
      if (pens.length > 0) setPenId(pens[0].id);
    } else {
      const fishSp = species.find(s => !s.commonName.toLowerCase().includes('cerd') && !s.commonName.toLowerCase().includes('porc') && !s.commonName.toLowerCase().includes('pig'));
      if (fishSp) setSpeciesId(fishSp.id);
      setQuantity(1500);
      setInitialWeightG(5.0); // 5g alevino
      if (ponds.length > 0) setPondId(ponds[0].id);
    }
  };

  // Previsualización de alerta de sobrecupo (HU-02 peces & HU-10/11 cerdos)
  const selectedPond = ponds.find((p) => p.id === pondId);
  const selectedPen = pens.find((p) => p.id === penId);

  const projectedBiomassKg = ((quantity * (productionType === 'swine' ? 110000 : 500)) / 1000).toFixed(2);
  const pondCapacityKg = selectedPond ? selectedPond.maxBiomassCapacityKg : 0;
  const penCapacityPigs = selectedPen ? selectedPen.maxCapacityPigs : 0;

  const isFishOvercrowded = productionType === 'fish' && selectedPond && Number(projectedBiomassKg) > pondCapacityKg;
  const isSwineOvercrowded = productionType === 'swine' && selectedPen && quantity > penCapacityPigs;
  const isOvercrowded = isFishOvercrowded || isSwineOvercrowded;

  const overcrowdingPct = isFishOvercrowded && pondCapacityKg > 0
    ? (((Number(projectedBiomassKg) - pondCapacityKg) / pondCapacityKg) * 100).toFixed(1)
    : isSwineOvercrowded && penCapacityPigs > 0
    ? (((quantity - penCapacityPigs) / penCapacityPigs) * 100).toFixed(1)
    : '0';

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setOvercrowdingError(null);

    try {
      const created = await api.createBatch({
        farmId: selectedFarmId,
        pondId: productionType === 'fish' ? (pondId || undefined) : undefined,
        penId: productionType === 'swine' ? (penId || undefined) : undefined,
        speciesId,
        batchCode: batchCode.trim(),
        stockingDate,
        initialQuantity: Number(quantity),
        initialAvgWeightG: Number(initialWeightG),
        targetHarvestWeightG: productionType === 'swine' ? 110000 : 500,
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
      if (err.message && (err.message.includes('sobrepoblación') || err.message.includes('sobrecupo'))) {
        setOvercrowdingError(err.message);
      } else {
        alert(err.message || 'Error al registrar el lote');
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
          disabled={!selectedFarmId || (ponds.length === 0 && pens.length === 0)}
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

      {/* Pestañas de Filtro: Todos los Lotes / Piscicultura / Porcicultura */}
      <div className="flex border-b border-[#E2D9CA] dark:border-[#332E27] gap-3">
        <button
          type="button"
          onClick={() => setFilterType('all')}
          className={`flex items-center gap-2 pb-2.5 px-3 font-serif text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            filterType === 'all'
              ? 'border-[#2E4A36] text-[#2E4A36] dark:text-[#86A98F]'
              : 'border-transparent text-[#666159] dark:text-[#9E9689] hover:text-[#1F1D1A]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{t('tab_batches_all')} ({batches.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setFilterType('fish')}
          className={`flex items-center gap-2 pb-2.5 px-3 font-serif text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            filterType === 'fish'
              ? 'border-[#3B5568] text-[#3B5568] dark:text-[#8EA8BA]'
              : 'border-transparent text-[#666159] dark:text-[#9E9689] hover:text-[#1F1D1A]'
          }`}
        >
          <Fish className="w-4 h-4" />
          <span>{t('tab_batches_fish')} ({batches.filter(b => !b.penCode).length})</span>
        </button>
        <button
          type="button"
          onClick={() => setFilterType('swine')}
          className={`flex items-center gap-2 pb-2.5 px-3 font-serif text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            filterType === 'swine'
              ? 'border-[#8A4B2A] text-[#8A4B2A] dark:text-[#E0A882]'
              : 'border-transparent text-[#666159] dark:text-[#9E9689] hover:text-[#1F1D1A]'
          }`}
        >
          <span className="text-sm">🐖</span>
          <span>{t('tab_batches_swine')} ({batches.filter(b => !!b.penCode).length})</span>
        </button>
      </div>

      {/* Listado de Lotes */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#E2D9CA] dark:border-[#332E27] pb-2">
          <h2 className="text-lg font-serif font-semibold text-[#1F1D1A] dark:text-[#EDE6DA]">
            {language === 'es' ? 'Fichas de Lotes Sembrados' : 'Stocked Batch Records'} ({batches.filter(b => filterType === 'all' ? true : filterType === 'swine' ? !!b.penCode : !b.penCode).length})
          </h2>
          <span className="text-xs text-[#666159] dark:text-[#9E9689] font-mono">
            {language === 'es' ? 'Control de densidad y biomasa' : 'Density & biomass tracking'}
          </span>
        </div>

        {batches.filter(b => filterType === 'all' ? true : filterType === 'swine' ? !!b.penCode : !b.penCode).length === 0 ? (
          <div className="card-notebook p-8 text-center">
            {filterType === 'swine' ? (
              <span className="text-4xl block mb-2 opacity-70">🐖</span>
            ) : (
              <Fish className="w-10 h-10 text-[#666159] dark:text-[#9E9689] mx-auto mb-2 opacity-60" />
            )}
            <h3 className="font-serif font-semibold text-base text-[#1F1D1A] dark:text-[#EDE6DA]">
              {language === 'es' ? 'No hay lotes sembrados para este filtro.' : 'No batches stocked for this filter.'}
            </h3>
            <p className="text-xs text-[#666159] dark:text-[#9E9689] max-w-sm mx-auto mt-1 mb-4">
              {language === 'es'
                ? 'Registra la primera siembra de alevinos en estanque o lechones en corral indicando la cantidad inicial y el peso de entrada.'
                : 'Log your first stocking of fingerlings in pond or piglets in pen with initial quantity and entry weight.'}
            </p>
            <button
              onClick={() => {
                setBatchCode(`LT-${Date.now().toString().slice(-4)}`);
                if (filterType === 'swine') handleTypeChange('swine');
                else if (filterType === 'fish') handleTypeChange('fish');
                setShowModal(true);
              }}
              disabled={!selectedFarmId || (ponds.length === 0 && pens.length === 0)}
              className="btn-primary text-xs h-10 px-4 inline-flex disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{t('btn_new_batch')}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches
              .filter(b => filterType === 'all' ? true : filterType === 'swine' ? !!b.penCode : !b.penCode)
              .map((b) => {
                const isSwineBatch = !!b.penCode;

                return (
                  <div
                    key={b.id}
                    className={`card-notebook p-5 flex flex-col justify-between border-l-4 ${
                      isSwineBatch ? 'border-l-[#8A4B2A]' : 'border-l-[#2E4A36]'
                    }`}
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
                            <span className={isSwineBatch ? "notebook-stamp-terracotta text-[10px] py-0.5" : "notebook-stamp text-[10px] py-0.5"}>
                              {b.speciesCommonName}
                            </span>
                          </div>
                        </div>

                        <span className="status-badge-green text-[10px] py-0.5 uppercase font-mono">
                          {b.status}
                        </span>
                      </div>

                      <p className="text-xs text-[#666159] dark:text-[#9E9689] font-medium mt-1">
                        {isSwineBatch ? (
                          <>
                            {t('label_pen')}: <span className="font-semibold text-[#8A4B2A] dark:text-[#E0A882]">{b.penCode}</span>
                            {b.barnCodeName && <span className="text-[11px] opacity-80"> ({b.barnCodeName})</span>}
                          </>
                        ) : (
                          <>
                            {t('label_pond')}: <span className="font-semibold text-[#1F1D1A] dark:text-[#EDE6DA]">{b.pondCodeName || 'Sin estanque'}</span>
                          </>
                        )}
                      </p>

                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#DDD4C4] dark:border-[#38342F] text-xs">
                        <div className="p-2.5 bg-[#F4EFE3]/70 dark:bg-[#141210]/60 rounded-[4px] border border-[#DDD4C4] dark:border-[#38342F]">
                          <span className="text-[10px] uppercase font-semibold text-[#666159] dark:text-[#9E9689] block">
                            {isSwineBatch ? 'Cabezas' : 'Población'}
                          </span>
                          <span className="font-serif font-bold text-base text-[#1F1D1A] dark:text-[#EDE6DA] metric-number block">
                            {b.initialQuantity.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-[#666159] dark:text-[#9E9689]">
                            {b.initialAvgWeightG >= 1000
                              ? `${(b.initialAvgWeightG / 1000).toFixed(1)} kg/cerdo`
                              : `${b.initialAvgWeightG} g/individuo`}
                          </span>
                        </div>

                        <div className="p-2.5 bg-[#F4EFE3]/70 dark:bg-[#141210]/60 rounded-[4px] border border-[#DDD4C4] dark:border-[#38342F]">
                          <span className="text-[10px] uppercase font-semibold text-[#666159] dark:text-[#9E9689] block">
                            Biomasa Siembra
                          </span>
                          <span className={`font-serif font-bold text-base metric-number block ${
                            isSwineBatch ? 'text-[#8A4B2A] dark:text-[#E0A882]' : 'text-[#2E4A36] dark:text-[#86A98F]'
                          }`}>
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
                );
              })}
          </div>
        )}
      </section>

      {/* Modal Siembra HU-02 & HU-11 (Estilo Ficha de Siembra de Cuaderno) */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
          className="fixed inset-0 z-50 bg-[#1F1D1A]/50 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="card-paper max-w-lg w-full p-6 space-y-4 shadow-xl border border-[#E2D9CA] dark:border-[#332E27] max-h-[90vh] overflow-y-auto cursor-default">
            <div className="border-b border-[#E2D9CA] dark:border-[#332E27] pb-2">
              <span className={productionType === 'swine' ? "notebook-stamp-terracotta text-[10px]" : "notebook-stamp text-[10px]"}>
                {productionType === 'swine' ? "ACTA DE ALOJAMIENTO HU-11" : "ACTA DE SIEMBRA HU-02"}
              </span>
              <h3 className="text-lg font-serif font-bold text-[#1F1D1A] dark:text-[#EDE6DA] mt-1">
                {productionType === 'swine'
                  ? (language === 'es' ? 'Registrar Lote Porcícola en Corral' : 'Register Swine Batch in Pen')
                  : (language === 'es' ? 'Registrar Siembra de Nuevo Lote' : 'Register Stocking of New Batch')}
              </h3>
            </div>

            {/* Selector de Tipo de Producción (Peces vs Cerdos) */}
            <div className="flex rounded-[4px] p-1 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] gap-1">
              <button
                type="button"
                onClick={() => handleTypeChange('fish')}
                className={`flex-1 py-2 px-3 rounded-[3px] text-xs font-serif font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  productionType === 'fish'
                    ? 'bg-[#2E4A36] text-white shadow-xs'
                    : 'text-[#666159] dark:text-[#9E9689] hover:text-[#1F1D1A]'
                }`}
              >
                <Fish className="w-4 h-4" />
                <span>{t('type_fish_label')}</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('swine')}
                className={`flex-1 py-2 px-3 rounded-[3px] text-xs font-serif font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  productionType === 'swine'
                    ? 'bg-[#8A4B2A] text-white shadow-xs'
                    : 'text-[#666159] dark:text-[#9E9689] hover:text-[#1F1D1A]'
                }`}
              >
                <span>🐖</span>
                <span>{t('type_swine_label')}</span>
              </button>
            </div>

            {overcrowdingError && (
              <div className="p-3 rounded-[4px] bg-[#A32A26]/10 border border-[#A32A26]/30 text-xs text-[#A32A26] dark:text-[#E5807D] space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>¡Alerta Preventiva de Sobrecupo!</span>
                </div>
                <p>{overcrowdingError}</p>
                <p className="text-[11px] opacity-80 pt-1">
                  Marca la casilla "Forzar ingreso bajo criterio técnico" si cuentas con un plan de manejo programado.
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
                  placeholder={productionType === 'swine' ? "ej. LT-CER-2026-01" : "ej. LT-TIL-2026-01"}
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

                {productionType === 'fish' ? (
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
                ) : (
                  <div>
                    <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                      Corral Destino (HU-10) *
                    </label>
                    <select
                      value={penId}
                      onChange={(e) => setPenId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                    >
                      {pens.length === 0 ? (
                        <option value="">(No hay corrales registrados)</option>
                      ) : (
                        pens.map((p) => {
                          const barn = barns.find(b => b.id === p.barnId);
                          return (
                            <option key={p.id} value={p.id}>
                              {barn ? `${barn.codeName} - ` : ''}Corral {p.penCode} ({p.phase}, aforo: {p.maxCapacityPigs} cerdos)
                            </option>
                          );
                        })
                      )}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                    {productionType === 'swine' ? 'Cantidad (Cerdos) *' : 'Cantidad (Peces) *'}
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
                    {productionType === 'swine' ? 'Peso Entrada (g) *' : 'Peso Entrada (g) *'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={initialWeightG}
                    onChange={(e) => setInitialWeightG(Number(e.target.value))}
                    placeholder={productionType === 'swine' ? "ej. 25000 para 25kg" : "ej. 5.0"}
                    className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                    {productionType === 'swine' ? 'Fecha Ingreso *' : 'Fecha Siembra *'}
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

              {/* Caja de Cálculo de Aforo y Sobrecupo (HU-02 & HU-10/11) */}
              <div className={`border rounded-[4px] p-4 space-y-2 ${
                productionType === 'swine'
                  ? 'bg-[#FAF2EB] dark:bg-[#201712] border-[#8A4B2A]/30'
                  : 'bg-[#EDF3EE] dark:bg-[#18231C] border-[#2E4A36]/30'
              }`}>
                <span className={productionType === 'swine' ? "notebook-stamp-terracotta text-[10px]" : "notebook-stamp text-[10px]"}>
                  {productionType === 'swine' ? "EVALUACIÓN ZOOTÉCNICA HU-10/HU-11" : "EVALUACIÓN HU-02"}
                </span>

                {productionType === 'fish' ? (
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
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[#666159] dark:text-[#9E9689] block">Cerdos a Alojar:</span>
                      <span className="font-serif font-bold text-base text-[#1F1D1A] dark:text-[#EDE6DA]">
                        {quantity} cabezas ({((quantity * initialWeightG) / 1000).toFixed(1)} kg vivos)
                      </span>
                    </div>
                    <div>
                      <span className="text-[#666159] dark:text-[#9E9689] block">Aforo Seguro Corral:</span>
                      <span className="font-serif font-bold text-base text-[#8A4B2A] dark:text-[#E0A882]">
                        {penCapacityPigs} cabezas (Norma ICA)
                      </span>
                    </div>
                  </div>
                )}

                {isOvercrowded && (
                  <div className="pt-2 border-t border-[#8A4B2A]/20 text-xs text-[#A32A26] dark:text-[#E5807D] font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Sobrecupo proyectado: +{overcrowdingPct}% sobre capacidad máxima técnica.</span>
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
                    className="w-4 h-4 text-[#8A4B2A] rounded"
                  />
                  <label htmlFor="force" className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] cursor-pointer">
                    Forzar ingreso bajo criterio técnico zootécnico (Plan de manejo programado)
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
                  {productionType === 'swine' ? 'Confirmar Alojamiento' : 'Confirmar Siembra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
