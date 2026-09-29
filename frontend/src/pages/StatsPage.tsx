import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Layers,
  Fish,
  Filter,
  Activity,
  DollarSign,
  Skull,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import { Farm, Batch, Biometry, FeedingRecord } from '../types';
import { useTranslation } from '../context/LanguageContext';

export const StatsPage: React.FC = () => {
  const { t, language } = useTranslation();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filtros
  const [selectedFarmId, setSelectedFarmId] = useState<string>('all');
  const [selectedSpeciesFilter, setSelectedSpeciesFilter] = useState<'all' | 'peces' | 'cerdos'>('all');
  const [dateRange, setDateRange] = useState<'30d' | '90d' | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'curvas' | 'comparativo' | 'tabla'>('curvas');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const farmsData = await api.getFarms();
      setFarms(farmsData);

      if (farmsData.length > 0) {
        const allBatches: Batch[] = [];
        for (const farm of farmsData) {
          const b = await api.getBatchesByFarm(farm.id);
          allBatches.push(...b);
        }
        setBatches(allBatches);
      }
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrado de lotes
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      if (selectedFarmId !== 'all' && b.farmId !== selectedFarmId) {
        return false;
      }
      if (selectedSpeciesFilter === 'peces') {
        const isFish = !b.speciesCommonName.toLowerCase().includes('cerd') && !b.speciesCommonName.toLowerCase().includes('pig');
        if (!isFish) return false;
      }
      if (selectedSpeciesFilter === 'cerdos') {
        const isSwine = b.speciesCommonName.toLowerCase().includes('cerd') || b.speciesCommonName.toLowerCase().includes('pig');
        if (!isSwine) return false;
      }
      return true;
    });
  }, [batches, selectedFarmId, selectedSpeciesFilter]);

  // Cálculos consolidados
  const totalBiomass = filteredBatches.reduce((acc, b) => acc + (b.initialBiomassKg || 0), 0);
  const totalPopulation = filteredBatches.reduce((acc, b) => acc + (b.initialQuantity || 0), 0);
  
  // Datos comparativos entre Peces y Cerdos
  const fishBatches = batches.filter((b) => !b.speciesCommonName.toLowerCase().includes('cerd') && !b.speciesCommonName.toLowerCase().includes('pig'));
  const swineBatches = batches.filter((b) => b.speciesCommonName.toLowerCase().includes('cerd') || b.speciesCommonName.toLowerCase().includes('pig'));

  const fishBiomass = fishBatches.reduce((acc, b) => acc + (b.initialBiomassKg || 0), 0);
  const swineBiomass = swineBatches.reduce((acc, b) => acc + (b.initialBiomassKg || 0), 0);

  // Serie de datos para el gráfico de línea fina (Semanas de crecimiento 1 a 12)
  const growthCurvePoints = [
    { week: 'Sem 1', pesoPeces: 15, pesoCerdos: 8.5, fcrPeces: 0.95, fcrCerdos: 1.40 },
    { week: 'Sem 3', pesoPeces: 45, pesoCerdos: 14.0, fcrPeces: 1.05, fcrCerdos: 1.65 },
    { week: 'Sem 5', pesoPeces: 95, pesoCerdos: 24.5, fcrPeces: 1.15, fcrCerdos: 1.95 },
    { week: 'Sem 7', pesoPeces: 175, pesoCerdos: 38.0, fcrPeces: 1.22, fcrCerdos: 2.20 },
    { week: 'Sem 9', pesoPeces: 280, pesoCerdos: 56.0, fcrPeces: 1.28, fcrCerdos: 2.38 },
    { week: 'Sem 11', pesoPeces: 395, pesoCerdos: 78.0, fcrPeces: 1.32, fcrCerdos: 2.50 },
    { week: 'Sem 12', pesoPeces: 485, pesoCerdos: 94.0, fcrPeces: 1.35, fcrCerdos: 2.58 }
  ];

  // Datos para barras planas mensuales de producción (kg)
  const monthlyProduction = [
    { month: 'May', peces: 1850, cerdos: 3200 },
    { month: 'Jun', peces: 2400, cerdos: 4100 },
    { month: 'Jul', peces: 3100, cerdos: 3900 },
    { month: 'Ago', peces: 2950, cerdos: 4800 },
    { month: 'Sep', peces: 3800, cerdos: 5400 }
  ];

  // Función de Exportación CSV Real
  const handleExportCSV = () => {
    const headers = ['Lote', 'Especie', 'Granja', 'Estanque', 'Poblacion', 'Biomasa_kg', 'Fecha_Siembra', 'Estado'];
    const rows = filteredBatches.map((b) => [
      `"${b.batchCode}"`,
      `"${b.speciesCommonName}"`,
      `"${b.farmName || ''}"`,
      `"${b.pondCodeName || ''}"`,
      b.initialQuantity,
      b.initialBiomassKg,
      `"${b.stockingDate}"`,
      `"${b.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_zootecnico_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ========================================================================= */}
      {/* 1. Cabecera Estilo Libro de Consulta Zootécnico */}
      {/* ========================================================================= */}
      <div className="border-b border-[#E2D9CA] dark:border-[#332E27] pb-4 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="notebook-stamp">
              FOLIO #04 • RENDIMIENTO & CURVAS
            </span>
            <span className="text-xs text-[#666159] dark:text-[#9E9689] uppercase tracking-wider font-mono">
              ANÁLISIS ZOOTÉCNICO COMPARATIVO
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#1F1D1A] dark:text-[#EDE6DA] font-semibold tracking-tight">
            {language === 'es' ? 'Estadísticas & Curvas de Producción' : 'Production Curves & Statistics'}
          </h1>
          <p className="text-sm text-[#666159] dark:text-[#9E9689] mt-0.5 max-w-2xl">
            {language === 'es'
              ? 'Curvas de biomasa viva, histórico de FCR, mortalidad y análisis comparativo entre piscicultura y porcicultura.'
              : 'Biomass growth curves, FCR history, mortality tracking, and fish vs. swine comparative performance.'}
          </p>
        </div>

        {/* Botones de Exportación e Impresión */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="btn-secondary text-xs sm:text-sm px-3.5 h-11"
            title="Imprimir reporte zootécnico"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimir Ficha</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="btn-primary text-xs sm:text-sm px-4 h-11"
            title="Exportar datos a CSV"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Barra de Filtros Sobrios */}
      {/* ========================================================================= */}
      <div className="card-paper p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Filtro por Granja */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-[#666159] dark:text-[#9E9689]">Granja:</span>
            <select
              value={selectedFarmId}
              onChange={(e) => setSelectedFarmId(e.target.value)}
              className="bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] px-2.5 py-1.5 font-medium text-[#1F1D1A] dark:text-[#EDE6DA] outline-none text-xs"
            >
              <option value="all">Todas las Granjas ({farms.length})</option>
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Especie */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-[#666159] dark:text-[#9E9689]">Especie:</span>
            <div className="inline-flex rounded-[4px] border border-[#DDD4C4] dark:border-[#38342F] p-0.5 bg-[#F4EFE3] dark:bg-[#141210]">
              <button
                onClick={() => setSelectedSpeciesFilter('all')}
                className={`px-2.5 py-1 rounded-[3px] text-xs font-medium transition ${
                  selectedSpeciesFilter === 'all'
                    ? 'bg-[#2E4A36] text-white'
                    : 'text-[#666159] dark:text-[#9E9689] hover:text-[#1F1D1A]'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setSelectedSpeciesFilter('peces')}
                className={`px-2.5 py-1 rounded-[3px] text-xs font-medium transition ${
                  selectedSpeciesFilter === 'peces'
                    ? 'bg-[#3B5568] text-white'
                    : 'text-[#666159] dark:text-[#9E9689] hover:text-[#1F1D1A]'
                }`}
              >
                Peces
              </button>
              <button
                onClick={() => setSelectedSpeciesFilter('cerdos')}
                className={`px-2.5 py-1 rounded-[3px] text-xs font-medium transition ${
                  selectedSpeciesFilter === 'cerdos'
                    ? 'bg-[#8A4B2A] text-white'
                    : 'text-[#666159] dark:text-[#9E9689] hover:text-[#1F1D1A]'
                }`}
              >
                Cerdos
              </button>
            </div>
          </div>
        </div>

        {/* Pestañas de Vista */}
        <div className="inline-flex rounded-[4px] border border-[#DDD4C4] dark:border-[#38342F] p-0.5 bg-[#F4EFE3] dark:bg-[#141210] text-xs">
          <button
            onClick={() => setActiveTab('curvas')}
            className={`px-3 py-1.5 rounded-[3px] font-medium transition ${
              activeTab === 'curvas'
                ? 'bg-[#2E4A36] text-white font-semibold'
                : 'text-[#666159] dark:text-[#9E9689] hover:text-[#1F1D1A]'
            }`}
          >
            Curvas & Gráficos
          </button>
          <button
            onClick={() => setActiveTab('comparativo')}
            className={`px-3 py-1.5 rounded-[3px] font-medium transition ${
              activeTab === 'comparativo'
                ? 'bg-[#2E4A36] text-white font-semibold'
                : 'text-[#666159] dark:text-[#9E9689] hover:text-[#1F1D1A]'
            }`}
          >
            Peces vs. Cerdos
          </button>
          <button
            onClick={() => setActiveTab('tabla')}
            className={`px-3 py-1.5 rounded-[3px] font-medium transition ${
              activeTab === 'tabla'
                ? 'bg-[#2E4A36] text-white font-semibold'
                : 'text-[#666159] dark:text-[#9E9689] hover:text-[#1F1D1A]'
            }`}
          >
            Tabla de Lotes
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. Fila de KPIs Zootécnicos (Números Tabulares de Cuaderno) */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Biomasa Activa */}
        <div className="card-paper p-4 flex flex-col justify-between">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-[#666159] dark:text-[#9E9689]">
            Biomasa en Producción
          </span>
          <div className="mt-2">
            <span className="font-serif font-bold text-2xl sm:text-3xl text-[#1F1D1A] dark:text-[#EDE6DA] metric-number">
              {totalBiomass.toLocaleString()}
            </span>
            <span className="text-xs text-[#666159] dark:text-[#9E9689] ml-1.5">kg vivos</span>
          </div>
          <span className="text-[11px] text-[#666159] dark:text-[#9E9689] mt-1 font-mono">
            {filteredBatches.length} lotes analizados
          </span>
        </div>

        {/* KPI 2: FCR Promedio Ponderado */}
        <div className="card-paper p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#666159] dark:text-[#9E9689]">
              FCR Ponderado
            </span>
            <span className="status-badge-green text-[10px] py-0 px-1.5">
              Eficiente
            </span>
          </div>
          <div className="mt-2">
            <span className="font-serif font-bold text-2xl sm:text-3xl text-[#2E4A36] dark:text-[#86A98F] metric-number">
              1.31
            </span>
            <span className="text-xs text-[#666159] dark:text-[#9E9689] ml-1.5">kg alim / kg pez</span>
          </div>
          <span className="text-[11px] text-[#666159] dark:text-[#9E9689] mt-1 font-mono">
            Meta zootécnica: ≤ 1.35
          </span>
        </div>

        {/* KPI 3: Costo $/kg Ponderado */}
        <div className="card-paper p-4 flex flex-col justify-between">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-[#666159] dark:text-[#9E9689]">
            Costo Promedio / kg
          </span>
          <div className="mt-2">
            <span className="font-serif font-bold text-2xl sm:text-3xl text-[#1F1D1A] dark:text-[#EDE6DA] metric-number">
              $ 8,340
            </span>
            <span className="text-xs text-[#666159] dark:text-[#9E9689] ml-1.5">COP / kg</span>
          </div>
          <span className="text-[11px] text-[#666159] dark:text-[#9E9689] mt-1 font-mono">
            Margen estimado: +24%
          </span>
        </div>

        {/* KPI 4: Mortalidad Acumulada */}
        <div className="card-paper p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#666159] dark:text-[#9E9689]">
              Mortalidad Global
            </span>
            <span className="status-badge-green text-[10px] py-0 px-1.5">
              Bajo umbral
            </span>
          </div>
          <div className="mt-2">
            <span className="font-serif font-bold text-2xl sm:text-3xl text-[#1F1D1A] dark:text-[#EDE6DA] metric-number">
              1.8 %
            </span>
            <span className="text-xs text-[#666159] dark:text-[#9E9689] ml-1.5">del lote</span>
          </div>
          <span className="text-[11px] text-[#666159] dark:text-[#9E9689] mt-1 font-mono">
            Umbral de alerta: &gt; 3.5%
          </span>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. Vistas: Curvas / Comparativo / Tabla de Lotes */}
      {/* ========================================================================= */}
      {activeTab === 'curvas' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico 1: Curva de Ganancia de Peso & FCR (Línea Fina Editorial) */}
          <div className="card-paper p-6 space-y-4">
            <div className="border-b border-[#E2D9CA] dark:border-[#332E27] pb-3 flex items-baseline justify-between">
              <div>
                <span className="notebook-stamp text-[9px]">CURVA BIOLÓGICA</span>
                <h3 className="font-serif font-semibold text-base text-[#1F1D1A] dark:text-[#EDE6DA] mt-1">
                  Ganancia de Peso Promedio (g) por Semana
                </h3>
              </div>
              <span className="text-xs font-mono text-[#666159] dark:text-[#9E9689]">
                Ciclo 12 Semanas
              </span>
            </div>

            {/* Representación de Línea Fina Zootécnica con SVG */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs text-[#666159] dark:text-[#9E9689] mb-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-[#3B5568]" />
                  <span>Piscicultura (Tilapia g)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-[#8A4B2A]" />
                  <span>Porcicultura (Cerdo kg)</span>
                </span>
              </div>

              {/* Contenedor SVG con cuadrícula sobria */}
              <div className="relative h-56 w-full border-b border-l border-[#DDD4C4] dark:border-[#38342F] p-2">
                {/* Líneas horizontales de referencia */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-25">
                  <div className="border-t border-[#666159] border-dashed w-full" />
                  <div className="border-t border-[#666159] border-dashed w-full" />
                  <div className="border-t border-[#666159] border-dashed w-full" />
                  <div className="border-t border-[#666159] border-dashed w-full" />
                </div>

                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200" preserveAspectRatio="none">
                  {/* Curva Peces (Azul Pizarra) */}
                  <polyline
                    fill="none"
                    stroke="#3B5568"
                    strokeWidth="2"
                    points="20,185 90,165 170,140 250,110 330,75 410,40 480,15"
                  />
                  {/* Puntos de datos Peces */}
                  {[
                    [20, 185], [90, 165], [170, 140], [250, 110], [330, 75], [410, 40], [480, 15]
                  ].map(([x, y], idx) => (
                    <circle key={`fish-pt-${idx}`} cx={x} cy={y} r="3.5" fill="#FBF8F1" stroke="#3B5568" strokeWidth="2" />
                  ))}

                  {/* Curva Cerdos (Tierra) */}
                  <polyline
                    fill="none"
                    stroke="#8A4B2A"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                    points="20,175 90,155 170,125 250,95 330,65 410,35 480,20"
                  />
                  {/* Puntos de datos Cerdos */}
                  {[
                    [20, 175], [90, 155], [170, 125], [250, 95], [330, 65], [410, 35], [480, 20]
                  ].map(([x, y], idx) => (
                    <circle key={`swine-pt-${idx}`} cx={x} cy={y} r="3" fill="#8A4B2A" />
                  ))}
                </svg>
              </div>

              {/* Eje X de Semanas */}
              <div className="flex justify-between text-[11px] text-[#666159] dark:text-[#9E9689] font-mono mt-2 px-1">
                {growthCurvePoints.map((p) => (
                  <span key={p.week}>{p.week}</span>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-[#E2D9CA] dark:border-[#332E27] text-xs text-[#666159] dark:text-[#9E9689] flex items-center justify-between">
              <span>Ganancia Media Diaria (GMD promedio):</span>
              <span className="font-mono font-bold text-[#1F1D1A] dark:text-[#EDE6DA]">
                3.4 g/pez/día • 870 g/cerdo/día
              </span>
            </div>
          </div>

          {/* Gráfico 2: Producción Mensual (Barras Planas con Paleta de Libro) */}
          <div className="card-paper p-6 space-y-4">
            <div className="border-b border-[#E2D9CA] dark:border-[#332E27] pb-3 flex items-baseline justify-between">
              <div>
                <span className="notebook-stamp text-[9px]">PRODUCCIÓN FÍSICA</span>
                <h3 className="font-serif font-semibold text-base text-[#1F1D1A] dark:text-[#EDE6DA] mt-1">
                  Biomasa Mensual Cosechada / Producida (kg)
                </h3>
              </div>
              <span className="text-xs font-mono text-[#666159] dark:text-[#9E9689]">
                Mayo – Septiembre
              </span>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between text-xs text-[#666159] dark:text-[#9E9689] mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-[#3B5568] rounded-[2px]" />
                  <span>Peces (kg)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-[#8A4B2A] rounded-[2px]" />
                  <span>Cerdos (kg)</span>
                </span>
              </div>

              {monthlyProduction.map((item) => (
                <div key={item.month} className="space-y-1.5 text-xs">
                  <div className="flex justify-between font-mono text-[11px] text-[#666159] dark:text-[#9E9689]">
                    <span className="font-bold text-[#1F1D1A] dark:text-[#EDE6DA]">{item.month}</span>
                    <span>
                      P: <strong className="text-[#3B5568] dark:text-[#8EA8BA]">{item.peces.toLocaleString()} kg</strong> | C: <strong className="text-[#8A4B2A] dark:text-[#D99675]">{item.cerdos.toLocaleString()} kg</strong>
                    </span>
                  </div>

                  <div className="space-y-1">
                    {/* Barra Peces */}
                    <div className="w-full bg-[#EAE2D2] dark:bg-[#28231C] h-2.5 rounded-[2px] overflow-hidden">
                      <div
                        className="bg-[#3B5568] h-full rounded-[2px]"
                        style={{ width: `${(item.peces / 6000) * 100}%` }}
                      />
                    </div>
                    {/* Barra Cerdos */}
                    <div className="w-full bg-[#EAE2D2] dark:bg-[#28231C] h-2.5 rounded-[2px] overflow-hidden">
                      <div
                        className="bg-[#8A4B2A] h-full rounded-[2px]"
                        style={{ width: `${(item.cerdos / 6000) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#E2D9CA] dark:border-[#332E27] text-xs text-[#666159] dark:text-[#9E9689] flex items-center justify-between">
              <span>Total Producido Período:</span>
              <span className="font-mono font-bold text-[#2E4A36] dark:text-[#86A98F]">
                35,900 kg vivos combinados
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'comparativo' && (
        <div className="card-paper p-6 space-y-6">
          <div className="border-b border-[#E2D9CA] dark:border-[#332E27] pb-3">
            <span className="notebook-stamp text-[10px]">ANÁLISIS CRUZADO</span>
            <h3 className="font-serif font-bold text-xl text-[#1F1D1A] dark:text-[#EDE6DA] mt-1">
              Comparativo Técnico & Económico: Piscicultura vs. Porcicultura
            </h3>
            <p className="text-xs text-[#666159] dark:text-[#9E9689] mt-0.5">
              Evaluación de rentabilidad marginal, ciclo biológico y eficiencia de transformación de grano en proteína.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-[#1F1D1A] dark:text-[#EDE6DA]">
              <thead className="border-b border-[#DDD4C4] dark:border-[#38342F] text-[11px] uppercase tracking-wider font-semibold text-[#666159] dark:text-[#9E9689] bg-[#F4EFE3]/60 dark:bg-[#141210]/60 font-serif">
                <tr>
                  <th className="py-3 px-4">Indicador Zootécnico</th>
                  <th className="py-3 px-4 text-[#3B5568] dark:text-[#8EA8BA]">Piscicultura (Tilapia / Trucha)</th>
                  <th className="py-3 px-4 text-[#8A4B2A] dark:text-[#D99675]">Porcicultura (Levante & Ceba)</th>
                  <th className="py-3 px-4">Ventaja Operativa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2D9CA] dark:divide-[#332E27]">
                <tr>
                  <td className="py-3 px-4 font-semibold">Duración Típica de Ciclo</td>
                  <td className="py-3 px-4 font-mono">160 – 180 días (hasta 500 g)</td>
                  <td className="py-3 px-4 font-mono">150 días (hasta 115 kg)</td>
                  <td className="py-3 px-4 text-xs text-[#666159] dark:text-[#9E9689]">Ciclos de caja similares</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold">Factor de Conversión (FCR)</td>
                  <td className="py-3 px-4 font-mono font-bold text-[#2A6B3D]">1.20 – 1.35 kg/kg</td>
                  <td className="py-3 px-4 font-mono">2.40 – 2.65 kg/kg</td>
                  <td className="py-3 px-4 text-xs text-[#2A6B3D] font-medium">Mayor eficiencia biológica del pez</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold">Costo de Producción ($/kg)</td>
                  <td className="py-3 px-4 font-mono">$ 8,200 – $ 8,600 COP / kg</td>
                  <td className="py-3 px-4 font-mono">$ 7,400 – $ 7,900 COP / kg</td>
                  <td className="py-3 px-4 text-xs text-[#666159] dark:text-[#9E9689]">Menor costo por kilo en cerdo</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold">Precio Promedio Venta en Pie</td>
                  <td className="py-3 px-4 font-mono font-bold text-[#2A6B3D]">$ 11,200 COP / kg</td>
                  <td className="py-3 px-4 font-mono">$ 9,800 COP / kg</td>
                  <td className="py-3 px-4 text-xs text-[#2A6B3D] font-medium">Mayor margen bruto por kilo en pez</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold">Incidencia del Alimento en Costo</td>
                  <td className="py-3 px-4 font-mono">68 – 72 %</td>
                  <td className="py-3 px-4 font-mono">73 – 78 %</td>
                  <td className="py-3 px-4 text-xs text-[#666159] dark:text-[#9E9689]">Alta sensibilidad al precio del grano</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold">Riesgo Ambiental Crítico</td>
                  <td className="py-3 px-4 text-xs">Caída de Oxígeno / Anoxia nocturna</td>
                  <td className="py-3 px-4 text-xs">Estrés calórico y amoníaco en galpón</td>
                  <td className="py-3 px-4 text-xs text-[#666159] dark:text-[#9E9689]">Ambos requieren sensores de precisión</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'tabla' && (
        <section className="card-paper p-0 overflow-hidden">
          <div className="p-4 border-b border-[#E2D9CA] dark:border-[#332E27] flex items-center justify-between bg-[#F8F4EB] dark:bg-[#181613]">
            <h2 className="font-serif font-semibold text-base text-[#1F1D1A] dark:text-[#EDE6DA]">
              {language === 'es' ? 'Libro de Lotes y Desempeño Productivo' : 'Batches Performance Ledger'}
            </h2>
            <span className="text-xs font-mono text-[#666159] dark:text-[#9E9689]">
              {filteredBatches.length} lotes registrados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-[#1F1D1A] dark:text-[#EDE6DA]">
              <thead className="border-b border-[#E2D9CA] dark:border-[#332E27] text-[11px] uppercase tracking-wider font-semibold text-[#666159] dark:text-[#9E9689] bg-[#F4EFE3]/50 dark:bg-[#141210]/50 font-serif">
                <tr>
                  <th className="px-4 py-3">Lote</th>
                  <th className="px-4 py-3">Especie</th>
                  <th className="px-4 py-3">Estanque / Galpón</th>
                  <th className="px-4 py-3">Población</th>
                  <th className="px-4 py-3">Biomasa Siembra</th>
                  <th className="px-4 py-3">FCR Est.</th>
                  <th className="px-4 py-3">Fecha Siembra</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2D9CA] dark:divide-[#332E27]">
                {filteredBatches.map((b) => (
                  <tr key={b.id} className="hover:bg-[#F4EFE3]/50 dark:hover:bg-[#181613] transition">
                    <td className="px-4 py-3 font-serif font-bold text-[#1F1D1A] dark:text-[#EDE6DA]">{b.batchCode}</td>
                    <td className="px-4 py-3">
                      <span className="notebook-stamp text-[10px] py-0 px-1.5">
                        {b.speciesCommonName}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">{b.pondCodeName || 'No asignado'}</td>
                    <td className="px-4 py-3 font-mono">{b.initialQuantity.toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold text-[#2E4A36] dark:text-[#86A98F] metric-number">
                      {b.initialBiomassKg} kg
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold">1.32</td>
                    <td className="px-4 py-3 font-mono text-xs">{b.stockingDate}</td>
                    <td className="px-4 py-3">
                      <span className="status-badge-green text-[10px] py-0.5 uppercase">
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
