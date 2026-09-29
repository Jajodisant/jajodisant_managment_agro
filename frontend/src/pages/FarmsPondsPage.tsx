import React, { useEffect, useState } from 'react';
import { Layers, Plus, Droplet, Wind, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { Farm, Pond } from '../types';

export const FarmsPondsPage: React.FC = () => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modales y formularios
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

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    loadFarms();
  }, []);

  useEffect(() => {
    if (selectedFarmId) {
      loadPonds(selectedFarmId);
    } else {
      setPonds([]);
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
      showFeedback('¡Granja registrada exitosamente!');
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
      showFeedback(`¡Estanque ${created.codeName} creado! Volumen: ${created.volumeM3} m³, Aforo: ${created.maxBiomassCapacityKg} kg`);
    } catch (err: any) {
      alert(err.message || 'Error registrando estanque');
    }
  };

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Previsualización interactiva de volumen y aforo en el modal (HU-01)
  const previewVolume = (lengthM * widthM * depthM).toFixed(2);
  const previewDensity = customDensity ? Number(customDensity) : hasAeration ? 10.0 : 3.0;
  const previewCapacity = (Number(previewVolume) * previewDensity).toFixed(2);

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
            Infraestructura: Granjas y Estanques (HU-01)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Parametrización dimensional de unidades físicas, cálculo automático de volumen cúbico y aforo biológico.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFarmModal(true)}
            className="btn-field bg-slate-800 text-white hover:bg-slate-900"
          >
            <Plus className="w-4 h-4" />
            Nueva Granja
          </button>
          <button
            onClick={() => setShowPondModal(true)}
            disabled={!selectedFarmId}
            className="btn-field bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Nuevo Estanque
          </button>
        </div>
      </div>

      {/* Selector de Granja */}
      {farms.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <Layers className="w-5 h-5 text-emerald-600" />
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Granja Seleccionada
            </label>
            <select
              value={selectedFarmId}
              onChange={(e) => setSelectedFarmId(e.target.value)}
              className="mt-1 font-bold text-slate-900 bg-transparent border-0 focus:ring-0 cursor-pointer p-0 text-lg"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} {f.location ? `(${f.location})` : ''} - {f.pondsCount} estanques
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Listado de Estanques con métricas de aforo (HU-01) */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">
          Estanques Registrados ({ponds.length})
        </h2>

        {ponds.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500">
            <Droplet className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No hay estanques en esta granja.</p>
            <p className="text-xs text-slate-400 mt-1">Haz clic en "Nuevo Estanque" para registrar dimensiones y aforo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ponds.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{p.codeName}</h3>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                      Tipo: {p.pondType}
                    </p>
                  </div>
                  {p.hasAeration ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      <Wind className="w-3.5 h-3.5" />
                      Aireado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                      Sin aireación
                    </span>
                  )}
                </div>

                {/* Métricas HU-01 */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <p className="text-xs font-semibold text-slate-500">Volumen Útil</p>
                    <p className="text-lg font-black text-slate-900">{p.volumeM3} m³</p>
                    <p className="text-[10px] text-slate-400">
                      {p.lengthM}m × {p.widthM}m × {p.avgDepthM}m
                    </p>
                  </div>

                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                    <p className="text-xs font-semibold text-emerald-700">Aforo Máximo</p>
                    <p className="text-lg font-black text-emerald-800">
                      {p.maxBiomassCapacityKg ? `${p.maxBiomassCapacityKg.toLocaleString()} kg` : 'N/A'}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-medium">
                      Límite: {p.maxDensityKgM3} kg/m³
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Crear Granja */}
      {showFarmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-xl font-bold text-slate-900">Registrar Nueva Granja</h3>
            <form onSubmit={handleCreateFarm} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nombre Comercial *</label>
                <input
                  type="text"
                  required
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  placeholder="ej. Piscícola Betania"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Ubicación / Municipio</label>
                <input
                  type="text"
                  value={farmLocation}
                  onChange={(e) => setFarmLocation(e.target.value)}
                  placeholder="ej. Yaguará, Huila"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFarmModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
                >
                  Guardar Granja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear Estanque con Aforo HU-01 */}
      {showPondModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Registrar Estanque (HU-01)</h3>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                Aforo Automático
              </span>
            </div>

            <form onSubmit={handleCreatePond} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Código / Nombre *</label>
                  <input
                    type="text"
                    required
                    value={pondCode}
                    onChange={(e) => setPondCode(e.target.value)}
                    placeholder="ej. T-01"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tipo de Estructura</label>
                  <select
                    value={pondType}
                    onChange={(e) => setPondType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white"
                  >
                    <option value="earthen">Tierra (Earthen)</option>
                    <option value="geomembrane">Geomembrana</option>
                    <option value="concrete">Concreto</option>
                    <option value="cage">Jaula Flotante</option>
                  </select>
                </div>
              </div>

              {/* Dimensiones */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Largo (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={lengthM}
                    onChange={(e) => setLengthM(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Ancho (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={widthM}
                    onChange={(e) => setWidthM(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Profundidad (m) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={depthM}
                    onChange={(e) => setDepthM(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  />
                </div>
              </div>

              {/* Aireación y Densidad sugerida HU-01 */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasAeration}
                    onChange={(e) => setHasAeration(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Cuenta con aireación mecánica forzada (Splasher/Blowers)
                  </span>
                </label>
                <p className="text-[11px] text-slate-500">
                  {hasAeration
                    ? '⚡ Densidad técnica sugerida: hasta 10.00 kg/m³.'
                    : '🌱 Densidad técnica recomendada sin aireación: máx. 3.00 kg/m³.'}
                </p>
              </div>

              {/* Previsualización en Vivo de Cálculos HU-01 */}
              <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 grid grid-cols-2 text-center gap-2">
                <div>
                  <p className="text-[11px] font-bold text-emerald-800 uppercase">Volumen Calculado</p>
                  <p className="text-xl font-black text-emerald-900">{previewVolume} m³</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-emerald-800 uppercase">Capacidad Máxima</p>
                  <p className="text-xl font-black text-emerald-900">{previewCapacity} kg</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPondModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
                >
                  Confirmar y Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
