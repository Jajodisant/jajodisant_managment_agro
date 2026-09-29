import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { FarmsPondsPage } from './pages/FarmsPondsPage';
import { BatchesPage } from './pages/BatchesPage';
import { BiometriesPage } from './pages/BiometriesPage';
import { FeedingPage } from './pages/FeedingPage';
import { FinancesPage } from './pages/FinancesPage';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { PwaProvider } from './context/PwaContext';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <PwaProvider>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
            <Navbar />
            <main className="flex-1 pb-24 xl:pb-10">
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/farms" element={<FarmsPondsPage />} />
                <Route path="/batches" element={<BatchesPage />} />
                <Route path="/biometries" element={<BiometriesPage />} />
                <Route path="/feeding" element={<FeedingPage />} />
                <Route path="/finances" element={<FinancesPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </PwaProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
