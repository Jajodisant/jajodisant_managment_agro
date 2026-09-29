import React, { useEffect, useState } from 'react';
import { Layers, Plus, Droplet, Wind, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { Farm, Pond } from '../types';
import { useTranslation } from '../context/LanguageContext';

export const FarmsPondsPage: React.FC = () => {
  const { t } = useTranslation();
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
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-semibold text-sm">{feedbackMsg}</span>
        </div>
      )}

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Layers className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            {t('farms_title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('farms_subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowFarmModal(true)}
            className="btn-field bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-900 dark:hover:bg-slate-600"
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
            {t('btn_new_pond')}
          </button>
        </div>
      </div>

      {/* Selector de Granja */}
      {farms.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
          <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="flex-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Granja Seleccionada
            </label>
            <select
              value={selectedFarmId}
              onChange={(e) => setSelectedFarmId(e.target.value)}
              className="mt-0.5 font-bold text-slate-900 dark:text-white bg-transparent border-0 focus:ring-0 cursor-pointer p-0 text-base sm:text-lg w-full"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id} className="dark:bg-slate-900 text-slate-900 dark:text-white">
                  {f.name} {f.location ? `(${f.location})` : ''} - {f.pondsCount} estanques
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Listado de Estanques con métricas de aforo (HU-01) */}
      <div>
        <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mb-4">
          Estanques Registrados ({ponds.length})
        </h2>

        {ponds.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
            <Droplet className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="font-bold text-slate-700 dark:text-slate-200">No hay estanques en esta granja.</p>
            <p className="text-xs text-slate-400 mt-1">Haz clic en "Nuevo Estanque" para registrar dimensiones y aforo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ponds.map((p) => (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4 hover:shadow-md transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">{p.codeName}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                      Tipo: {p.pondType}
                    </p>
                  </div>
                  {p.hasAeration ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      <Wind className="w-3.5 h-3.5" />
                      Aireado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      Sin aireación
                    </span>
                  )}
                </div>

                {/* Métricas HU-01 */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Volumen Útil</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white">{p.volumeM3} m³</p>
                    <p className="text-[10px] text-slate-400">
                      {p.lengthM}m × {p.widthM}m × {p.avgDepthM}m
                    </p>
                  </div>

                  <div className="bg-emerald-50 dark:bg-emerald-950/50 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-900/60">
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Aforo Máximo</p>
                    <p className="text-lg font-black text-emerald-800 dark:text-emerald-300">
                      {p.maxBiomassCapacityKg ? `${p.maxBiomassCapacityKg.toLocaleString()} kg` : 'N/A'}
                    </p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100 dark:border-slate-800 transition-colors">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Registrar Nueva Granja</h3>
            <form onSubmit={handleCreateFarm} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Nombre Comercial *</label>
                <input
                  type="text"
                  required
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  placeholder="ej. Piscícola San Jerónimo"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Ubicación / Vereda</label>
                <input
                  type="text"
                  value={farmLocation}
                  onChange={(e) => setFarmLocation(e.target.value)}
                  placeholder="ej. Vereda El Salado, Huila"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFarmModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  {t('btn_cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700"
                >
                  Guardar Granja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear Estanque con Aforo en tiempo real (HU-01) */}
      {showPondModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto transition-colors">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Nuevo Estanque con Aforo Técnico (HU-01)</h3>
            <form onSubmit={handleCreatePond} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Código o Nombre del Estanque *</label>
                <input
                  type="text"
                  required
                  value={pondCode}
                  onChange={(e) => setPondCode(e.target.value)}
                  placeholder="ej. Estanque T-01"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Tipo de Estanque</label>
                <select
                  value={pondType}
                  onChange={(e) => setPondType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm dark:text-white"
                >
                  <option value="earthen">En Tierra (Rústico)</option>
                  <option value="geomembrane">Geomembrana / Circular</option>
                  <option value="concrete">Concreto / Cemento</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Largo (m) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    value={lengthM}
                    onChange={(e) => setLengthM(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Ancho (m) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    value={widthM}
                    onChange={(e) => setWidthM(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Profundidad (m) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    required
                    value={depthM}
                    onChange={(e) => setDepthM(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <input
                  type="checkbox"
                  id="aeration"
                  checked={hasAeration}
                  onChange={(e) => setHasAeration(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <label htmlFor="aeration" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Cuenta con Aireación Mecánica Forzada (Blowers, Splashers)
                </label>
              </div>

              {/* Caja de Cálculo Dinámico en Vivo */}
              <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 space-y-1">
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                  Cálculo Zootécnico Automático (HU-01)
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1 text-sm">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400 text-xs">Volumen Estimado:</span>
                    <p className="font-extrabold text-slate-900 dark:text-white">{previewVolume} m³</p>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400 text-xs">Densidad Límite:</span>
                    <p className="font-extrabold text-slate-900 dark:text-white">{previewDensity} kg/m³</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800 text-xs flex justify-between items-center">
                  <span className="font-semibold text-emerald-900 dark:text-emerald-200">Capacidad Máxima de Biomasa:</span>
                  <span className="text-base font-black text-emerald-800 dark:text-emerald-300">{previewCapacity} kg</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPondModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  {t('btn_cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700"
                >
                  Guardar Estanque
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
