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

export class AgroDatabase extends Dexie {
  pendingFeedings!: Table<PendingFeedingSync, number>;

  constructor() {
    super('AgroPiscicolaDB');
    this.version(1).stores({
      pendingFeedings: '++id, batchId, timestamp, synced'
    });
  }
}

export const db = new AgroDatabase();
