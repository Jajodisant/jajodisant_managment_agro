import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { FarmsPondsPage } from './pages/FarmsPondsPage';
import { BatchesPage } from './pages/BatchesPage';
import { BiometriesPage } from './pages/BiometriesPage';
import { FeedingPage } from './pages/FeedingPage';
import { FinancesPage } from './pages/FinancesPage';
import { LibraryPage } from './pages/LibraryPage';
import { StatsPage } from './pages/StatsPage';
import { VetConsultationPage } from './pages/VetConsultationPage';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { PwaProvider } from './context/PwaContext';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <PwaProvider>
          <AppLayout>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/farms" element={<FarmsPondsPage />} />
              <Route path="/batches" element={<BatchesPage />} />
              <Route path="/biometries" element={<BiometriesPage />} />
              <Route path="/feeding" element={<FeedingPage />} />
              <Route path="/finances" element={<FinancesPage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/vet-consult" element={<VetConsultationPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppLayout>
        </PwaProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
