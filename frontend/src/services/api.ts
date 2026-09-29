import {
  Farm,
  Pond,
  Species,
  FeedingTable,
  Batch,
  Biometry,
  FeedingRecord,
  DailyFeedingPlan,
  BatchFinancialSummary,
  CostRecord,
  HarvestOptimization,
  SwineBarn,
  SwinePen,
  VetConsultation,
  CreateVetConsultationRequest
} from '../types';

const BASE_URL = '/api/v1';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorMessage = `Error HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // Ignorar fallback JSON
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Granjas
  getFarms: () => request<Farm[]>('/farms'),
  createFarm: (data: { name: string; location?: string }) =>
    request<Farm>('/farms', { method: 'POST', body: JSON.stringify(data) }),

  // Estanques (HU-01)
  getPonds: (farmId: string) => request<Pond[]>(`/farms/${farmId}/ponds`),
  createPond: (farmId: string, data: {
    codeName: string;
    pondType?: string;
    lengthM?: number;
    widthM?: number;
    avgDepthM: number;
    hasAeration: boolean;
    maxDensityKgM3?: number;
  }) => request<Pond>(`/farms/${farmId}/ponds`, { method: 'POST', body: JSON.stringify(data) }),

  // Especies
  getSpecies: () => request<Species[]>('/species'),
  getFeedingTables: (speciesId: string) => request<FeedingTable[]>(`/species/${speciesId}/feeding-tables`),

  // Lotes (HU-02)
  getBatchesByFarm: (farmId: string) => request<Batch[]>(`/batches/farm/${farmId}`),
  createBatch: (data: {
    farmId: string;
    pondId?: string;
    penId?: string;
    speciesId: string;
    batchCode: string;
    stockingDate: string;
    initialQuantity: number;
    initialAvgWeightG: number;
    targetHarvestWeightG?: number;
    estimatedHarvestDate?: string;
    forceStocking?: boolean;
  }) => request<Batch>('/batches', { method: 'POST', body: JSON.stringify(data) }),
  updateBatchStatus: (batchId: string, status: string) =>
    request<Batch>(`/batches/${batchId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Biometrías (HU-05)
  getBiometries: (batchId: string) => request<Biometry[]>(`/batches/${batchId}/biometries`),
  recordBiometry: (batchId: string, data: {
    samplingDate: string;
    sampledCount: number;
    totalSampleWeightG: number;
    observedMortality?: number;
    observations?: string;
  }) => request<Biometry>(`/batches/${batchId}/biometries`, { method: 'POST', body: JSON.stringify(data) }),

  // Alimentación (HU-03, HU-04)
  getDailyFeedingPlan: (batchId: string) => request<DailyFeedingPlan>(`/batches/${batchId}/feeding/plan`),
  getFeedingHistory: (batchId: string) => request<FeedingRecord[]>(`/batches/${batchId}/feeding`),
  recordFeeding: (batchId: string, data: {
    feedingDate?: string;
    rationNumber?: number;
    feedingTime: string;
    feedBrandType: string;
    suppliedQuantityKg: number;
    costPerKg: number;
    waterTemperatureC?: number;
    dissolvedOxygenMgL?: number;
  }) => request<FeedingRecord>(`/batches/${batchId}/feeding`, { method: 'POST', body: JSON.stringify(data) }),
  syncBatchFeeding: (batchId: string, records: any[]) =>
    request<FeedingRecord[]>(`/batches/${batchId}/feeding/batch-sync`, {
      method: 'POST',
      body: JSON.stringify({ records })
    }),

  // Finanzas y Costos (HU-06)
  getBatchFinancialSummary: (batchId: string) => request<BatchFinancialSummary>(`/costs/batch/${batchId}/summary`),
  recordCost: (data: {
    farmId: string;
    batchId?: string;
    expenseDate?: string;
    category: string;
    description: string;
    totalAmount: number;
  }) => request<CostRecord>('/costs', { method: 'POST', body: JSON.stringify(data) }),

  // Optimización de Cosecha & Inflexión Biológica (HU-07)
  getHarvestOptimization: (batchId: string, marketPrice?: number) => {
    const params = marketPrice ? `?marketPrice=${marketPrice}` : '';
    return request<HarvestOptimization>(`/advisory/harvest-optimization/${batchId}${params}`);
  },
  getFarmHarvestOptimizations: (farmId: string, marketPrice?: number) => {
    const params = marketPrice ? `?marketPrice=${marketPrice}` : '';
    return request<HarvestOptimization[]>(`/advisory/harvest-optimization/farm/${farmId}${params}`);
  },

  // Infraestructura Porcícola (HU-10)
  getSwineBarns: (farmId: string) => request<SwineBarn[]>(`/swine/barns/farm/${farmId}`),
  createSwineBarn: (data: {
    farmId: string;
    codeName: string;
    barnType?: string;
    lengthM?: number;
    widthM?: number;
    hasAutomaticVentilation?: boolean;
    hasCoolingSystem?: boolean;
  }) => request<SwineBarn>('/swine/barns', { method: 'POST', body: JSON.stringify(data) }),
  getSwinePens: (barnId: string) => request<SwinePen[]>(`/swine/pens/barn/${barnId}`),
  createSwinePen: (data: {
    barnId: string;
    penCode: string;
    phase?: string;
    lengthM: number;
    widthM: number;
    drinkerType?: string;
    drinkerCount?: number;
    feederSpaces?: number;
  }) => request<SwinePen>('/swine/pens', { method: 'POST', body: JSON.stringify(data) }),

  // Consultorio Veterinario Asistido por IA (HU-12)
  createVetConsultation: (data: CreateVetConsultationRequest) =>
    request<VetConsultation>('/advisory/vet/consultations', { method: 'POST', body: JSON.stringify(data) }),
  getVetConsultationsByFarm: (farmId: string) =>
    request<VetConsultation[]>(`/advisory/vet/consultations/farm/${farmId}`),
  getVetConsultationsByBatch: (batchId: string) =>
    request<VetConsultation[]>(`/advisory/vet/consultations/batch/${batchId}`)
};
