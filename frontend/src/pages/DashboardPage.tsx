import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Fish,
  Activity,
  Utensils,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Plus
} from 'lucide-react';
import { api } from '../services/api';
import { Farm, Batch } from '../types';

export const DashboardPage: React.FC = () => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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
      console.error('Error cargando métricas:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeBatches = batches.filter((b) => b.status !== 'harvested' && b.status !== 'cancelled');
  const totalBiomass = activeBatches.reduce((acc, b) => acc + (b.initialBiomassKg || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Panel de Control Agropecuario
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestión piscícola intensiva, aforo de estanques y conversión alimenticia en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/farms"
            className="btn-field bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Nueva Granja / Estanque
          </Link>
        </div>
      </div>

      {/* Tarjetas de Métricas Clave */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Granjas Activas</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{loading ? '...' : farms.length}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lotes en Cultivo</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{loading ? '...' : activeBatches.length}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Fish className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Biomasa Sembrada</p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              {loading ? '...' : `${totalBiomass.toLocaleString()} kg`}
            </p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Meta FCR Óptimo</p>
            <p className="text-3xl font-black text-emerald-600 mt-1">≤ 1.35</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Módulos Operativos de Campo */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Acciones Operativas Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link
            to="/feeding"
            className="group bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 rounded-2xl shadow-md hover:shadow-lg transition flex flex-col justify-between"
          >
            <div>
              <div className="p-3 bg-white/20 w-fit rounded-xl backdrop-blur-sm mb-4">
                <Utensils className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Alimentación Diaria</h3>
              <p className="text-emerald-100 text-sm mt-1">
                Consulta la cuota por biomasa viva (HU-03) y registra suministros en campo con modo sin conexión (HU-04).
              </p>
            </div>
            <div className="flex items-center gap-1 font-semibold text-sm mt-6 group-hover:translate-x-1 transition">
              <span>Registrar Ración</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          <Link
            to="/biometries"
            className="group bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 rounded-2xl shadow-md hover:shadow-lg transition flex flex-col justify-between"
          >
            <div>
              <div className="p-3 bg-white/20 w-fit rounded-xl backdrop-blur-sm mb-4">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Muestreos Biométricos</h3>
              <p className="text-blue-100 text-sm mt-1">
                Ingresa pesajes de muestra para computar biomasa, ganancia diaria y semáforo de FCR automático (HU-05).
              </p>
            </div>
            <div className="flex items-center gap-1 font-semibold text-sm mt-6 group-hover:translate-x-1 transition">
              <span>Registrar Biometría</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          <Link
            to="/finances"
            className="group bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-md hover:shadow-lg transition flex flex-col justify-between"
          >
            <div>
              <div className="p-3 bg-white/20 w-fit rounded-xl backdrop-blur-sm mb-4">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Costos y Rentabilidad</h3>
              <p className="text-slate-300 text-sm mt-1">
                Monitorea el costo acumulado de producción y el costo por kilogramo producido ($/kg) en tiempo real (HU-06).
              </p>
            </div>
            <div className="flex items-center gap-1 font-semibold text-sm mt-6 group-hover:translate-x-1 transition">
              <span>Analizar Costos</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </div>

      {/* Lotes activos recientes */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Lotes en Producción</h2>
        {batches.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <Fish className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p>Aún no hay lotes registrados.</p>
            <Link to="/batches" className="text-emerald-600 font-semibold hover:underline mt-1 inline-block">
              Sembrar primer lote
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Lote</th>
                  <th className="py-3 px-4">Especie</th>
                  <th className="py-3 px-4">Estanque</th>
                  <th className="py-3 px-4">Población Inicial</th>
                  <th className="py-3 px-4">Biomasa Inicial</th>
                  <th className="py-3 px-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{b.batchCode}</td>
                    <td className="py-3 px-4">{b.speciesCommonName}</td>
                    <td className="py-3 px-4">{b.pondCodeName || 'Sin estanque'}</td>
                    <td className="py-3 px-4">{b.initialQuantity.toLocaleString()} peces</td>
                    <td className="py-3 px-4 font-semibold">{b.initialBiomassKg} kg</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800">
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
