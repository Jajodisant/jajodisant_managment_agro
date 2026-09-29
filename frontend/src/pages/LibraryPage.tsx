import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Fish,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  Filter,
  Bookmark,
  Share2,
  FileCheck,
  FileClock,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { LIBRARY_ARTICLES, LibraryArticle } from '../data/libraryArticles';
import { useTranslation } from '../context/LanguageContext';

export const LibraryPage: React.FC = () => {
  const { t, language } = useTranslation();

  // Filtros
  const [selectedChapter, setSelectedChapter] = useState<'all' | 'I' | 'II'>('all');
  const [selectedSpecies, setSelectedSpecies] = useState<'all' | 'peces' | 'cerdos'>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Artículo activo para lectura (panel derecho / detalle)
  const [selectedArticleId, setSelectedArticleId] = useState<string>(LIBRARY_ARTICLES[0].id);

  // Filtrado reactivo de artículos
  const filteredArticles = useMemo(() => {
    return LIBRARY_ARTICLES.filter((article) => {
      // Filtro por capítulo
      if (selectedChapter !== 'all' && article.chapterNumber !== selectedChapter) {
        return false;
      }
      // Filtro por especie
      if (selectedSpecies !== 'all' && article.species !== selectedSpecies) {
        return false;
      }
      // Filtro por tema
      if (selectedTopic !== 'all' && article.topic !== selectedTopic) {
        return false;
      }
      // Búsqueda por texto (título, resumen, contenido, especie)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = article.title.toLowerCase().includes(q);
        const matchesSummary = article.summary.toLowerCase().includes(q);
        const matchesSpecies = article.speciesLabel.toLowerCase().includes(q);
        const matchesTopic = article.topicLabel.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSummary && !matchesSpecies && !matchesTopic) {
          return false;
        }
      }
      return true;
    });
  }, [selectedChapter, selectedSpecies, selectedTopic, searchQuery]);

  // Artículo actualmente abierto
  const activeArticle = useMemo(() => {
    const found = filteredArticles.find((a) => a.id === selectedArticleId);
    return found || (filteredArticles.length > 0 ? filteredArticles[0] : null);
  }, [filteredArticles, selectedArticleId]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ========================================================================= */}
      {/* 1. Cabecera Estilo Libro de Consulta Zootécnico */}
      {/* ========================================================================= */}
      <div className="border-b border-[#E2D9CA] dark:border-[#332E27] pb-4 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="notebook-stamp">
              ENCICLOPEDIA AGROPECUARIA
            </span>
            <span className="text-xs text-[#666159] dark:text-[#9E9689] uppercase tracking-wider font-mono">
              MANUAL TÉCNICO DE CAMPO
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#1F1D1A] dark:text-[#EDE6DA] font-semibold tracking-tight">
            {language === 'es' ? 'Biblioteca Zootécnica de Consulta' : 'Technical Zootechnical Library'}
          </h1>
          <p className="text-sm text-[#666159] dark:text-[#9E9689] mt-0.5 max-w-2xl">
            {language === 'es'
              ? 'Artículos técnicos por especie, tablas de parámetros de referencia, guías sanitarias y prevención de errores comunes en campo.'
              : 'Technical reference articles by species, water quality parameters, and field best practices.'}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#666159] dark:text-[#9E9689]">
          <BookOpen className="w-4 h-4 text-[#2E4A36] dark:text-[#86A98F]" />
          <span>{LIBRARY_ARTICLES.length} artículos especializados</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Buscador y Filtros por Capítulo / Especie */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        {/* Buscador de texto */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#666159] dark:text-[#9E9689] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'es'
                ? 'Buscar por tema (ej. Oxígeno, FCR, Densidad, Cal viva, Precebo, Alimento)...'
                : 'Search by topic (e.g. Oxygen, FCR, Density, Feed, Piglets)...'
            }
            className="w-full pl-10 pr-4 py-2.5 bg-[#FBF8F1] dark:bg-[#1F1C18] border border-[#DDD4C4] dark:border-[#38342F] rounded-[5px] text-sm text-[#1F1D1A] dark:text-[#EDE6DA] focus:border-[#2E4A36] outline-none"
          />
        </div>

        {/* Pestañas de Capítulos Numerados y Filtro de Especie */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-[#666159] dark:text-[#9E9689] mr-1">Capítulos:</span>
          
          <button
            onClick={() => setSelectedChapter('all')}
            className={`px-3 py-1.5 rounded-[4px] border font-medium transition ${
              selectedChapter === 'all'
                ? 'bg-[#2E4A36] text-white border-[#243B2B]'
                : 'bg-[#FBF8F1] dark:bg-[#1F1C18] text-[#1F1D1A] dark:text-[#EDE6DA] border-[#DDD4C4] dark:border-[#38342F] hover:bg-[#F2ECE0]'
            }`}
          >
            Todos los Capítulos
          </button>

          <button
            onClick={() => {
              setSelectedChapter('I');
              setSelectedSpecies('peces');
            }}
            className={`px-3 py-1.5 rounded-[4px] border font-medium flex items-center gap-1.5 transition ${
              selectedChapter === 'I'
                ? 'bg-[#3B5568] text-white border-[#2C404E]'
                : 'bg-[#FBF8F1] dark:bg-[#1F1C18] text-[#1F1D1A] dark:text-[#EDE6DA] border-[#DDD4C4] dark:border-[#38342F] hover:bg-[#F2ECE0]'
            }`}
          >
            <Fish className="w-3.5 h-3.5" />
            <span>I. Piscicultura de Precisión</span>
          </button>

          <button
            onClick={() => {
              setSelectedChapter('II');
              setSelectedSpecies('cerdos');
            }}
            className={`px-3 py-1.5 rounded-[4px] border font-medium flex items-center gap-1.5 transition ${
              selectedChapter === 'II'
                ? 'bg-[#8A4B2A] text-white border-[#6E3A20]'
                : 'bg-[#FBF8F1] dark:bg-[#1F1C18] text-[#1F1D1A] dark:text-[#EDE6DA] border-[#DDD4C4] dark:border-[#38342F] hover:bg-[#F2ECE0]'
            }`}
          >
            <span className="font-serif">🐖</span>
            <span>II. Porcicultura de Precisión</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. Estructura de Consulta Tipo Libro: Lista Izquierda + Lectura Derecha */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda (5 cols): Índice de Artículos */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#E2D9CA] dark:border-[#332E27] pb-2 text-xs">
            <span className="font-serif font-semibold text-[#1F1D1A] dark:text-[#EDE6DA]">
              Índice de Materias ({filteredArticles.length})
            </span>
            <span className="text-[#666159] dark:text-[#9E9689] font-mono">
              Selecciona para leer
            </span>
          </div>

          {filteredArticles.length === 0 ? (
            <div className="card-paper p-8 text-center text-[#666159] dark:text-[#9E9689]">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-serif">No se encontraron artículos con ese término de búsqueda.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedChapter('all');
                  setSelectedSpecies('all');
                  setSelectedTopic('all');
                }}
                className="btn-secondary text-xs mt-3 mx-auto px-3 py-1.5"
              >
                Limpiar Filtros
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredArticles.map((art) => {
                const isSelected = activeArticle?.id === art.id;
                const isPisc = art.species === 'peces';
                return (
                  <div
                    key={art.id}
                    onClick={() => setSelectedArticleId(art.id)}
                    className={`card-paper p-4 cursor-pointer transition border ${
                      isSelected
                        ? 'border-[#2E4A36] bg-[#F2ECE0] dark:bg-[#25211B]'
                        : 'hover:bg-[#F6F1E7] dark:hover:bg-[#24201B]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="notebook-stamp text-[9px] py-0 px-1.5">
                          Cap. {art.chapterNumber}
                        </span>
                        <span
                          className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-[3px] border ${
                            isPisc
                              ? 'bg-[#3B5568]/10 text-[#3B5568] dark:text-[#8EA8BA] border-[#3B5568]/30'
                              : 'bg-[#8A4B2A]/10 text-[#8A4B2A] dark:text-[#D99675] border-[#8A4B2A]/30'
                          }`}
                        >
                          {art.speciesLabel}
                        </span>
                      </div>

                      {art.status === 'aprobado' ? (
                        <span className="status-badge-green text-[9px] py-0 px-1.5">
                          Aprobado
                        </span>
                      ) : (
                        <span className="status-badge-amber text-[9px] py-0 px-1.5">
                          Borrador por revisar
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif font-semibold text-sm text-[#1F1D1A] dark:text-[#EDE6DA] leading-snug">
                      {art.title}
                    </h3>
                    <p className="text-xs text-[#666159] dark:text-[#9E9689] mt-1 line-clamp-2 leading-relaxed">
                      {art.summary}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-[#666159] dark:text-[#9E9689] mt-2 pt-2 border-t border-[#E2D9CA]/60 dark:border-[#332E27]/60">
                      <span className="font-mono">{art.topicLabel}</span>
                      <span className="font-serif italic flex items-center gap-1">
                        Leer artículo <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Columna Derecha (7 cols): Panel de Lectura Completo del Artículo */}
        <div className="lg:col-span-7">
          {activeArticle ? (
            <article className="card-paper p-6 sm:p-8 space-y-6">
              {/* Metadatos y Cabecera del Artículo */}
              <div className="border-b border-[#E2D9CA] dark:border-[#332E27] pb-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="notebook-stamp">
                    {activeArticle.chapterTitle}
                  </span>

                  {activeArticle.status === 'aprobado' ? (
                    <span className="status-badge-green text-xs">
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Validado por Zootecnista</span>
                    </span>
                  ) : (
                    <span className="status-badge-amber text-xs">
                      <FileClock className="w-3.5 h-3.5" />
                      <span>Borrador por revisar (Pendiente aprobación veterinaria)</span>
                    </span>
                  )}
                </div>

                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1F1D1A] dark:text-[#EDE6DA] tracking-tight leading-tight">
                  {activeArticle.title}
                </h2>

                <div className="flex flex-wrap items-center gap-4 text-xs text-[#666159] dark:text-[#9E9689] pt-1">
                  <span>Especie: <strong className="text-[#1F1D1A] dark:text-[#EDE6DA]">{activeArticle.speciesLabel}</strong></span>
                  <span>•</span>
                  <span>Tema: <strong className="text-[#1F1D1A] dark:text-[#EDE6DA]">{activeArticle.topicLabel}</strong></span>
                  <span>•</span>
                  <span className="font-mono">Actualizado: {activeArticle.updatedAt}</span>
                </div>
              </div>

              {/* Resumen Ejecutivo */}
              <div className="p-4 bg-[#EDF3EE] dark:bg-[#18231C] border-l-4 border-l-[#2E4A36] rounded-[4px] text-sm text-[#1F1D1A] dark:text-[#EDE6DA] leading-relaxed">
                <strong className="block font-serif text-xs uppercase tracking-wider text-[#2E4A36] dark:text-[#86A98F] mb-1">
                  Resumen Ejecutivo
                </strong>
                {activeArticle.summary}
              </div>

              {/* Cuerpo del Artículo */}
              <div className="space-y-3.5 text-sm sm:text-base leading-relaxed text-[#1F1D1A] dark:text-[#EDE6DA]">
                {activeArticle.content.map((parr, idx) => (
                  <p key={idx} className="font-serif">
                    {parr}
                  </p>
                ))}
              </div>

              {/* Cifras de Referencia Zootécnica (Tabla Editorial con números tabulares) */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between border-b border-[#E2D9CA] dark:border-[#332E27] pb-2">
                  <h4 className="font-serif font-bold text-base text-[#1F1D1A] dark:text-[#EDE6DA]">
                    Cifras Zootécnicas de Referencia
                  </h4>
                  <span className="text-[11px] font-mono text-[#666159] dark:text-[#9E9689]">
                    Valores estándar de campo
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm text-[#1F1D1A] dark:text-[#EDE6DA]">
                    <thead className="border-b border-[#DDD4C4] dark:border-[#38342F] text-[11px] uppercase tracking-wider font-semibold text-[#666159] dark:text-[#9E9689] bg-[#F4EFE3]/60 dark:bg-[#141210]/60 font-serif">
                      <tr>
                        <th className="py-2.5 px-3">Parámetro / Métrica</th>
                        <th className="py-2.5 px-3 text-[#2A6B3D] dark:text-[#86A98F]">Óptimo</th>
                        <th className="py-2.5 px-3 text-[#9C631B] dark:text-[#E0A868]">Alerta</th>
                        <th className="py-2.5 px-3 text-[#A32A26] dark:text-[#E5807D]">Crítico</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2D9CA] dark:divide-[#332E27]">
                      {activeArticle.referenceFigures.map((fig, idx) => (
                        <tr key={idx} className="hover:bg-[#F4EFE3]/40 dark:hover:bg-[#181613]">
                          <td className="py-2.5 px-3 font-medium">
                            {fig.metric} <span className="text-xs text-[#666159] dark:text-[#9E9689]">({fig.unit})</span>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#2A6B3D] dark:text-[#86A98F]">
                            {fig.optimal}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[#9C631B] dark:text-[#E0A868]">
                            {fig.warning}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[#A32A26] dark:text-[#E5807D]">
                            {fig.critical}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Errores Comunes en Campo */}
              <div className="p-4 bg-[#F8EFEA] dark:bg-[#201915] border-l-4 border-l-[#8A4B2A] rounded-[4px] space-y-2">
                <div className="flex items-center gap-2 text-xs font-serif uppercase tracking-wider font-bold text-[#8A4B2A] dark:text-[#D99675]">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Errores Comunes en Campo</span>
                </div>
                <ul className="space-y-1.5 text-xs sm:text-sm text-[#1F1D1A] dark:text-[#EDE6DA] pl-4 list-disc">
                  {activeArticle.commonErrors.map((err, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {err}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pie de Página del Artículo: Fuente Bibliográfica */}
              <div className="pt-4 border-t border-[#E2D9CA] dark:border-[#332E27] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#666159] dark:text-[#9E9689]">
                <div>
                  <span className="font-semibold block text-[#1F1D1A] dark:text-[#EDE6DA]">Fuente Bibliográfica:</span>
                  <span>{activeArticle.source}</span>
                </div>
                <div className="text-right font-mono">
                  Folio: {activeArticle.id}
                </div>
              </div>
            </article>
          ) : (
            <div className="card-paper p-12 text-center text-[#666159] dark:text-[#9E9689]">
              <p className="font-serif">Selecciona un artículo del índice para comenzar la lectura.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
