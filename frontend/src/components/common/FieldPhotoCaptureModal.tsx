import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { compressImage, saveFieldPhoto } from '../../services/photoService';
import { useTranslation } from '../../context/LanguageContext';
import { Batch } from '../../types';

interface FieldPhotoCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoSaved: () => void;
  batches?: Batch[];
  preselectedBatchId?: string;
  installationName?: string;
}

export const FieldPhotoCaptureModal: React.FC<FieldPhotoCaptureModalProps> = ({
  isOpen,
  onClose,
  onPhotoSaved,
  batches = [],
  preselectedBatchId,
  installationName
}) => {
  const { language } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedBatchId, setSelectedBatchId] = useState<string>(preselectedBatchId || '');
  const [category, setCategory] = useState<'water_clarity' | 'fish_health' | 'pig_health' | 'feed_sample' | 'general'>('water_clarity');
  const [caption, setCaption] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      setErrorMsg(null);
      const compressed = await compressImage(file, 1024, 0.78);
      setPreviewUrl(compressed);
    } catch (err: any) {
      setErrorMsg(language === 'es' ? 'Error al procesar la imagen' : 'Error processing image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewUrl) {
      setErrorMsg(language === 'es' ? 'Captura o selecciona una foto primero' : 'Capture or pick a photo first');
      return;
    }

    try {
      setIsProcessing(true);
      const matchedBatch = batches.find(b => b.id === selectedBatchId);

      await saveFieldPhoto({
        batchId: selectedBatchId || undefined,
        batchCode: matchedBatch?.batchCode,
        installationName: installationName || (matchedBatch?.penCode ? `Corral ${matchedBatch.penCode}` : matchedBatch?.pondCodeName ? `Estanque ${matchedBatch.pondCodeName}` : undefined),
        dataUrl: previewUrl,
        caption: caption.trim() || (language === 'es' ? 'Inspección de campo' : 'Field inspection'),
        category
      });

      setPreviewUrl(null);
      setCaption('');
      onPhotoSaved();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error guardando foto offline');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 bg-[#1F1D1A]/50 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
    >
      <div className="card-paper max-w-lg w-full p-6 space-y-4 shadow-xl border border-[#E2D9CA] dark:border-[#332E27] max-h-[90vh] overflow-y-auto cursor-default">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-[#E2D9CA] dark:border-[#332E27] pb-2">
          <div>
            <span className="notebook-stamp text-[10px]">CÁMARA DE CAMPO OFFLINE</span>
            <h3 className="text-lg font-serif font-bold text-[#1F1D1A] dark:text-[#EDE6DA] mt-0.5">
              {language === 'es' ? 'Capturar Evidencia Fotográfica' : 'Capture Field Photo Evidence'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#666159] dark:text-[#9E9689] hover:text-[#1F1D1A] dark:hover:text-[#EDE6DA] p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-[#A32A26]/10 border border-[#A32A26]/30 text-xs text-[#A32A26] dark:text-[#E5807D] rounded-[4px] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Área de Captura / Preview */}
          <div className="border-2 border-dashed border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] p-4 text-center bg-[#FAF7F0] dark:bg-[#141210]">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            {previewUrl ? (
              <div className="space-y-3">
                <div className="relative max-h-64 overflow-hidden rounded-[4px] border border-[#DDD4C4] dark:border-[#38342F]">
                  <img
                    src={previewUrl}
                    alt="Evidencia capturada"
                    className="w-full h-auto object-cover max-h-64 mx-auto"
                  />
                </div>
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-secondary text-xs h-9 px-3 inline-flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{language === 'es' ? 'Repetir Foto' : 'Retake'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewUrl(null)}
                    className="btn-secondary text-xs h-9 px-3 text-[#A32A26]"
                  >
                    {language === 'es' ? 'Quitar' : 'Remove'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#2E4A36]/10 text-[#2E4A36] dark:text-[#86A98F] mx-auto flex items-center justify-center">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-serif font-semibold text-sm text-[#1F1D1A] dark:text-[#EDE6DA]">
                    {language === 'es' ? 'Toma una foto en campo' : 'Snap photo in the field'}
                  </p>
                  <p className="text-xs text-[#666159] dark:text-[#9E9689] mt-0.5">
                    {language === 'es'
                      ? 'Guarda turbidez de agua, estado de agallas o lesiones dérmicas directo en la memoria del celular sin conexión.'
                      : 'Saves water turbidity, gills or lesions directly in device memory without internet.'}
                  </p>
                </div>

                <div className="flex justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-primary text-xs h-10 px-4 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{language === 'es' ? 'Abrir Cámara / Galería' : 'Open Camera / Gallery'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Categoría de Inspección */}
          <div>
            <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
              {language === 'es' ? 'Tipo de Inspección Zootécnica *' : 'Inspection Category *'}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
            >
              <option value="water_clarity">Turbidez / Color de Agua (Disco Secchi)</option>
              <option value="fish_health">Sanidad de Peces (Agallas, Aletas, Ojos)</option>
              <option value="pig_health">Sanidad Porcina (Piel, Pezuñas, Tos/Lesiones)</option>
              <option value="feed_sample">Calidad del Concentrado / Alimento</option>
              <option value="general">Bitácora General de Instalación</option>
            </select>
          </div>

          {/* Lote Asociado */}
          {batches.length > 0 && (
            <div>
              <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
                {language === 'es' ? 'Lote Vinculado (Opcional)' : 'Linked Batch (Optional)'}
              </label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
              >
                <option value="">{language === 'es' ? '(Sin lote específico)' : '(No specific batch)'}</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batchCode} • {b.speciesCommonName} {b.penCode ? `(Corral ${b.penCode})` : b.pondCodeName ? `(Estanque ${b.pondCodeName})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Anotación / Observación */}
          <div>
            <label className="text-xs font-bold text-[#1F1D1A] dark:text-[#EDE6DA] block mb-1">
              {language === 'es' ? 'Notas u Observación de Campo' : 'Field Notes / Caption'}
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={
                category === 'water_clarity'
                  ? 'ej. Lectura Secchi 35 cm, color verde oliva óptimo'
                  : category === 'fish_health'
                  ? 'ej. Muestreo 30 peces: branquias rosadas normales'
                  : category === 'pig_health'
                  ? 'ej. Inspección corral 02: sin lesiones dérmicas'
                  : 'ej. Observación del lote en campo'
              }
              className="w-full px-3 py-2 bg-[#F4EFE3] dark:bg-[#141210] border border-[#DDD4C4] dark:border-[#38342F] rounded-[4px] focus:border-[#2E4A36] outline-none text-sm text-[#1F1D1A] dark:text-[#EDE6DA]"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-2 pt-3 border-t border-[#E2D9CA] dark:border-[#332E27]">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs h-10 px-4"
            >
              {language === 'es' ? 'Cancelar' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={!previewUrl || isProcessing}
              className="btn-primary text-xs h-10 px-4 disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{language === 'es' ? 'Guardar en Cuaderno' : 'Save to Journal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
