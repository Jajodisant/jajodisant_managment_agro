import React from 'react';
import { BookOpen } from 'lucide-react';

export const LibraryPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="border-b border-[#E2D9CA] dark:border-[#332E27] pb-4 mb-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#666159] dark:text-[#9E9689] font-medium">
          <span>Manual de Consulta Zootécnica</span>
          <span>•</span>
          <span>Enciclopedia Agropecuaria</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif text-[#1F1D1A] dark:text-[#EDE6DA] mt-1">
          Biblioteca Técnica
        </h1>
        <p className="text-sm text-[#666159] dark:text-[#9E9689] mt-1">
          Artículos técnicos, tablas zootécnicas de referencia y guías sanitarias para piscicultura y porcicultura.
        </p>
      </div>

      <div className="card-paper p-8 text-center border border-[#E2D9CA] dark:border-[#332E27] rounded-[5px]">
        <BookOpen className="w-10 h-10 text-[#2E4A36] dark:text-[#86A98F] mx-auto mb-3" />
        <h2 className="text-lg font-serif text-[#1F1D1A] dark:text-[#EDE6DA] font-semibold">
          Fase 3: Biblioteca en Preparación
        </h2>
        <p className="text-sm text-[#666159] dark:text-[#9E9689] max-w-md mx-auto mt-2">
          Los capítulos numerados (I. Piscicultura, II. Porcicultura) con artículos de calidad de agua, FCR, bioseguridad y costos se integrarán en la siguiente fase de desarrollo.
        </p>
      </div>
    </div>
  );
};
