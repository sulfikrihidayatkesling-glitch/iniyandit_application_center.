import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_RAW_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export interface UploadLogoResult {
  url: string;
  source: 'firebase_storage' | 'optimized_data_uri';
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: 'Format file tidak didukung. Gunakan file PNG, JPG, JPEG, atau WebP.',
    };
  }
  if (file.size > MAX_RAW_FILE_SIZE) {
    return {
      valid: false,
      error: 'Ukuran file gambar terlalu besar (maksimal 5 MB).',
    };
  }
  return { valid: true };
}

/**
 * Optimizes an image file into a crisp, lightweight square-friendly PNG/WebP data URI (max 240x240)
 * so previews are instant and fallback storage stays well under Firestore's field limit.
 */
export async function optimizeImageToDataUrl(file: File, maxDimension = 240): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('File gambar rusak atau tidak dapat diproses.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Preserve transparency with webp or png
        let dataUrl = canvas.toDataURL('image/webp', 0.88);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/png');
        }
        resolve(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an application or portal logo to Firebase Storage with a 4.5s timeout guard,
 * falling back cleanly to an optimized data URI if Firebase Storage bucket rules are not yet initialized.
 */
export async function uploadLogoImage(
  file: File,
  folder: 'applications' | 'portal' = 'applications'
): Promise<UploadLogoResult> {
  const check = validateImageFile(file);
  if (!check.valid) {
    throw new Error(check.error);
  }

  const optimizedDataUrl = await optimizeImageToDataUrl(file, 240);

  try {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const safeName = file.name
      .replace(/\.[^/.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .slice(0, 40);
    const storagePath = `logos/${folder}/${Date.now()}-${safeName}.${ext}`;
    const storageRef = ref(storage, storagePath);

    const uploadPromise = (async () => {
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
      });
      return await getDownloadURL(snapshot.ref);
    })();

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Storage upload timeout')), 4500)
    );

    const downloadUrl = await Promise.race([uploadPromise, timeoutPromise]);
    return {
      url: downloadUrl,
      source: 'firebase_storage',
    };
  } catch {
    return {
      url: optimizedDataUrl,
      source: 'optimized_data_uri',
    };
  }
}
