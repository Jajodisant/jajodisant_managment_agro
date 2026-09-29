import { db, PendingFeedingSync } from '../db/db';
import { api } from './api';

export async function saveFeedingOffline(record: Omit<PendingFeedingSync, 'id' | 'timestamp' | 'synced'>): Promise<number> {
  const id = await db.pendingFeedings.add({
    ...record,
    timestamp: Date.now(),
    synced: false
  });
  return id;
}

export async function getPendingFeedingsCount(): Promise<number> {
  return await db.pendingFeedings.where('synced').equals(0).count();
}

export async function syncPendingFeedings(): Promise<{ success: number; failed: number }> {
  if (!navigator.onLine) {
    return { success: 0, failed: 0 };
  }

  const pending = await db.pendingFeedings.where('synced').equals(0).toArray();
  if (pending.length === 0) {
    return { success: 0, failed: 0 };
  }

  let successCount = 0;
  let failedCount = 0;

  // Agrupar por batchId
  const byBatch = pending.reduce((acc, item) => {
    if (!acc[item.batchId]) acc[item.batchId] = [];
    acc[item.batchId].push(item);
    return acc;
  }, {} as Record<string, PendingFeedingSync[]>);

  for (const [batchId, records] of Object.entries(byBatch)) {
    try {
      const payload = records.map(r => ({
        feedingDate: r.feedingDate,
        rationNumber: r.rationNumber,
        feedingTime: r.feedingTime,
        feedBrandType: r.feedBrandType,
        suppliedQuantityKg: r.suppliedQuantityKg,
        costPerKg: r.costPerKg,
        waterTemperatureC: r.waterTemperatureC,
        dissolvedOxygenMgL: r.dissolvedOxygenMgL
      }));

      await api.syncBatchFeeding(batchId, payload);

      // Eliminar de IndexedDB los sincronizados exitosamente
      const idsToDelete = records.map(r => r.id!).filter(Boolean);
      await db.pendingFeedings.bulkDelete(idsToDelete);
      successCount += records.length;
    } catch (err) {
      console.error(`Error sincronizando registros para el lote ${batchId}:`, err);
      failedCount += records.length;
    }
  }

  return { success: successCount, failed: failedCount };
}

// Iniciar listener global para sincronización automática
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Conexión reestablecida. Iniciando sincronización de datos locales...');
    syncPendingFeedings();
  });
}
