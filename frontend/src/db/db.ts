import Dexie, { type Table } from 'dexie';

export interface PendingFeedingSync {
  id?: number;
  batchId: string;
  feedingDate: string;
  rationNumber: number;
  feedingTime: string;
  feedBrandType: string;
  suppliedQuantityKg: number;
  costPerKg: number;
  waterTemperatureC?: number;
  dissolvedOxygenMgL?: number;
  timestamp: number;
  synced: boolean;
}

export interface FieldPhoto {
  id?: number;
  batchId?: string;
  batchCode?: string;
  installationName?: string;
  dataUrl: string; // compressed base64
  caption: string;
  category: 'water_clarity' | 'fish_health' | 'pig_health' | 'feed_sample' | 'general';
  capturedAt: string; // ISO date string
  timestamp: number;
  synced: boolean;
}

export class AgroDatabase extends Dexie {
  pendingFeedings!: Table<PendingFeedingSync, number>;
  fieldPhotos!: Table<FieldPhoto, number>;

  constructor() {
    super('AgroPiscicolaDB');
    this.version(1).stores({
      pendingFeedings: '++id, batchId, timestamp, synced'
    });
    this.version(2).stores({
      pendingFeedings: '++id, batchId, timestamp, synced',
      fieldPhotos: '++id, batchId, category, capturedAt, timestamp, synced'
    });
  }
}

export const db = new AgroDatabase();
