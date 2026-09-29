import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { FarmsPondsPage } from './pages/FarmsPondsPage';
import { BatchesPage } from './pages/BatchesPage';
import { BiometriesPage } from './pages/BiometriesPage';
import { FeedingPage } from './pages/FeedingPage';
import { FinancesPage } from './pages/FinancesPage';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 pb-16 md:pb-8">
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
  );
};

export default App;
