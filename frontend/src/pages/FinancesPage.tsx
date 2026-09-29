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

export const FinancesPage: React.FC = () => {
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
    if (!selectedFarmId || totalAmount <= 0 || !description.trim()) {
      setErrorMessage('Por favor ingrese una descripción válida y un monto mayor a 0.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);

      await api.recordCost({
        farmId: selectedFarmId,
        batchId: selectedBatchId || undefined,
        expenseDate,
        category,
        description: description.trim(),
        totalAmount
      });

      setSuccessMessage('Costo registrado con éxito. Balance e indicador $/kg actualizado.');
      setIsModalOpen(false);
      resetForm();
      if (selectedBatchId) {
        await loadFinancialSummary(selectedBatchId);
      }
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

  const selectedBatch = batches.find(b => b.id === selectedBatchId);

  // Calcular porcentajes de distribución de costos
  const totalCost = financialSummary?.totalCumulativeCost || 1;
  const feedPct = financialSummary ? ((financialSummary.feedCost / totalCost) * 100).toFixed(1) : '0';
  const fingerlingsPct = financialSummary ? ((financialSummary.fingerlingsCost / totalCost) * 100).toFixed(1) : '0';
  const laborPct = financialSummary ? ((financialSummary.laborCost / totalCost) * 100).toFixed(1) : '0';
  const energyPct = financialSummary ? ((financialSummary.energyCost / totalCost) * 100).toFixed(1) : '0';
  const otherPct = financialSummary ? ((financialSummary.otherCosts / totalCost) * 100).toFixed(1) : '0';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-emerald-600" />
            Finanzas & Costo de Producción ($/kg)
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            HU-06: Control de costos directos (alimento, semilla) e indirectos (energía, nómina) y rentabilidad por kilo producido.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => selectedBatchId && loadFinancialSummary(selectedBatchId)}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition shadow-sm"
            title="Recargar finanzas"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Registrar Gasto
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
          <DollarSign className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Lote Contable
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

      {/* KPI Card Destacada: Costo de Producción $/kg (HU-06) */}
      {financialSummary && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:border-r lg:border-slate-200 pr-0 lg:pr-6 flex flex-col justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                  Indicador de Rentabilidad HU-06
                </span>
                <h3 className="text-slate-500 font-semibold text-sm mt-3">
                  Costo de Producción por Kilo
                </h3>
                <div className="text-4xl sm:text-5xl font-black text-slate-900 mt-2">
                  ${Math.round(financialSummary.costPerKgProduced).toLocaleString('es-CO')}
                  <span className="text-base text-slate-400 font-normal"> / kg</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Calculado dividiendo el costo total acumulado sobre la biomasa actual estimada ({financialSummary.currentBiomassKg.toFixed(1)} kg).
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                <span className="text-slate-600 font-medium">Inversión Total Lote:</span>
                <span className="font-extrabold text-slate-900 text-lg">
                  ${Math.round(financialSummary.totalCumulativeCost).toLocaleString('es-CO')} COP
                </span>
              </div>
            </div>

            {/* Desglose de Categorías */}
            <div className="lg:col-span-2 flex flex-col justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-600" />
                Desglose Estructural de Costos
              </h4>

              <div className="space-y-3">
                {/* Alimento */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-700">Alimento Balanceado ({feedPct}%)</span>
                    <span className="text-emerald-700">${Math.round(financialSummary.feedCost).toLocaleString('es-CO')}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${feedPct}%` }}
                    />
                  </div>
                </div>

                {/* Alevinos */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-700">Alevinos / Semilla ({fingerlingsPct}%)</span>
                    <span className="text-blue-700">${Math.round(financialSummary.fingerlingsCost).toLocaleString('es-CO')}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${fingerlingsPct}%` }}
                    />
                  </div>
                </div>

                {/* Mano de Obra */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-700">Mano de Obra & Operarios ({laborPct}%)</span>
                    <span className="text-amber-700">${Math.round(financialSummary.laborCost).toLocaleString('es-CO')}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${laborPct}%` }}
                    />
                  </div>
                </div>

                {/* Energía y Servicios */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-700">Energía Eléctrica & Combustible ({energyPct}%)</span>
                    <span className="text-purple-700">${Math.round(financialSummary.energyCost).toLocaleString('es-CO')}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${energyPct}%` }}
                    />
                  </div>
                </div>

                {/* Otros */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-700">Otros Costos / Mantenimiento ({otherPct}%)</span>
                    <span className="text-slate-700">${Math.round(financialSummary.otherCosts).toLocaleString('es-CO')}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-slate-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${otherPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Registro de Gasto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Registrar Costo o Insumo</h3>
                <p className="text-xs text-slate-500">Asignación directa a lote o gastos generales de la granja</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fecha del Desembolso
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Categoría de Costo
                </label>
                <div className="relative">
                  <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="FEED">Alimento Balanceado</option>
                    <option value="FINGERLINGS">Alevinos / Semilla</option>
                    <option value="LABOR">Mano de Obra & Salarios</option>
                    <option value="ENERGY">Energía & Combustible</option>
                    <option value="OTHER">Otros Gastos Operativos</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Monto Total (COP)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="number"
                    step="1000"
                    min="1"
                    required
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(Math.max(1, Number(e.target.value)))}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
                    placeholder="100000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descripción o Concepto
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="ej. Pago jornal muestreo y limpieza estanque"
                  />
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
                  {submitting ? 'Guardando...' : 'Registrar Gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
