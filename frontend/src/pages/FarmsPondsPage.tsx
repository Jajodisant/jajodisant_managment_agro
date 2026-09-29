import React, { useEffect, useState } from 'react';
import { Layers, Plus, Droplet, Wind, CheckCircle2, ChevronRight, Ruler, Home, Grid, Users } from 'lucide-react';
import { api } from '../services/api';
import { Farm, Pond, SwineBarn, SwinePen } from '../types';
import { useTranslation } from '../context/LanguageContext';

export const FarmsPondsPage: React.FC = () => {
  const { t, language } = useTranslation();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Pestaña de infraestructura: Estanques vs Porcicultura (Galpones & Corrales)
  const [infraTab, setInfraTab] = useState<'ponds' | 'swine'>('ponds');

  // Modales y formularios Granjas y Estanques
  const [showFarmModal, setShowFarmModal] = useState<boolean>(false);
  const [farmName, setFarmName] = useState<string>('');
  const [farmLocation, setFarmLocation] = useState<string>('');

  const [showPondModal, setShowPondModal] = useState<boolean>(false);
  const [pondCode, setPondCode] = useState<string>('');
  const [pondType, setPondType] = useState<string>('earthen');
  const [lengthM, setLengthM] = useState<number>(20);
  const [widthM, setWidthM] = useState<number>(10);
  const [depthM, setDepthM] = useState<number>(1.5);
  const [hasAeration, setHasAeration] = useState<boolean>(false);
  const [customDensity, setCustomDensity] = useState<string>('');

  // Modales y formularios Porcicultura (HU-10)
  const [barns, setBarns] = useState<SwineBarn[]>([]);
  const [pensByBarn, setPensByBarn] = useState<Record<string, SwinePen[]>>({});
  const [showBarnModal, setShowBarnModal] = useState<boolean>(false);
  const [showPenModal, setShowPenModal] = useState<boolean>(false);

  // Formulario Galpón
  const [barnCode, setBarnCode] = useState<string>('');
  const [barnType, setBarnType] = useState<string>('open_curtain');
  const [barnLengthM, setBarnLengthM] = useState<number>(40);
  const [barnWidthM, setBarnWidthM] = useState<number>(10);
  const [hasVentilation, setHasVentilation] = useState<boolean>(false);
  const [hasCooling, setHasCooling] = useState<boolean>(false);

  // Formulario Corral
  const [selectedBarnIdForPen, setSelectedBarnIdForPen] = useState<string>('');
  const [penCode, setPenCode] = useState<string>('');
  const [penPhase, setPenPhase] = useState<string>('ceba');
  const [penLengthM, setPenLengthM] = useState<number>(5);
  const [penWidthM, setPenWidthM] = useState<number>(4);
  const [drinkerType, setDrinkerType] = useState<string>('nipple');
  const [drinkerCount, setDrinkerCount] = useState<number>(2);
  const [feederSpaces, setFeederSpaces] = useState<number>(4);

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    loadFarms();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowFarmModal(false);
        setShowPondModal(false);
        setShowBarnModal(false);
        setShowPenModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (selectedFarmId) {
      loadPonds(selectedFarmId);
      loadSwineInfrastructure(selectedFarmId);
    } else {
      setPonds([]);
      setBarns([]);
      setPensByBarn({});
    }
  }, [selectedFarmId]);

  const loadFarms = async () => {
    try {
      setLoading(true);
      const data = await api.getFarms();
      setFarms(data);
      if (data.length > 0 && !selectedFarmId) {
        setSelectedFarmId(data[0].id);
      }
    } catch (err) {
      console.error('Error cargando granjas:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPonds = async (farmId: string) => {
    try {
      const data = await api.getPonds(farmId);
      setPonds(data);
    } catch (err) {
      console.error('Error cargando estanques:', err);
    }
  };

  const loadSwineInfrastructure = async (farmId: string) => {
    try {
      const barnList = await api.getSwineBarns(farmId);
      setBarns(barnList);
      const pensMap: Record<string, SwinePen[]> = {};
      await Promise.all(
        barnList.map(async (b) => {
          try {
            const pList = await api.getSwinePens(b.id);
            pensMap[b.id] = pList;
          } catch (e) {
            console.error(`Error cargando corrales de galpón ${b.id}:`, e);
          }
        })
      );
      setPensByBarn(pensMap);
    } catch (err) {
      console.error('Error cargando infraestructura porcícola:', err);
    }
  };

  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmName.trim()) return;
    try {
      const created = await api.createFarm({ name: farmName, location: farmLocation });
      setFarms([...farms, created]);
      setSelectedFarmId(created.id);
      setFarmName('');
      setFarmLocation('');
      setShowFarmModal(false);
      showFeedback(language === 'es' ? '¡Granja registrada exitosamente en el cuaderno!' : 'Farm successfully registered in journal!');
    } catch (err: any) {
      alert(err.message || 'Error registrando granja');
    }
  };

  const handleCreatePond = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmId || !pondCode.trim()) return;

    try {
      const payload: any = {
        codeName: pondCode.trim(),
        pondType,
        lengthM: Number(lengthM),
        widthM: Number(widthM),
        avgDepthM: Number(depthM),
        hasAeration
      };

      if (customDensity) {
        payload.maxDensityKgM3 = Number(customDensity);
      }

      const created = await api.createPond(selectedFarmId, payload);
      setPonds([...ponds, created]);
      setPondCode('');
      setCustomDensity('');
      setShowPondModal(false);
      showFeedback(
        language === 'es'
          ? `¡Estanque ${created.codeName} aforado! Volumen: ${created.volumeM3} m³, Aforo: ${created.maxBiomassCapacityKg} kg`
          : `Pond ${created.codeName} gauged! Volume: ${created.volumeM3} m³, Capacity: ${created.maxBiomassCapacityKg} kg`
      );
    } catch (err: any) {
      alert(err.message || 'Error registrando estanque');
    }
  };

  const handleCreateBarn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmId || !barnCode.trim()) return;
    try {
      const created = await api.createSwineBarn({
        farmId: selectedFarmId,
        codeName: barnCode.trim(),
        barnType,
        lengthM: Number(barnLengthM),
        widthM: Number(barnWidthM),
        hasAutomaticVentilation: hasVentilation,
        hasCoolingSystem: hasCooling,
      });
      setBarns([...barns, created]);
      setPensByBarn((prev) => ({ ...prev, [created.id]: [] }));
      setBarnCode('');
      setShowBarnModal(false);
      showFeedback(
        language === 'es'
          ? `¡Galpón ${created.codeName} registrado! Área: ${created.totalAreaM2} m²`
          : `Barn ${created.codeName} registered! Area: ${created.totalAreaM2} m²`
      );
    } catch (err: any) {
      alert(err.message || 'Error registrando galpón');
    }
  };

  const handleCreatePen = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetBarnId = selectedBarnIdForPen || (barns.length > 0 ? barns[0].id : '');
    if (!targetBarnId || !penCode.trim()) return;
    try {
      const created = await api.createSwinePen({
        barnId: targetBarnId,
        penCode: penCode.trim(),
        phase: penPhase,
        lengthM: Number(penLengthM),
        widthM: Number(penWidthM),
        drinkerType,
        drinkerCount: Number(drinkerCount),
        feederSpaces: Number(feederSpaces),
      });
      setPensByBarn((prev) => ({
        ...prev,
        [targetBarnId]: [...(prev[targetBarnId] || []), created],
      }));
      setPenCode('');
      setShowPenModal(false);
      showFeedback(
        language === 'es'
          ? `¡Corral ${created.penCode} aforado! Aforo máximo: ${created.maxCapacityPigs} cabezas (${created.areaM2} m²)`
          : `Pen ${created.penCode} gauged! Capacity: ${created.maxCapacityPigs} heads (${created.areaM2} m²)`
      );
    } catch (err: any) {
      alert(err.message || 'Error registrando corral');
    }
  };

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Previsualización interactiva de volumen y aforo en el modal de estanque (HU-01)
  const previewVolume = (lengthM * widthM * depthM).toFixed(2);
  const previewDensity = customDensity ? Number(customDensity) : hasAeration ? 10.0 : 3.0;
  const previewCapacity = (Number(previewVolume) * previewDensity).toFixed(2);

  // Previsualización interactiva de corral porcino (HU-10)
  const previewBarnArea = (barnLengthM * barnWidthM).toFixed(2);
  const previewPenArea = (penLengthM * penWidthM).toFixed(2);
  const stageDensityRequirement: Record<string, number> = {
    precebo: 0.35,
    levante: 0.65,
    ceba: 1.0,
    maternidad: 4.5,
    gestacion: 2.25,
  };
  const previewReqDensity = stageDensityRequirement[penPhase] || 1.0;
  const previewPenCapacity = Math.floor(Number(previewPenArea) / previewReqDensity);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Feedback sobrio estilo cuaderno */}
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
              FOLIO #01 • INSTALACIONES
            </span>
            <span className="text-xs text-[#666159] dark:text-[#9E9689] uppercase tracking-wider font-mono">
              NORMA HU-01
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#1F1D1A] dark:text-[#EDE6DA] font-semibold tracking-tight">
            {t('farms_title')}
          </h1>
          <p className="text-sm text-[#666159] dark:text-[#9E9689] mt-0.5 max-w-2xl">
            {t('farms_subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowFarmModal(true)}
            className="btn-secondary text-xs sm:text-sm px-4 h-11"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'es' ? 'Nueva Granja' : 'New Farm'}</span>
          </button>
          {infraTab === 'ponds' ? (
            <button
              onClick={() => setShowPondModal(true)}
              disabled={!selectedFarmId}
              className="btn-primary text-xs sm:text-sm px-4 h-11 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{t('btn_new_pond')}</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowBarnModal(true)}
                disabled={!selectedFarmId}
                className="btn-primary text-xs sm:text-sm px-4 h-11 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{t('btn_new_barn')}</span>
              </button>
              <button
                onClick={() => {
                  if (barns.length > 0 && !selectedBarnIdForPen) {
                    setSelectedBarnIdForPen(barns[0].id);
                  }
                  setShowPenModal(true);
                }}
                disabled={!selectedFarmId || barns.length === 0}
                className="btn-secondary text-xs sm:text-sm px-4 h-11 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{t('btn_new_pen')}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Selector de Granja / Carpeta de Cuaderno */}
      {farms.length > 0 && (
        <div className="card-paper p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[4px] bg-[#2E4A36]/10 text-[#2E4A36] dark:text-[#86A98F] border border-[#2E4A36]/20 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666159] dark:text-[#9E9689] block">
                {language === 'es' ? 'Granja de Operación Activa' : 'Active Production Farm'}
              </span>
              <select
                value={selectedFarmId}
                onChange={(e) => setSelectedFarmId(e.target.value)}
                className="font-serif font-semibold text-base sm:text-lg text-[#1F1D1A] dark:text-[#EDE6DA] bg-transparent border-0 focus:ring-0 cursor-pointer p-0 w-full"
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id} className="bg-[#FBF8F1] dark:bg-[#1F1C18] text-[#1F1D1A] dark:text-[#EDE6DA]">
                    {f.name} {f.location ? `(${f.location})` : ''} • {f.pondsCount} estanques aforados
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#666159] dark:text-[#9E9689] font-mono">
            <span>Granjas registradas: {farms.length}</span>
          </div>
        </div>
      )}

      {/* Pestañas de Infraestructura: Piscicultura vs Porcicultura (HU-10) */}
      <div className="flex border-b border-[#E2D9CA] dark:border-[#332E27] gap-3">
        <button
          type="button"
          onClick={() => setInfraTab('ponds')}
          className={`flex items-center gap-2 pb-2.5 px-3 font-serif text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            infraTab === 'ponds'
              ? 'border-[#2E4A36] text-[#2E4A36] dark:text-[#86A98F]'
              : 'border-transparent text-[#666159] dark:text-[#9E9689] hover:text-[#1F1D1A]'
          }`}
        >
          <Droplet className="w-4 h-4" />
          <span>{t('tab_ponds')} ({ponds.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setInfraTab('swine')}
          className={`flex items-center gap-2 pb-2.5 px-3 font-serif text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            infraTab === 'swine'
              ? 'border-[#8A4B2A] text-[#8A4B2A] dark:text-[#E0A882]'
              : 'border-transparent text-[#666159] dark:text-[#9E9689] hover:text-[#1F1D1A]'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>{t('tab_swine')} ({barns.length})</span>
        </button>
      </div>

      {/* Listado de Estanques con Métricas de Aforo (HU-01) */}
      {infraTab === 'ponds' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#E2D9CA] dark:border-[#332E27] pb-2">
            <h2 className="text-lg font-serif font-semibold text-[#1F1D1A] dark:text-[#EDE6DA]">
              {language === 'es' ? 'Fichas de Estanques Aforados' : 'Gauged Pond Records'} ({ponds.length})
            </h2>
            <span className="text-xs text-[#666159] dark:text-[#9E9689] font-mono">
              {language === 'es' ? 'Capacidad en m³ y biomasa' : 'm³ Volume & carrying capacity'}
            </span>
          </div>

          {ponds.length === 0 ? (
            <div className="card-notebook p-8 text-center">
              <Droplet className="w-10 h-10 text-[#666159] dark:text-[#9E9689] mx-auto mb-2 opacity-60" />
              <h3 className="font-serif font-semibold text-base text-[#1F1D1A] dark:text-[#EDE6DA]">
                {language === 'es' ? 'No hay estanques registrados en esta granja.' : 'No ponds registered for this farm.'}
              </h3>
              <p className="text-xs text-[#666159] dark:text-[#9E9689] max-w-sm mx-auto mt-1 mb-4">
                {language === 'es'
                  ? 'Registra las dimensiones físicas (largo × ancho × profundidad) para calcular el volumen útil y la capacidad máxima de siembra.'
                  : 'Log physical dimensions to calculate usable water volume and stocking limits.'}
              </p>
              <button
                onClick={() => setShowPondModal(true)}
                className="btn-primary text-xs h-10 px-4 inline-flex"
              >
                <Plus className="w-4 h-4" />
                <span>{t('btn_new_pond')}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ponds.map((p) => (
                <div
                  key={p.id}
                  className="card-notebook-forest p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-serif font-bold text-lg text-[#1F1D1A] dark:text-[#EDE6DA]">
                          {p.codeName}
                        </h3>
                        <span className="text-xs text-[#666159] dark:text-[#9E9689] font-mono uppercase">
                          {p.pondType === 'earthen' ? 'En Tierra (Rústico)' : p.pondType === 'geomembrane' ? 'Geomembrana' : 'Concreto'}
                        </span>
                      </div>

                      {p.hasAeration ? (
                        <span className="status-badge-green text-[10px] py-0.5">
                          <Wind className="w-3 h-3" />
                          <span>Aireado (10 kg/m³)</span>
                        </span>
                      ) : (
                        <span className="notebook-stamp text-[10px] py-0.5">
                          <span>Sin aireación (3 kg/m³)</span>
                        </span>
                      )}
                    </div>

                    {/* Dimensiones y cubicaje */}
                    <div className="p-3 bg-[#F4EFE3]/70 dark:bg-[#141210]/60 rounded-[4px] border border-[#DDD4C4] dark:border-[#38342F] text-xs space-y-1.5 my-3">
                      <div className="flex items-center justify-between text-[#666159] dark:text-[#9E9689]">
                        <span className="flex items-center gap-1">
                          <Ruler className="w-3.5 h-3.5" />
                          <span>Dimensiones:</span>
                        </span>
                        <span className="font-mono text-[#1F1D1A] dark:text-[#EDE6DA]">
                          {p.lengthM}m × {p.widthM}m × {p.avgDepthM}m
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-[#DDD4C4] dark:border-[#38342F] pt-1">
                        <span className="font-semibold text-[#1F1D1A] dark:text-[#EDE6DA]">Volumen Útil (m³):</span>
                        <span className="font-serif font-bold text-base text-[#1F1D1A] dark:text-[#EDE6DA] metric-number">
                          {p.volumeM3} m³
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Aforo Máximo de Carga */}
                  <div className="pt-3 border-t border-[#E2D9CA] dark:border-[#332E27] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-[#666159] dark:text-[#9E9689] block">
                        Aforo Máximo de Biomasa
                      </span>
                      <span className="font-serif font-bold text-base text-[#2E4A36] dark:text-[#86A98F] metric-number">
                        {p.maxBiomassCapacityKg ? `${p.maxBiomassCapacityKg.toLocaleString()} kg` : 'N/A'}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-[#666159] dark:text-[#9E9689]">
                      Límite: {p.maxDensityKgM3} kg/m³
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Listado de Galpones y Corrales Porcícolas (HU-10) */}
      {infraTab === 'swine' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2D9CA] dark:border-[#332E27] pb-2">
            <div>
              <h2 className="text-lg font-serif font-semibold text-[#1F1D1A] dark:text-[#EDE6DA]">
                {t('barns_section_title')} ({barns.length})
              </h2>
              <p className="text-xs text-[#666159] dark:text-[#9E9689]">
                {language === 'es' ? 'Naves porcícolas y aforo zootécnico por corrales (Norma HU-10)' : 'Swine barns and zootechnical pen capacity (HU-10)'}
              </p>
            </div>
            <button
              onClick={() => setShowBarnModal(true)}
              disabled={!selectedFarmId}
              className="btn-primary text-xs h-9 px-3"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('btn_new_barn')}</span>
            </button>
          </div>

          {barns.length === 0 ? (
            <div className="card-notebook p-8 text-center border-l-4 border-l-[#8A4B2A]">
              <Home className="w-10 h-10 text-[#8A4B2A] mx-auto mb-2 opacity-70" />
              <h3 className="font-serif font-semibold text-base text-[#1F1D1A] dark:text-[#EDE6DA]">
                {t('no_barns_title')}
              </h3>
              <p className="text-xs text-[#666159] dark:text-[#9E9689] max-w-sm mx-auto mt-1 mb-4">
                {t('no_barns_desc')}
              </p>
              <button
                onClick={() => setShowBarnModal(true)}
                className="btn-primary text-xs h-10 px-4 inline-flex"
              >
                <Plus className="w-4 h-4" />
                <span>{t('btn_new_barn')}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {barns.map((barn) => {
                const barnPens = pensByBarn[barn.id] || [];
                const totalBarnCapacity = barnPens.reduce((acc, p) => acc + (p.maxCapacityPigs || 0), 0);

                return (
                  <div
                    key={barn.id}
                    className="card-paper p-5 border-l-4 border-l-[#8A4B2A] space-y-4"
                  >
                    {/* Encabezado del Galpón */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#E2D9CA] dark:border-[#332E27] pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="notebook-stamp-terracotta text-[10px]">
                            GALPÓN PORCÍCOLA
                          </span>
                          <span className="font-mono text-xs text-[#666159] dark:text-[#9E9689]">
                            {barn.barnType === 'open_curtain'
                              ? (language === 'es' ? 'Cortina Abierta Natural' : 'Open Curtain Natural')
                              : barn.barnType === 'tunnel_ventilation'
                              ? (language === 'es' ? 'Túnel de Ventilación' : 'Tunnel Ventilation')
                              : (language === 'es' ? 'Convencional' : 'Conventional')}
                          </span>
                        </div>
                        <h3 className="text-xl font-serif font-bold text-[#1F1D1A] dark:text-[#EDE6DA] mt-0.5">
                          {barn.codeName}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right sm:text-right mr-2">
                          <span className="text-[10px] uppercase font-semibold text-[#666159] dark:text-[#9E9689] block">
                            {language === 'es' ? 'Aforo Total Galpón' : 'Total Barn Capacity'}
                          </span>
                          <span className="font-serif font-bold text-base text-[#8A4B2A] dark:text-[#E0A882]">
                            {totalBarnCapacity} {language === 'es' ? 'cabezas' : 'heads'}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedBarnIdForPen(barn.id);
                            setShowPenModal(true);
                          }}
                          className="btn-secondary text-xs h-9 px-3"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{t('btn_new_pen')}</span>
                        </button>
                      </div>
                    </div>

                    {/* Especificaciones físicas del galpón */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-[#F4EFE3]/70 dark:bg-[#141210]/60 p-3 rounded-[4px] border border-[#DDD4C4] dark:border-[#38342F]">
                      <div>
                        <span className="text-[#666159] dark:text-[#9E9689] block">Dimensiones:</span>
                        <span className="font-mono font-semibold text-[#1F1D1A] dark:text-[#EDE6DA]">
                          {barn.lengthM}m × {barn.widthM}m
                        </span>
                      </div>
                      <div>
                        <span className="text-[#666159] dark:text-[#9E9689] block">Área Techada:</span>
                        <span className="font-mono font-semibold text-[#1F1D1A] dark:text-[#EDE6DA]">
                          {barn.totalAreaM2} m²
                        </span>
                      </div>
                      <div>
                        <span className="text-[#666159] dark:text-[#9E9689] block">Ventilación Forzada:</span>
                        <span className="font-mono font-semibold text-[#1F1D1A] dark:text-[#EDE6DA]">
                          {barn.hasAutomaticVentilation ? (language === 'es' ? 'Sí (Extractores)' : 'Yes') : (language === 'es' ? 'Natural' : 'Natural')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#666159] dark:text-[#9E9689] block">Panel Evaporativo / Cooling:</span>
                        <span className="font-mono font-semibold text-[#1F1D1A] dark:text-[#EDE6DA]">
                          {barn.hasCoolingSystem ? (language === 'es' ? 'Equipado' : 'Equipped') : (language === 'es' ? 'No' : 'No')}
                        </span>
                      </div>
                    </div>

                    {/* Grilla de Corrales (HU-10) */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-serif font-semibold text-[#1F1D1A] dark:text-[#EDE6DA]">
                          {t('pens_section_title')} ({barnPens.length})
                        </span>
                      </div>

                      {barnPens.length === 0 ? (
                        <p className="text-xs text-[#666159] dark:text-[#9E9689] italic py-2">
                          {t('no_pens_desc')}
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {barnPens.map((pen) => {
                            return (
                              <div
                                key={pen.id}
                                className="bg-[#FAF7F0] dark:bg-[#1E1B17] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] p-3 space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-serif font-bold text-sm text-[#1F1D1A] dark:text-[#EDE6DA]">
                                    {pen.penCode}
                                  </span>
                                  <span className="notebook-stamp-terracotta text-[9px] py-0.2 px-1.5 uppercase">
                                    {pen.phase}
                                  </span>
                                </div>

                                <div className="text-[11px] text-[#666159] dark:text-[#9E9689] space-y-0.5">
                                  <div className="flex justify-between">
                                    <span>Dimensión:</span>
                                    <span className="font-mono text-[#1F1D1A] dark:text-[#EDE6DA]">
                                      {pen.lengthM}m × {pen.widthM}m ({pen.areaM2} m²)
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Requerimiento:</span>
                                    <span className="font-mono text-[#1F1D1A] dark:text-[#EDE6DA]">
                                      {pen.maxDensityM2PerPig} m²/cerdo
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Equipamiento:</span>
                                    <span className="font-mono text-[#1F1D1A] dark:text-[#EDE6DA]">
                                      {pen.drinkerCount} {t('drinker_label').toLowerCase()} • {pen.feederSpaces} {t('feeder_label').toLowerCase()}
                                    </span>
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-[#E2D9CA] dark:border-[#332E27] flex items-center justify-between">
                                  <span className="text-[10px] uppercase font-semibold text-[#666159] dark:text-[#9E9689]">
                                    {t('capacity_heads')}:
                                  </span>
                                  <span className="font-serif font-bold text-sm text-[#8A4B2A] dark:text-[#E0A882]">
                                    {pen.maxCapacityPigs} cabezas
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Modal: Crear Granja (Estilo Ficha de Cuaderno) */}
      {showFarmModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) setShowFarmModal(false); }}
          className="fixed inset-0 z-50 bg-[#1F1D1A]/50 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="card-paper max-w-md w-full p-6 space-y-4 shadow-xl border border-[#E2D9CA] dark:border-[#332E27] cursor-default">
            <div className="border-b border-[#E2D9CA] dark:border-[#332E27] pb-2">
              <span className="notebook-stamp text-[10px]">ACTA DE REGISTRO</span>
              <h3 className="text-lg font-serif font-bold text-[#1F1D1A] dark:text-[#EDE6DA] mt-1">
                Registrar Nueva Granja
              </h3>
            </div>

            <form onSubmit={handleCreateFarm} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                  Nombre Comercial de la Granja *
                </label>
                <input
                  type="text"
                  required
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  placeholder="ej. Piscícola San Jerónimo"
                  className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] focus:border-[#2E4A36] outline-none text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                  Ubicación Geográfica / Vereda
                </label>
                <input
                  type="text"
                  value={farmLocation}
                  onChange={(e) => setFarmLocation(e.target.value)}
                  placeholder="ej. Vereda El Salado, Huila"
                  className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] focus:border-[#2E4A36] outline-none text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2D9CA] dark:border-[#332E27]">
                <button
                  type="button"
                  onClick={() => setShowFarmModal(false)}
                  className="btn-secondary text-xs h-10 px-4"
                >
                  {t('btn_cancel')}
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs h-10 px-4"
                >
                  Guardar Granja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear Estanque con Aforo Técnico (HU-01) */}
      {showPondModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) setShowPondModal(false); }}
          className="fixed inset-0 z-50 bg-[#1F1D1A]/50 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="card-paper max-w-lg w-full p-6 space-y-4 shadow-xl border border-[#E2D9CA] dark:border-[#332E27] max-h-[90vh] overflow-y-auto cursor-default">
            <div className="border-b border-[#E2D9CA] dark:border-[#332E27] pb-2">
              <span className="notebook-stamp text-[10px]">FICHA TÉCNICA HU-01</span>
              <h3 className="text-lg font-serif font-bold text-[#1F1D1A] dark:text-[#EDE6DA] mt-1">
                Aforo Técnico de Estanque
              </h3>
            </div>

            <form onSubmit={handleCreatePond} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                  Código o Nombre del Estanque *
                </label>
                <input
                  type="text"
                  required
                  value={pondCode}
                  onChange={(e) => setPondCode(e.target.value)}
                  placeholder="ej. Estanque T-01"
                  className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] focus:border-[#2E4A36] outline-none text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                  Tipo de Construcción
                </label>
                <select
                  value={pondType}
                  onChange={(e) => setPondType(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] focus:border-[#2E4A36] outline-none text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                >
                  <option value="earthen">En Tierra (Rústico tradicional)</option>
                  <option value="geomembrane">Geomembrana / Circular intensivo</option>
                  <option value="concrete">Concreto / Cemento</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">Largo (m) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    value={lengthM}
                    onChange={(e) => setLengthM(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">Ancho (m) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    value={widthM}
                    onChange={(e) => setWidthM(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">Profundidad (m) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    required
                    value={depthM}
                    onChange={(e) => setDepthM(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-[#F4EFE3]/80 dark:bg-[#141210]/60 rounded-[4px] border border-[#DDD4C4] dark:border-[#38342F]">
                <input
                  type="checkbox"
                  id="aeration"
                  checked={hasAeration}
                  onChange={(e) => setHasAeration(e.target.checked)}
                  className="w-4 h-4 text-[#2E4A36] rounded"
                />
                <label htmlFor="aeration" className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] cursor-pointer">
                  Cuenta con Aireación Mecánica Forzada (Splashers / Blowers)
                </label>
              </div>

              {/* Caja de Cálculo Dinámico en Vivo */}
              <div className="bg-[#EDF3EE] dark:bg-[#18231C] border border-[#2E4A36]/30 rounded-[4px] p-4 space-y-2">
                <span className="notebook-stamp text-[10px]">CÁLCULO ZOOTÉCNICO HU-01</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[#666159] dark:text-[#9E9689] block">Volumen Calculado:</span>
                    <span className="font-serif font-bold text-base text-[#1F1D1A] dark:text-[#EDE6DA]">{previewVolume} m³</span>
                  </div>
                  <div>
                    <span className="text-[#666159] dark:text-[#9E9689] block">Densidad de Carga:</span>
                    <span className="font-serif font-bold text-base text-[#1F1D1A] dark:text-[#EDE6DA]">{previewDensity} kg/m³</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-[#2E4A36]/20 flex justify-between items-center text-xs">
                  <span className="font-semibold text-[#1F1D1A] dark:text-[#EDE6DA]">Capacidad Máxima Segura:</span>
                  <span className="font-serif font-bold text-base text-[#2E4A36] dark:text-[#86A98F]">{previewCapacity} kg</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2D9CA] dark:border-[#332E27]">
                <button
                  type="button"
                  onClick={() => setShowPondModal(false)}
                  className="btn-secondary text-xs h-10 px-4"
                >
                  {t('btn_cancel')}
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs h-10 px-4"
                >
                  Guardar Estanque
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear Galpón Porcícola (HU-10) */}
      {showBarnModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) setShowBarnModal(false); }}
          className="fixed inset-0 z-50 bg-[#1F1D1A]/50 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="card-paper max-w-lg w-full p-6 space-y-4 shadow-xl border border-[#E2D9CA] dark:border-[#332E27] max-h-[90vh] overflow-y-auto cursor-default">
            <div className="border-b border-[#E2D9CA] dark:border-[#332E27] pb-2">
              <span className="notebook-stamp-terracotta text-[10px]">NORMA TÉCNICA HU-10</span>
              <h3 className="text-lg font-serif font-bold text-[#1F1D1A] dark:text-[#EDE6DA] mt-1">
                {language === 'es' ? 'Registrar Galpón Porcícola' : 'Register Swine Barn'}
              </h3>
            </div>

            <form onSubmit={handleCreateBarn} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                  {language === 'es' ? 'Código o Nombre del Galpón *' : 'Barn Code or Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={barnCode}
                  onChange={(e) => setBarnCode(e.target.value)}
                  placeholder="ej. Galpón Ceba 01"
                  className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] focus:border-[#8A4B2A] outline-none text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                  {language === 'es' ? 'Tipo de Nave / Construcción' : 'Barn Structure Type'}
                </label>
                <select
                  value={barnType}
                  onChange={(e) => setBarnType(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] focus:border-[#8A4B2A] outline-none text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                >
                  <option value="open_curtain">Cortina Abierta Natural (Clima cálido/templado)</option>
                  <option value="tunnel_ventilation">Túnel de Ventilación Presión Negativa</option>
                  <option value="conventional">Nave Convencional Mixta</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                    {language === 'es' ? 'Largo Techado (m) *' : 'Length (m) *'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={barnLengthM}
                    onChange={(e) => setBarnLengthM(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                    {language === 'es' ? 'Ancho Techado (m) *' : 'Width (m) *'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={barnWidthM}
                    onChange={(e) => setBarnWidthM(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                  />
                </div>
              </div>

              <div className="space-y-2 p-3 bg-[#F4EFE3]/80 dark:bg-[#141210]/60 rounded-[4px] border border-[#DDD4C4] dark:border-[#38342F]">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="barnVentilation"
                    checked={hasVentilation}
                    onChange={(e) => setHasVentilation(e.target.checked)}
                    className="w-4 h-4 text-[#8A4B2A] rounded"
                  />
                  <label htmlFor="barnVentilation" className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] cursor-pointer">
                    {language === 'es' ? 'Equipado con Extractores / Ventilación Forzada' : 'Equipped with Exhaust Fans / Forced Ventilation'}
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="barnCooling"
                    checked={hasCooling}
                    onChange={(e) => setHasCooling(e.target.checked)}
                    className="w-4 h-4 text-[#8A4B2A] rounded"
                  />
                  <label htmlFor="barnCooling" className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] cursor-pointer">
                    {language === 'es' ? 'Equipado con Paneles Evaporativos (Cooling Pads)' : 'Equipped with Evaporative Cooling Pads'}
                  </label>
                </div>
              </div>

              <div className="bg-[#FAF2EB] dark:bg-[#201712] border border-[#8A4B2A]/30 rounded-[4px] p-3 flex justify-between items-center text-xs">
                <span className="font-semibold text-[#1F1D1A] dark:text-[#EDE6DA]">
                  {language === 'es' ? 'Área Total Techada:' : 'Total Roofed Area:'}
                </span>
                <span className="font-serif font-bold text-base text-[#8A4B2A] dark:text-[#E0A882]">
                  {previewBarnArea} m²
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2D9CA] dark:border-[#332E27]">
                <button
                  type="button"
                  onClick={() => setShowBarnModal(false)}
                  className="btn-secondary text-xs h-10 px-4"
                >
                  {t('btn_cancel')}
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs h-10 px-4"
                >
                  {language === 'es' ? 'Guardar Galpón' : 'Save Barn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear Corral con Aforo Zootécnico (HU-10) */}
      {showPenModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) setShowPenModal(false); }}
          className="fixed inset-0 z-50 bg-[#1F1D1A]/50 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="card-paper max-w-lg w-full p-6 space-y-4 shadow-xl border border-[#E2D9CA] dark:border-[#332E27] max-h-[90vh] overflow-y-auto cursor-default">
            <div className="border-b border-[#E2D9CA] dark:border-[#332E27] pb-2">
              <span className="notebook-stamp-terracotta text-[10px]">CÁLCULO ZOOTÉCNICO HU-10</span>
              <h3 className="text-lg font-serif font-bold text-[#1F1D1A] dark:text-[#EDE6DA] mt-1">
                {language === 'es' ? 'Aforo y Dimensionamiento de Corral' : 'Pen Sizing & Zootechnical Capacity'}
              </h3>
            </div>

            <form onSubmit={handleCreatePen} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                  {language === 'es' ? 'Galpón de Ubicación *' : 'Assigned Barn *'}
                </label>
                <select
                  value={selectedBarnIdForPen || (barns.length > 0 ? barns[0].id : '')}
                  onChange={(e) => setSelectedBarnIdForPen(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] focus:border-[#8A4B2A] outline-none text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                >
                  {barns.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.codeName} ({b.totalAreaM2} m²)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                    {language === 'es' ? 'Número o Identificador de Corral *' : 'Pen Identifier *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={penCode}
                    onChange={(e) => setPenCode(e.target.value)}
                    placeholder="ej. Corral 01"
                    className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] focus:border-[#8A4B2A] outline-none text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                    {language === 'es' ? 'Etapa Productiva / Destino' : 'Production Phase'}
                  </label>
                  <select
                    value={penPhase}
                    onChange={(e) => setPenPhase(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] focus:border-[#8A4B2A] outline-none text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                  >
                    <option value="precebo">Precebo (0.35 m²/lechón)</option>
                    <option value="levante">Levante (0.65 m²/cerdo)</option>
                    <option value="ceba">Ceba / Finalización (1.00 m²/cerdo)</option>
                    <option value="maternidad">Maternidad (4.50 m²/cerda)</option>
                    <option value="gestacion">Gestación (2.25 m²/cerda)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                    {language === 'es' ? 'Largo (m) *' : 'Length (m) *'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    value={penLengthM}
                    onChange={(e) => setPenLengthM(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                    {language === 'es' ? 'Ancho (m) *' : 'Width (m) *'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    value={penWidthM}
                    onChange={(e) => setPenWidthM(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                    {language === 'es' ? 'Tipo Bebedero' : 'Drinker Type'}
                  </label>
                  <select
                    value={drinkerType}
                    onChange={(e) => setDrinkerType(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                  >
                    <option value="nipple">Chupón / Nipple</option>
                    <option value="cup">Cazoleta / Bowl</option>
                    <option value="trough">Canoa corrida</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                    {language === 'es' ? 'Nº Bebederos' : 'Drinkers'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={drinkerCount}
                    onChange={(e) => setDrinkerCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                    {language === 'es' ? 'Bocas Comedero' : 'Feeder Spaces'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={feederSpaces}
                    onChange={(e) => setFeederSpaces(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                  />
                </div>
              </div>

              {/* Caja de Cálculo Dinámico en Vivo Aforo HU-10 */}
              <div className="bg-[#FAF2EB] dark:bg-[#201712] border border-[#8A4B2A]/30 rounded-[4px] p-4 space-y-2">
                <span className="notebook-stamp-terracotta text-[10px]">CÁLCULO ZOOTÉCNICO ICA/FAO</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[#666159] dark:text-[#9E9689] block">Área Útil Corral:</span>
                    <span className="font-serif font-bold text-base text-[#1F1D1A] dark:text-[#EDE6DA]">{previewPenArea} m²</span>
                  </div>
                  <div>
                    <span className="text-[#666159] dark:text-[#9E9689] block">Densidad Requerida:</span>
                    <span className="font-serif font-bold text-base text-[#1F1D1A] dark:text-[#EDE6DA]">{previewReqDensity} m²/cerdo</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-[#8A4B2A]/20 flex justify-between items-center text-xs">
                  <span className="font-semibold text-[#1F1D1A] dark:text-[#EDE6DA]">
                    {language === 'es' ? 'Aforo Máximo de Carga:' : 'Max Safe Stocking Capacity:'}
                  </span>
                  <span className="font-serif font-bold text-lg text-[#8A4B2A] dark:text-[#E0A882]">
                    {previewPenCapacity} {language === 'es' ? 'cabezas' : 'heads'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2D9CA] dark:border-[#332E27]">
                <button
                  type="button"
                  onClick={() => setShowPenModal(false)}
                  className="btn-secondary text-xs h-10 px-4"
                >
                  {t('btn_cancel')}
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs h-10 px-4"
                >
                  {language === 'es' ? 'Guardar Corral' : 'Save Pen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
