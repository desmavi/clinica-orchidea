import { supabase } from './supabase';

const BUCKET_NAME = 'doctor-photos';
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface UploadResult {
  url: string;
  path: string;
}

export const storageService = {

  // Upload to Supabase Storage
  uploadDoctorPhoto: async (file: File, doctorId?: string): Promise<UploadResult> => {
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Tipo file non supportato. Usa JPG, PNG o WebP.');
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File troppo grande. Massimo 5MB.');
    }

    // Generate unique filename
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = doctorId
      ? `${doctorId}.${extension}`
      : `${crypto.randomUUID()}.${extension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true, // Overwrite if exists
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error('Errore nel caricamento dell\'immagine.');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return {
      url: urlData.publicUrl,
      path: data.path,
    };
  },


  deleteDoctorPhoto: async (path: string): Promise<void> => {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      throw new Error('Errore nell\'eliminazione dell\'immagine.');
    }
  },

  // Extract path from full URL
  getPathFromUrl: (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split(`/${BUCKET_NAME}/`);
      return pathParts[1] || null;
    } catch {
      return null;
    }
  },
};
