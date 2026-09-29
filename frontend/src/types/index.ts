export interface Farm {
  id: string;
  name: string;
  ownerId: string;
  location: string | null;
  pondsCount: number;
  createdAt: string;
}

export interface Pond {
  id: string;
  farmId: string;
  farmName: string;
  codeName: string;
  pondType: string;
  lengthM: number;
  widthM: number;
  avgDepthM: number;
  volumeM3: number;
  hasAeration: boolean;
  maxDensityKgM3: number;
  maxBiomassCapacityKg: number;
  isActive: boolean;
  createdAt: string;
}

export interface Species {
  id: string;
  commonName: string;
  scientificName: string | null;
  expectedFcr: number;
  optimalTempMin: number;
  optimalTempMax: number;
  minOxygenMgL: number;
  feedingTablesCount: number;
}

export interface FeedingTable {
  id: string;
  speciesId: string;
  speciesCommonName: string;
  minWeightG: number;
  maxWeightG: number;
  biomassPercentage: number;
  dailyFrequency: number;
  suggestedProteinPct: number | null;
}

export interface Batch {
  id: string;
  farmId: string;
  farmName: string;
  pondId: string | null;
  pondCodeName: string | null;
  penId?: string | null;
  penCode?: string | null;
  barnCodeName?: string | null;
  speciesId: string;
  speciesCommonName: string;
  batchCode: string;
  stockingDate: string;
  initialQuantity: number;
  initialAvgWeightG: number;
  initialBiomassKg: number;
  status: string;
  estimatedHarvestDate: string | null;
  actualHarvestDate: string | null;
  overcrowdingWarning: boolean;
  overcrowdingPercentage: number;
  createdAt: string;
}

export interface Biometry {
  id: string;
  batchId: string;
  batchCode: string;
  samplingDate: string;
  sampledCount: number;
  totalSampleWeightG: number;
  calculatedAvgWeightG: number;
  observedMortality: number;
  estimatedBiomassKg: number;
  remainingPopulation: number | null;
  netBiomassGainedKg: number | null;
  accumulatedFeedKg: number | null;
  accumulatedFcr: number | null;
  fcrStatus: 'GREEN' | 'AMBER' | 'RED';
  dailyWeightGainG: number;
  observations: string | null;
  createdAt: string;
}

export interface FeedingRecord {
  id: string;
  batchId: string;
  batchCode: string;
  feedingDate: string;
  rationNumber: number;
  feedingTime: string;
  feedBrandType: string;
  suppliedQuantityKg: number;
  costPerKg: number;
  totalRationCost: number;
  waterTemperatureC: number | null;
  dissolvedOxygenMgL: number | null;
  createdAt: string;
}

export interface DailyFeedingPlan {
  batchId: string;
  batchCode: string;
  speciesCommonName: string;
  currentAvgWeightG: number;
  currentBiomassKg: number;
  recommendedBiomassPercentage: number;
  totalDailyQuotaKg: number;
  dailyFrequency: number;
  rationQuotaKg: number;
  suggestedHours: string[];
  suggestedProteinPct: number;
}

export interface BatchFinancialSummary {
  batchId: string;
  batchCode: string;
  currentBiomassKg: number;
  feedCost: number;
  fingerlingsCost: number;
  laborCost: number;
  energyCost: number;
  otherCosts: number;
  totalCumulativeCost: number;
  costPerKgProduced: number;
}

export interface CostRecord {
  id: string;
  farmId: string;
  batchId: string | null;
  batchCode: string | null;
  expenseDate: string;
  category: string;
  description: string;
  totalAmount: number;
  createdAt: string;
}

export interface HarvestOptimization {
  batchId: string;
  batchCode: string;
  speciesName: string;
  currentAvgWeightG: number;
  targetCommercialWeightG: number;
  currentBiomassKg: number;
  activePopulation: number;
  daysInProduction: number;
  accumulatedFcr: number;
  marginalFcr: number;
  averageFeedCostPerKg: number;
  marginalCostPerKgGain: number;
  marketPricePerKg: number;
  marginalProfitPerKgGain: number;
  dailyBiomassGainKg: number;
  projectedDailyProfitOrLoss: number;
  harvestStatus: 'OPTIMAL_HARVEST' | 'APPROACHING_HARVEST' | 'GROWTH_PHASE';
  recommendationTitle: string;
  recommendationMessage: string;
  recommendedHarvestDate: string;
  isPastOptimalPoint: boolean;
}

export interface SwineBarn {
  id: string;
  farmId: string;
  codeName: string;
  barnType: string;
  lengthM: number;
  widthM: number;
  totalAreaM2: number;
  hasAutomaticVentilation: boolean;
  hasCoolingSystem: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface SwinePen {
  id: string;
  barnId: string;
  penCode: string;
  phase: string;
  lengthM: number;
  widthM: number;
  areaM2: number;
  drinkerType: string;
  drinkerCount: number;
  feederSpaces: number;
  maxDensityM2PerPig: number;
  maxCapacityPigs: number;
  isActive: boolean;
  createdAt: string;
}


