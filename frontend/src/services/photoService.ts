import { db, FieldPhoto } from '../db/db';

/**
 * Servicio de procesamiento y almacenamiento local de fotografías de campo (HU-Fotos Offline).
 * Comprime imágenes en el cliente para uso eficiente de IndexedDB sin requerir conectividad.
 */
export const compressImage = (file: File, maxWidth = 1024, quality = 0.75): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(img.src);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const saveFieldPhoto = async (photoData: {
  batchId?: string;
  batchCode?: string;
  installationName?: string;
  dataUrl: string;
  caption: string;
  category: 'water_clarity' | 'fish_health' | 'pig_health' | 'feed_sample' | 'general';
  capturedAt?: string;
}): Promise<number> => {
  const photo: FieldPhoto = {
    ...photoData,
    capturedAt: photoData.capturedAt || new Date().toISOString().split('T')[0],
    timestamp: Date.now(),
    synced: false
  };

  return (await db.fieldPhotos.add(photo)) as number;
};

export const getFieldPhotos = async (batchId?: string): Promise<FieldPhoto[]> => {
  if (batchId) {
    return await db.fieldPhotos.where('batchId').equals(batchId).reverse().sortBy('timestamp');
  }
  return await db.fieldPhotos.orderBy('timestamp').reverse().toArray();
};

export const deleteFieldPhoto = async (id: number): Promise<void> => {
  await db.fieldPhotos.delete(id);
};
