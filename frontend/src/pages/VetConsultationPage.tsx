import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  FileText,
  Fish,
  Pill,
  Microscope,
  History,
  Send,
  RefreshCw,
  Info,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { api } from '../services/api';
import { Farm, Batch, VetConsultation, CreateVetConsultationRequest } from '../types';
import { useTranslation } from '../context/LanguageContext';

export const VetConsultationPage: React.FC = () => {
  const { t, language } = useTranslation();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [productionType, setProductionType] = useState<'PISCICULTURA' | 'PORCICULTURA'>('PISCICULTURA');
  const [symptomsText, setSymptomsText] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [consultationResult, setConsultationResult] = useState<VetConsultation | null>(null);
  const [pastConsultations, setPastConsultations] = useState<VetConsultation[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [completedChecklist, setCompletedChecklist] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedFarmId) {
      loadBatchesAndHistory(selectedFarmId);
    }
  }, [selectedFarmId]);

  const loadInitialData = async () => {
    try {
      const farmsData = await api.getFarms();
      setFarms(farmsData);
      if (farmsData.length > 0) {
        setSelectedFarmId(farmsData[0].id);
      }
    } catch (e) {
      console.error('Error al cargar granjas:', e);
    }
  };

  const loadBatchesAndHistory = async (farmId: string) => {
    try {
      const b = await api.getBatchesByFarm(farmId);
      setBatches(b);
      if (b.length > 0) {
        setSelectedBatchId(b[0].id);
        const isSwine = b[0].penId != null || b[0].speciesCommonName.toLowerCase().includes('cerd');
        setProductionType(isSwine ? 'PORCICULTURA' : 'PISCICULTURA');
      } else {
        setSelectedBatchId('');
      }

      try {
        const history = await api.getVetConsultationsByFarm(farmId);
        setPastConsultations(history);
      } catch (err) {
        // Ignorar si aún no hay historial en el servidor
        setPastConsultations([]);
      }
    } catch (e) {
      console.error('Error al cargar lotes e historial:', e);
    }
  };

  const handleBatchChange = (batchId: string) => {
    setSelectedBatchId(batchId);
    const b = batches.find((x) => x.id === batchId);
    if (b) {
      const isSwine = b.penId != null || b.speciesCommonName.toLowerCase().includes('cerd');
      setProductionType(isSwine ? 'PORCICULTURA' : 'PISCICULTURA');
    }
  };

  const quickSymptomsFish = [
    { label: 'Nado en espiral / Ojos saltones', query: 'Peces con nado errático en espiral, exoftalmia severa (ojos saltones), vientre hinchado y opacidad corneal.' },
    { label: 'Boqueo masivo en superficie', query: 'Boqueo masivo en la superficie del estanque al amanecer, boca abierta y falta de apetito generalizada.' },
    { label: 'Manchas blancas silla de montar', query: 'Lesiones blanquecinas en el dorso tipo silla de montar, aletas erosionadas deshilachadas y branquias marrones.' },
    { label: 'Puntos blancos tipo granos de sal', query: 'Puntos blancos diminutos en piel y aletas, peces frotándose intensamente contra las orillas y geomembrana.' },
    { label: 'Algodoncillo en heridas', query: 'Masas algodonosas blanquecinas en piel y aletas tras manipulación en muestreo biométrico.' }
  ];

  const quickSymptomsSwine = [
    { label: 'Manchas rojas en diamante / Fiebre', query: 'Cerdos con lesiones cutáneas eritematosas en forma de rombo o diamante, fiebre alta (>40.5 °C), cojera y rigidez.' },
    { label: 'Tos seca espasmódica / Retraso', query: 'Tos seca no productiva tipo perruna, pelo hirsuto erizado, retraso marcado en crecimiento y aumento del FCR.' },
    { label: 'Jadeo continuo / Estrés por calor', query: 'Cerdos con jadeo extremo con la boca abierta, saliva espumosa en el hocico y decúbito lateral en horas calurosas.' },
    { label: 'Oreja azul / Cianosis respiratoria', query: 'Cianosis azulada en orejas y hocico, disnea respiratoria aguda, postración y lechones débiles en maternidad.' },
    { label: 'Diarrea acuosa amarillenta', query: 'Diarrea acuosa amarillenta en lechones lactantes, deshidratación rápida y ojos hundidos.' }
  ];

  const handleQuickTagClick = (query: string) => {
    if (!symptomsText.trim()) {
      setSymptomsText(query);
    } else {
      setSymptomsText((prev) => `${prev}. ${query}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmId) {
      setErrorMsg(language === 'es' ? 'Selecciona una granja' : 'Select a farm');
      return;
    }
    if (symptomsText.trim().length < 10) {
      setErrorMsg(
        language === 'es'
          ? 'Por favor describe los síntomas con al menos 10 caracteres'
          : 'Please describe the symptoms in at least 10 characters'
      );
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg(null);

      const requestPayload: CreateVetConsultationRequest = {
        farmId: selectedFarmId,
        batchId: selectedBatchId || undefined,
        productionType,
        symptomsDescription: symptomsText.trim()
      };

      let result: VetConsultation;
      try {
        result = await api.createVetConsultation(requestPayload);
      } catch (networkErr) {
        // Fallback local en caso de desconexión en campo
        console.warn('Backend inalcanzable, ejecutando triaje clínico zootécnico local:', networkErr);
        result = generateOfflineClinicalDiagnosis(requestPayload);
      }

      setConsultationResult(result);
      setPastConsultations((prev) => [result, ...prev]);
      setCompletedChecklist({});
    } catch (err: any) {
      console.error('Error al procesar consulta:', err);
      setErrorMsg(language === 'es' ? 'Error al emitir dictamen clínico' : 'Error processing clinical report');
    } finally {
      setIsLoading(false);
    }
  };

  // Motor clínico de contingencia offline si el dispositivo pierde señal en campo
  const generateOfflineClinicalDiagnosis = (req: CreateVetConsultationRequest): VetConsultation => {
    const text = req.symptomsDescription.toLowerCase();
    const isSwine = req.productionType === 'PORCICULTURA';

    if (isSwine) {
      if (text.includes('diamante') || text.includes('rombo') || text.includes('cojera')) {
        return {
          id: `local-vet-${Date.now()}`,
          farmId: req.farmId,
          batchId: req.batchId,
          productionType: 'PORCICULTURA',
          symptomsDescription: req.symptomsDescription,
          presumptiveDiagnosis: 'Erisipela Porcina / Mal Rojo (Erysipelothrix rhusiopathiae)',
          urgencyLevel: 'HIGH',
          confidencePercentage: 88.5,
          biosecurityProtocol: '1. Trasladar a los ejemplares con manchas al corral de enfermería.\n2. Retirar y desinfectar camas de viruta.\n3. Lavado con desinfectante alcalino.',
          treatmentRecommendation: 'Penicilina G Procaínica (20,000 UI/kg IM cada 24 h por 3-5 días) bajo supervisión veterinaria. TIEMPO DE RETIRO: Mínimo 14 días previo a beneficio.',
          samplingInstructions: 'Biopsia de piel de los bordes de la lesión para cultivo bacteriano.',
          differentials: [
            { diseaseName: 'Erisipela Porcina', pathogen: 'Erysipelothrix rhusiopathiae', matchProbability: 88.5, keyIndicator: 'Lesiones geométricas en diamante' },
            { diseaseName: 'Peste Porcina Clásica', pathogen: 'Pestivirus', matchProbability: 55.0, keyIndicator: 'Hemorragias petequiales' }
          ],
          veterinarianReviewed: false,
          createdAt: new Date().toISOString()
        };
      }
      return {
        id: `local-vet-${Date.now()}`,
        farmId: req.farmId,
        batchId: req.batchId,
        productionType: 'PORCICULTURA',
        symptomsDescription: req.symptomsDescription,
        presumptiveDiagnosis: 'Complejo Respiratorio Porcino / Neumonía',
        urgencyLevel: 'HIGH',
        confidencePercentage: 82.0,
        biosecurityProtocol: '1. Aumentar ventilación de cortinas laterales.\n2. Controlar amoníaco por debajo de 10 ppm.\n3. Evitar corrientes de aire frío directo.',
        treatmentRecommendation: 'Tratamiento con Tilosina o Doxiciclina en alimento o agua. Revisar con veterinario.',
        samplingInstructions: 'Inspección de lesiones pulmonares y toma de frotis bronquial.',
        differentials: [
          { diseaseName: 'Neumonía Enzoótica', pathogen: 'Mycoplasma hyopneumoniae', matchProbability: 82.0, keyIndicator: 'Tos seca persistente' }
        ],
        veterinarianReviewed: false,
        createdAt: new Date().toISOString()
      };
    } else {
      // Piscicultura
      if (text.includes('espiral') || text.includes('ojo') || text.includes('salton') || text.includes('exoftalmia')) {
        return {
          id: `local-vet-${Date.now()}`,
          farmId: req.farmId,
          batchId: req.batchId,
          productionType: 'PISCICULTURA',
          symptomsDescription: req.symptomsDescription,
          presumptiveDiagnosis: 'Estreptococosis de los Peces (Streptococcus agalactiae / iniae)',
          urgencyLevel: 'CRITICAL',
          confidencePercentage: 91.0,
          biosecurityProtocol: '1. Cuarentena estricta del estanque. No transvasar agua ni peces a otros estanques.\n2. Desinfectar salabardos, redes y botas con amonio cuaternario.\n3. Reducir la ración de alimento al 50% de inmediato.\n4. Recoger peces muertos dos veces al día para compostaje o descarte profundo.',
          treatmentRecommendation: 'Florfenicol oral (10 mg/kg de biomasa viva/día durante 10 días). ADVERTENCIA ICA: Cumplir retiro obligatorio de 21 días antes de cosecha comercial.',
          samplingInstructions: 'Remitir 5 ejemplares moribundos en refrigeración (4°C) al laboratorio oficial ICA. Órganos diana: encéfalo, bazo y riñón anterior.',
          differentials: [
            { diseaseName: 'Estreptococosis Íctica', pathogen: 'Streptococcus agalactiae', matchProbability: 91.0, keyIndicator: 'Nado en tirabuzón y exoftalmia' },
            { diseaseName: 'Columnariasis', pathogen: 'Flavobacterium columnare', matchProbability: 48.0, keyIndicator: 'Necrosis cutánea' }
          ],
          veterinarianReviewed: false,
          createdAt: new Date().toISOString()
        };
      }
      return {
        id: `local-vet-${Date.now()}`,
        farmId: req.farmId,
        batchId: req.batchId,
        productionType: 'PISCICULTURA',
        symptomsDescription: req.symptomsDescription,
        presumptiveDiagnosis: 'Hipoxia y Déficit de Oxígeno Disuelto en Agua',
        urgencyLevel: 'CRITICAL',
        confidencePercentage: 94.0,
        biosecurityProtocol: '1. ENCENDER INMEDIATAMENTE AIREADORES al 100% de potencia.\n2. Abrir compuertas de recambio de agua fresca superficial.\n3. SUSPENDER TOTALMENTE LA ALIMENTACIÓN hasta restablecer > 4.5 mg/L de oxígeno.',
        treatmentRecommendation: 'No suministrar alimento. Cal agrícola al estanque si el pH está bajo.',
        samplingInstructions: 'Medición in situ de OD horaria con oxímetro digital.',
        differentials: [
          { diseaseName: 'Hipoxia Severa', pathogen: 'Físico-Químico (OD < 2.0 mg/L)', matchProbability: 94.0, keyIndicator: 'Boqueo masivo en superficie matutino' }
        ],
        veterinarianReviewed: false,
        createdAt: new Date().toISOString()
      };
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] text-xs font-serif font-bold bg-[#A32A26]/15 text-[#A32A26] dark:text-[#E07A76] border border-[#A32A26]/30">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>URGENCIA CRÍTICA</span>
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] text-xs font-serif font-bold bg-[#8A4B2A]/15 text-[#8A4B2A] dark:text-[#D99675] border border-[#8A4B2A]/30">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>URGENCIA ALTA</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] text-xs font-serif font-bold bg-[#3B5568]/15 text-[#3B5568] dark:text-[#8EA8BA] border border-[#3B5568]/30">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>MODERADA / SEGUIMIENTO</span>
          </span>
        );
    }
  };

  const selectedBatchObj = batches.find((b) => b.id === selectedBatchId);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-7">
      {/* Cabecera Estilo Cuaderno / Folio Clínico */}
      <div className="border-b border-[#E2D9CA] dark:border-[#332E27] pb-4 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="notebook-stamp">
              {language === 'es' ? 'CONSULTORIO VETERINARIO IA' : 'AI VET CLINIC'}
            </span>
            <span className="text-xs text-[#666159] dark:text-[#9E9689] uppercase tracking-wider font-mono">
              FOLIO VET #012 • HU-12
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#1F1D1A] dark:text-[#EDE6DA] font-semibold tracking-tight flex items-center gap-2.5">
            <Stethoscope className="w-7 h-7 text-[#2E4A36] dark:text-[#86A98F]" />
            <span>
              {language === 'es' ? 'Triaje Sanitario & Diagnóstico Asistido' : 'Zootechnical Triage & Assisted Diagnosis'}
            </span>
          </h1>
          <p className="text-sm text-[#666159] dark:text-[#9E9689] mt-0.5 max-w-2xl">
            {language === 'es'
              ? 'Evaluación patológica diferencial en tiempo real para peces y cerdos con protocolos inmediatos de bioseguridad y retiro ICA.'
              : 'Real-time differential pathology assessment for aquaculture and swine with emergency biosecurity protocols.'}
          </p>
        </div>

        {pastConsultations.length > 0 && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="btn-secondary text-xs sm:text-sm px-3.5 h-10 inline-flex items-center gap-1.5 self-start sm:self-auto"
          >
            <History className="w-4 h-4 text-[#8A4B2A] dark:text-[#D99675]" />
            <span>
              {showHistory
                ? (language === 'es' ? 'Ocultar Historial' : 'Hide History')
                : `${language === 'es' ? 'Historial Granja' : 'Farm History'} (${pastConsultations.length})`}
            </span>
            {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Historial Plegable de Consultas */}
      {showHistory && pastConsultations.length > 0 && (
        <div className="card-paper p-4 space-y-3 border-l-4 border-l-[#8A4B2A]">
          <div className="flex items-center justify-between border-b border-[#E2D9CA] dark:border-[#332E27] pb-2">
            <h3 className="font-serif font-semibold text-sm text-[#1F1D1A] dark:text-[#EDE6DA] flex items-center gap-2">
              <History className="w-4 h-4 text-[#8A4B2A]" />
              <span>{language === 'es' ? 'Expedientes Clínicos Anteriores en Esta Granja' : 'Past Clinical Records'}</span>
            </h3>
            <span className="text-xs font-mono text-[#666159]">
              {pastConsultations.length} {language === 'es' ? 'consultas registradas' : 'consultations'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pastConsultations.map((item) => (
              <div
                key={item.id}
                onClick={() => setConsultationResult(item)}
                className="cursor-pointer p-3 rounded-[4px] border border-[#E2D9CA] dark:border-[#332E27] bg-[#FAF6EE] dark:bg-[#1A1815] hover:border-[#2E4A36] transition space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-[#8A4B2A] font-semibold">{item.batchCode || item.productionType}</span>
                  <span className="text-[#666159]">{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
                <h4 className="font-serif font-bold text-xs text-[#1F1D1A] dark:text-[#EDE6DA] line-clamp-1">
                  {item.presumptiveDiagnosis}
                </h4>
                <div className="flex items-center justify-between text-[10px]">
                  {getUrgencyBadge(item.urgencyLevel)}
                  <span className="font-mono font-medium text-[#2E4A36] dark:text-[#86A98F]">
                    {item.confidencePercentage}% conf.
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid de 2 Columnas: Formulario de Consulta (Izquierda) + Ficha Clínica Dictamen (Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Formulario de Entrada Clínica (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <form onSubmit={handleSubmit} className="card-paper p-5 space-y-4">
            <div className="border-b border-[#E2D9CA] dark:border-[#332E27] pb-3">
              <span className="notebook-stamp text-[10px]">REPORTE DE CAMPO</span>
              <h2 className="font-serif font-semibold text-base text-[#1F1D1A] dark:text-[#EDE6DA] mt-1">
                {language === 'es' ? 'Descripción de Signos Clínicos' : 'Clinical Signs Description'}
              </h2>
              <p className="text-xs text-[#666159] dark:text-[#9E9689] mt-0.5">
                {language === 'es'
                  ? 'Describe el comportamiento, anomalías visuales y estado de los animales.'
                  : 'Describe behavior, lesions, or environmental abnormalities observed.'}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-[4px] bg-[#A32A26]/10 border border-[#A32A26]/30 text-xs text-[#A32A26] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Selector de Granja */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#1F1D1A] dark:text-[#EDE6DA]">
                {language === 'es' ? 'Granja / Unidad Productiva' : 'Farm / Productive Unit'}
              </label>
              <select
                value={selectedFarmId}
                onChange={(e) => setSelectedFarmId(e.target.value)}
                className="input-field w-full text-xs"
                required
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} {f.location ? `(${f.location})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de Sistema Productivo */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#1F1D1A] dark:text-[#EDE6DA]">
                {language === 'es' ? 'Especie / Rama Zootécnica' : 'Species / Production Line'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setProductionType('PISCICULTURA')}
                  className={`h-10 px-3 rounded-[4px] border text-xs font-medium flex items-center justify-center gap-2 transition ${
                    productionType === 'PISCICULTURA'
                      ? 'bg-[#3B5568] text-white border-[#3B5568]'
                      : 'bg-white dark:bg-[#1E1B18] border-[#E2D9CA] dark:border-[#332E27] text-[#666159] hover:bg-[#F4EFE3]'
                  }`}
                >
                  <Fish className="w-4 h-4" />
                  <span>Piscicultura (Peces)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProductionType('PORCICULTURA')}
                  className={`h-10 px-3 rounded-[4px] border text-xs font-medium flex items-center justify-center gap-2 transition ${
                    productionType === 'PORCICULTURA'
                      ? 'bg-[#8A4B2A] text-white border-[#8A4B2A]'
                      : 'bg-white dark:bg-[#1E1B18] border-[#E2D9CA] dark:border-[#332E27] text-[#666159] hover:bg-[#F4EFE3]'
                  }`}
                >
                  <span className="font-serif font-bold text-sm">🐖</span>
                  <span>Porcicultura (Cerdos)</span>
                </button>
              </div>
            </div>

            {/* Selector de Lote (Opcional) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#1F1D1A] dark:text-[#EDE6DA]">
                  {language === 'es' ? 'Lote Afectado (Opcional)' : 'Affected Batch (Optional)'}
                </label>
                {selectedBatchObj && (
                  <span className="text-[10px] font-mono text-[#666159]">
                    {selectedBatchObj.speciesCommonName} • {selectedBatchObj.pondCodeName || (selectedBatchObj.penCode ? `Corral ${selectedBatchObj.penCode}` : '')}
                  </span>
                )}
              </div>
              <select
                value={selectedBatchId}
                onChange={(e) => handleBatchChange(e.target.value)}
                className="input-field w-full text-xs"
              >
                <option value="">{language === 'es' ? '-- Ninguno (Consulta General) --' : '-- General Inspection --'}</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batchCode} - {b.speciesCommonName} ({b.pondCodeName || (b.penCode ? `Corral ${b.penCode}` : 'Instalación')})
                  </option>
                ))}
              </select>
            </div>

            {/* Botones de Síntomas Frecuentes / Atajos de Campo */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-[#666159] dark:text-[#9E9689]">
                {language === 'es' ? 'Signos Típicos en Campo (Clic para agregar)' : 'Common Signs (Click to append)'}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(productionType === 'PISCICULTURA' ? quickSymptomsFish : quickSymptomsSwine).map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickTagClick(item.query)}
                    className="text-[11px] px-2.5 py-1 rounded-[3px] border border-[#E2D9CA] dark:border-[#332E27] bg-[#F4EFE3]/60 dark:bg-[#201D1A] text-[#1F1D1A] dark:text-[#EDE6DA] hover:bg-[#2E4A36] hover:text-white transition"
                  >
                    + {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Área de Texto Detallada */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#1F1D1A] dark:text-[#EDE6DA]">
                {language === 'es' ? 'Observaciones Detalladas de los Síntomas' : 'Detailed Observations'}
              </label>
              <textarea
                value={symptomsText}
                onChange={(e) => setSymptomsText(e.target.value)}
                rows={5}
                placeholder={
                  productionType === 'PISCICULTURA'
                    ? 'Ej: Tilapias nadando en la superficie con ojos saltones, desorientadas, piel con zonas blanquecinas y rechazo al alimento balanceado desde ayer...'
                    : 'Ej: Cerdos en corral de levante con tos seca espasmódica, fiebre de 40.5 °C, postrados sin levantarse al comedero y manchas violáceas...'
                }
                className="input-field w-full text-xs font-mono leading-relaxed"
                required
              />
              <span className="text-[10px] text-[#666159] dark:text-[#9E9689] block text-right">
                {symptomsText.length} caracteres
              </span>
            </div>

            {/* Botón de Envío */}
            <button
              type="submit"
              disabled={isLoading || symptomsText.trim().length < 5}
              className="btn-primary w-full h-12 text-sm flex items-center justify-center gap-2 font-serif font-bold shadow-xs disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{language === 'es' ? 'Analizando Patología con IA...' : 'Analyzing Pathology...'}</span>
                </>
              ) : (
                <>
                  <Stethoscope className="w-4 h-4" />
                  <span>{language === 'es' ? 'Consultar Diagnóstico Zootécnico IA' : 'Run Zootechnical Diagnosis'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Columna Derecha: Ficha Clínica Dictamen (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {!consultationResult ? (
            <div className="card-notebook p-8 text-center space-y-3">
              <Stethoscope className="w-12 h-12 text-[#2E4A36] dark:text-[#86A98F] mx-auto opacity-40" />
              <h3 className="font-serif font-semibold text-lg text-[#1F1D1A] dark:text-[#EDE6DA]">
                {language === 'es' ? 'Ficha de Consulta Sanitaria Vacía' : 'No Active Consultation'}
              </h3>
              <p className="text-xs text-[#666159] dark:text-[#9E9689] max-w-md mx-auto leading-relaxed">
                {language === 'es'
                  ? 'Selecciona una granja, describe los signos observados en tus estanques o galpones, y el asistente zootécnico emitirá un diagnóstico diferencial preliminar con protocolo de bioseguridad.'
                  : 'Select a farm, describe the clinical symptoms, and the veterinary assistant will deliver an immediate differential diagnosis.'}
              </p>
            </div>
          ) : (
            <div className="card-paper p-6 space-y-5 border-t-4 border-t-[#2E4A36]">
              {/* Encabezado del Dictamen */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#E2D9CA] dark:border-[#332E27] pb-3 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="notebook-stamp text-[10px]">DICTAMEN CLÍNICO PRELIMINAR</span>
                    <span className="text-[11px] font-mono text-[#666159]">
                      {new Date(consultationResult.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[#1F1D1A] dark:text-[#EDE6DA] mt-1">
                    {consultationResult.presumptiveDiagnosis}
                  </h3>
                </div>
                <div>{getUrgencyBadge(consultationResult.urgencyLevel)}</div>
              </div>

              {/* Barra de Concordancia / Certeza */}
              <div className="p-3 rounded-[4px] bg-[#FAF6EE] dark:bg-[#1A1815] border border-[#E2D9CA] dark:border-[#332E27] space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#1F1D1A] dark:text-[#EDE6DA] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2E4A36] dark:text-[#86A98F]" />
                    <span>{language === 'es' ? 'Índice de Concordancia Clínica Estimado' : 'Clinical Match Index'}</span>
                  </span>
                  <span className="font-serif font-bold text-sm text-[#2E4A36] dark:text-[#86A98F] metric-number">
                    {consultationResult.confidencePercentage}%
                  </span>
                </div>
                <div className="w-full bg-[#E2D9CA] dark:bg-[#332E27] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#2E4A36] h-full transition-all duration-500"
                    style={{ width: `${Math.min(100, consultationResult.confidencePercentage)}%` }}
                  />
                </div>
              </div>

              {/* Diagnósticos Diferenciales Evaluados */}
              {consultationResult.differentials && consultationResult.differentials.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-[#666159] dark:text-[#9E9689] flex items-center gap-1.5">
                    <Microscope className="w-3.5 h-3.5 text-[#3B5568]" />
                    <span>{language === 'es' ? 'Diagnósticos Diferenciales Zootécnicos' : 'Differential Diagnoses'}</span>
                  </h4>
                  <div className="divide-y divide-[#E2D9CA] dark:divide-[#332E27] border border-[#E2D9CA] dark:border-[#332E27] rounded-[4px] overflow-hidden text-xs">
                    {consultationResult.differentials.map((diff, index) => (
                      <div key={index} className="p-2.5 bg-white dark:bg-[#1E1B18] flex items-center justify-between">
                        <div>
                          <p className="font-serif font-semibold text-[#1F1D1A] dark:text-[#EDE6DA]">
                            {diff.diseaseName}
                          </p>
                          <p className="text-[11px] text-[#666159] dark:text-[#9E9689] italic">
                            Agente: {diff.pathogen} • {diff.keyIndicator}
                          </p>
                        </div>
                        <span className="notebook-stamp text-[10px] font-mono">
                          {diff.matchProbability}% prob.
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Protocolo de Bioseguridad y Contingencia Inmediata */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-[#A32A26] dark:text-[#E07A76] flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{language === 'es' ? 'Acciones Inmediatas de Bioseguridad en Campo' : 'Immediate Biosecurity Actions'}</span>
                </h4>
                <div className="p-3.5 rounded-[4px] bg-[#A32A26]/5 border border-[#A32A26]/20 space-y-2 text-xs">
                  {consultationResult.biosecurityProtocol.split('\n').map((step, idx) => (
                    <label
                      key={idx}
                      className="flex items-start gap-2.5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 p-1 rounded transition select-none"
                    >
                      <input
                        type="checkbox"
                        checked={!!completedChecklist[`step-${idx}`]}
                        onChange={(e) =>
                          setCompletedChecklist((prev) => ({
                            ...prev,
                            [`step-${idx}`]: e.target.checked
                          }))
                        }
                        className="mt-0.5 rounded-[3px] accent-[#2E4A36] w-4 h-4"
                      />
                      <span
                        className={`leading-relaxed ${
                          completedChecklist[`step-${idx}`]
                            ? 'line-through text-[#666159] dark:text-[#9E9689]'
                            : 'text-[#1F1D1A] dark:text-[#EDE6DA]'
                        }`}
                      >
                        {step}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tratamiento y Manejo Zootécnico Sugerido */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-[#2E4A36] dark:text-[#86A98F] flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5" />
                  <span>{language === 'es' ? 'Terapia de Soporte & Medicación Regulada' : 'Therapeutic Guidelines'}</span>
                </h4>
                <div className="p-3.5 rounded-[4px] bg-[#F4EFE3]/80 dark:bg-[#1C1A17] border border-[#E2D9CA] dark:border-[#332E27] space-y-2 text-xs leading-relaxed text-[#1F1D1A] dark:text-[#EDE6DA]">
                  <p className="whitespace-pre-line">{consultationResult.treatmentRecommendation}</p>
                </div>
              </div>

              {/* Protocolo de Muestreo / Remisión ICA */}
              {consultationResult.samplingInstructions && (
                <div className="space-y-1 text-xs">
                  <span className="font-semibold text-[#1F1D1A] dark:text-[#EDE6DA] flex items-center gap-1">
                    <Microscope className="w-3.5 h-3.5 text-[#3B5568]" />
                    <span>{language === 'es' ? 'Toma y Remisión de Muestras Oficiales (ICA/Laboratorio):' : 'Official Laboratory Protocol:'}</span>
                  </span>
                  <p className="text-[#666159] dark:text-[#9E9689] italic pl-5">
                    {consultationResult.samplingInstructions}
                  </p>
                </div>
              )}

              {/* Advertencia Legal Zootécnica */}
              <div className="pt-2 border-t border-[#E2D9CA] dark:border-[#332E27] flex items-center gap-2 text-[11px] text-[#666159] dark:text-[#9E9689]">
                <Info className="w-4 h-4 text-[#8A4B2A] shrink-0" />
                <span>
                  {language === 'es'
                    ? 'Aviso legal: Este dictamen es un triaje preliminar algorítmico y no reemplaza la necropsia ni la prescripción médica de un veterinario colegiado.'
                    : 'Disclaimer: This report is a preliminary decision-support triage and does not replace official on-site veterinary inspection.'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
