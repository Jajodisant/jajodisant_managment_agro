import React from 'react';
import { BarChart3 } from 'lucide-react';

export const StatsPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="border-b border-[#E2D9CA] dark:border-[#332E27] pb-4 mb-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#666159] dark:text-[#9E9689] font-medium">
          <span>Análisis Comparativo & Producción</span>
          <span>•</span>
          <span>Reportes Zootécnicos</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif text-[#1F1D1A] dark:text-[#EDE6DA] mt-1">
          Estadísticas & Rendimiento
        </h1>
        <p className="text-sm text-[#666159] dark:text-[#9E9689] mt-1">
          Curvas de biomasa, histórico de FCR, mortalidad y análisis comparativo entre especies.
        </p>
      </div>

      <div className="card-paper p-8 text-center border border-[#E2D9CA] dark:border-[#332E27] rounded-[5px]">
        <BarChart3 className="w-10 h-10 text-[#2E4A36] dark:text-[#86A98F] mx-auto mb-3" />
        <h2 className="text-lg font-serif text-[#1F1D1A] dark:text-[#EDE6DA] font-semibold">
          Fase 4: Estadísticas en Preparación
        </h2>
        <p className="text-sm text-[#666159] dark:text-[#9E9689] max-w-md mx-auto mt-2">
          Gráficos de línea fina, barras planas con paleta de libro y exportación de datos zootécnicos se habilitarán en la Fase 4.
        </p>
      </div>
    </div>
  );
};
