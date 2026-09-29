import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Layers,
  PieChart,
  Calendar,
  FileText,
  Tag
} from 'lucide-react';
import { api } from '../services/api';
import { Farm, Batch, BatchFinancialSummary } from '../types';
import { useTranslation } from '../context/LanguageContext';

export const FinancesPage: React.FC = () => {
  const { t, language } = useTranslation();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [financialSummary, setFinancialSummary] = useState<BatchFinancialSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Formulario de Gasto / Costo
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<string>('LABOR');
  const [description, setDescription] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState<number>(100000);

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
      loadFinancialSummary(selectedBatchId);
    } else {
      setFinancialSummary(null);
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
      setErrorMessage(err.message || 'Error al cargar los lotes');
    }
  };

  const loadFinancialSummary = async (batchId: string) => {
    try {
      setLoading(true);
      const data = await api.getBatchFinancialSummary(batchId);
      setFinancialSummary(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al calcular costos del lote');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmId) return;

    try {
      setSubmitting(true);
      setErrorMessage(null);

      await api.recordCost({
        farmId: selectedFarmId,
        batchId: selectedBatchId || undefined,
        expenseDate,
        category,
        description: description.trim(),
        totalAmount: Number(totalAmount)
      });

      setSuccessMessage(
        language === 'es'
          ? '¡Gasto registrado exitosamente en el libro mayor de costos!'
          : 'Cost record saved successfully in ledger!'
      );
      setIsModalOpen(false);
      resetForm();

      if (selectedBatchId) {
        await loadFinancialSummary(selectedBatchId);
      }
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al registrar el costo');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setCategory('LABOR');
    setDescription('');
    setTotalAmount(100000);
  };

  const totalCost = financialSummary?.totalCumulativeCost || 1;
  const feedPct = financialSummary ? Math.round((financialSummary.feedCost / totalCost) * 100) : 0;
  const fingerlingsPct = financialSummary ? Math.round((financialSummary.fingerlingsCost / totalCost) * 100) : 0;
  const laborPct = financialSummary ? Math.round((financialSummary.laborCost / totalCost) * 100) : 0;
  const energyPct = financialSummary ? Math.round((financialSummary.energyCost / totalCost) * 100) : 0;
  const otherPct = financialSummary ? Math.round((financialSummary.otherCosts / totalCost) * 100) : 0;

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
              FOLIO #06 • FINANZAS & COSTOS
            </span>
            <span className="text-xs text-[#666159] dark:text-[#9E9689] uppercase tracking-wider font-mono">
              NORMA HU-06
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#1F1D1A] dark:text-[#EDE6DA] font-semibold tracking-tight">
            {t('finances_title')}
          </h1>
          <p className="text-sm text-[#666159] dark:text-[#9E9689] mt-0.5 max-w-2xl">
            {t('finances_subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => selectedBatchId && loadFinancialSummary(selectedBatchId)}
            className="btn-secondary text-xs sm:text-sm px-3.5 h-11"
            title="Recalcular costos"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary text-xs sm:text-sm px-4 h-11"
          >
            <Plus className="w-4 h-4" />
            <span>{t('btn_record_cost')}</span>
          </button>
        </div>
      </div>

      {/* Selectores de Granja y Lote */}
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
          <DollarSign className="w-5 h-5 text-[#2E4A36] dark:text-[#86A98F] shrink-0" />
          <div className="flex-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#666159] dark:text-[#9E9689] block mb-1">
              {language === 'es' ? 'Lote para Análisis de Costo' : 'Batch for Cost Analysis'}
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

      {/* KPI Principal y Desglose Estructural (Estilo Libro de Contabilidad) */}
      {financialSummary && (
        <section className="card-notebook p-6 sm:p-7 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel Izquierdo: Costo $/kg */}
            <div className="lg:border-r border-[#E2D9CA] dark:border-[#332E27] pr-0 lg:pr-6 flex flex-col justify-between">
              <div>
                <span className="notebook-stamp text-[10px]">INDICADOR HU-06</span>
                <h3 className="text-xs uppercase font-semibold text-[#666159] dark:text-[#9E9689] mt-2">
                  Costo de Producción por Kilo Vivo
                </h3>
                <div className="font-serif font-bold text-3xl sm:text-4xl text-[#1F1D1A] dark:text-[#EDE6DA] metric-number mt-2">
                  ${Math.round(financialSummary.costPerKgProduced).toLocaleString('es-CO')}
                  <span className="text-sm font-normal text-[#666159] dark:text-[#9E9689]"> COP / kg</span>
                </div>
                <p className="text-xs text-[#666159] dark:text-[#9E9689] mt-2 leading-relaxed">
                  Cálculo resultante de dividir el costo total acumulado sobre la biomasa actual estimada ({financialSummary.currentBiomassKg.toFixed(1)} kg).
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-[#E2D9CA] dark:border-[#332E27] flex items-center justify-between text-xs">
                <span className="font-semibold text-[#666159] dark:text-[#9E9689]">Inversión Total Acumulada:</span>
                <span className="font-serif font-bold text-base text-[#2E4A36] dark:text-[#86A98F] metric-number">
                  ${Math.round(financialSummary.totalCumulativeCost).toLocaleString('es-CO')} COP
                </span>
              </div>
            </div>

            {/* Panel Derecho: Barras Planas con Paleta de Libro */}
            <div className="lg:col-span-2 space-y-3.5">
              <div className="flex items-center justify-between border-b border-[#E2D9CA] dark:border-[#332E27] pb-2">
                <h4 className="font-serif font-semibold text-sm sm:text-base text-[#1F1D1A] dark:text-[#EDE6DA] flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-[#2E4A36] dark:text-[#86A98F]" />
                  <span>Desglose Estructural de Rubros de Gasto</span>
                </h4>
                <span className="text-xs font-mono text-[#666159] dark:text-[#9E9689]">
                  {financialSummary.batchCode}
                </span>
              </div>

              {/* Alimento */}
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-[#1F1D1A] dark:text-[#EDE6DA]">Alimento Balanceado ({feedPct}%)</span>
                  <span className="font-mono font-bold text-[#2E4A36] dark:text-[#86A98F]">
                    ${Math.round(financialSummary.feedCost).toLocaleString('es-CO')}
                  </span>
                </div>
                <div className="w-full bg-[#EAE2D2] dark:bg-[#28231C] h-2 rounded-[2px] overflow-hidden">
                  <div className="bg-[#2E4A36] h-full rounded-[2px]" style={{ width: `${feedPct}%` }} />
                </div>
              </div>

              {/* Semilla / Alevinos */}
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-[#1F1D1A] dark:text-[#EDE6DA]">Semilla / Alevinos / Lechones ({fingerlingsPct}%)</span>
                  <span className="font-mono font-bold text-[#3B5568] dark:text-[#8EA8BA]">
                    ${Math.round(financialSummary.fingerlingsCost).toLocaleString('es-CO')}
                  </span>
                </div>
                <div className="w-full bg-[#EAE2D2] dark:bg-[#28231C] h-2 rounded-[2px] overflow-hidden">
                  <div className="bg-[#3B5568] h-full rounded-[2px]" style={{ width: `${fingerlingsPct}%` }} />
                </div>
              </div>

              {/* Mano de Obra */}
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-[#1F1D1A] dark:text-[#EDE6DA]">Mano de Obra & Operarios ({laborPct}%)</span>
                  <span className="font-mono font-bold text-[#8A4B2A] dark:text-[#D99675]">
                    ${Math.round(financialSummary.laborCost).toLocaleString('es-CO')}
                  </span>
                </div>
                <div className="w-full bg-[#EAE2D2] dark:bg-[#28231C] h-2 rounded-[2px] overflow-hidden">
                  <div className="bg-[#8A4B2A] h-full rounded-[2px]" style={{ width: `${laborPct}%` }} />
                </div>
              </div>

              {/* Energía & Combustible */}
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-[#1F1D1A] dark:text-[#EDE6DA]">Energía, Aireación & Bombeo ({energyPct}%)</span>
                  <span className="font-mono font-bold text-[#9C631B] dark:text-[#E0A868]">
                    ${Math.round(financialSummary.energyCost).toLocaleString('es-CO')}
                  </span>
                </div>
                <div className="w-full bg-[#EAE2D2] dark:bg-[#28231C] h-2 rounded-[2px] overflow-hidden">
                  <div className="bg-[#9C631B] h-full rounded-[2px]" style={{ width: `${energyPct}%` }} />
                </div>
              </div>

              {/* Otros Costos */}
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-[#1F1D1A] dark:text-[#EDE6DA]">Insumos Veterinarios & Otros ({otherPct}%)</span>
                  <span className="font-mono font-bold text-[#666159] dark:text-[#9E9689]">
                    ${Math.round(financialSummary.otherCosts).toLocaleString('es-CO')}
                  </span>
                </div>
                <div className="w-full bg-[#EAE2D2] dark:bg-[#28231C] h-2 rounded-[2px] overflow-hidden">
                  <div className="bg-[#666159] h-full rounded-[2px]" style={{ width: `${otherPct}%` }} />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Modal: Asentar Registro de Gasto Directo / Indirecto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1F1D1A]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-paper max-w-lg w-full p-6 space-y-4 shadow-xl border border-[#E2D9CA] dark:border-[#332E27] max-h-[90vh] overflow-y-auto">
            <div className="border-b border-[#E2D9CA] dark:border-[#332E27] pb-2">
              <span className="notebook-stamp text-[10px]">ASIENTO CONTABLE HU-06</span>
              <h3 className="text-lg font-serif font-bold text-[#1F1D1A] dark:text-[#EDE6DA] mt-1">
                Registrar Gasto de Operación
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                    Fecha del Comprobante *
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                    Categoría de Costo *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
                  >
                    <option value="LABOR">Mano de Obra / Jornales</option>
                    <option value="ENERGY">Energía Eléctrica / Combustible</option>
                    <option value="MEDICATION">Sanidad / Tratamientos / Cal</option>
                    <option value="MAINTENANCE">Mantenimiento de Estanques</option>
                    <option value="TRANSPORT">Transporte / Logística</option>
                    <option value="OTHER">Otros Gastos Indirectos</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                  Monto Total del Gasto (COP) *
                </label>
                <input
                  type="number"
                  step="1000"
                  min="1"
                  required
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] text-base font-bold text-[#1F1D1A] dark:text-[#EDE6DA]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                  Descripción / Proveedor / Concepto *
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ej. Pago de 2 jornales para despesque y desinfección"
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
                  {submitting ? 'Asentando...' : 'Asentar Gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
