import { supabase } from './supabase';

// ✅ Subir imagen (SIN upsert, solo INSERT)
export const uploadImage = async (file, folder = 'imagenes') => {
  try {
    if (!file) {
      console.error('❌ No hay archivo para subir');
      return null;
    }

    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const cleanName = file.name.replace(/\s/g, '_').replace(/[^\w.-]/g, '');
    const fileName = `${timestamp}-${cleanName}`;
    
    // ✅ Usar la carpeta 'imagenes'
    const filePath = `${folder}/${fileName}`;

    // ✅ SIN upsert (solo INSERT)
    const { data, error } = await supabase.storage
      .from('almacenes-imagenes')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,  // ✅ CAMBIO: false en lugar de true
        contentType: file.type
      });

    if (error) {
      console.error('❌ Error detallado de Storage:', error);
      throw error;
    }

    const { data: urlData } = supabase.storage
      .from('almacenes-imagenes')
      .getPublicUrl(filePath);

    return urlData?.publicUrl;
  } catch (error) {
    console.error('❌ Error en uploadImage:', error);
    throw error;
  }
};

// ✅ Eliminar imagen
export const deleteImage = async (url) => {
  try {
    if (!url) return true;
    
    const path = url.split('/almacenes-imagenes/')[1];
    
    const { error } = await supabase.storage
      .from('almacenes-imagenes')
      .remove([path]);

    if (error) return false;
    return true;
  } catch (error) {
    return false;
  }
};

// ✅ Función para obtener URL pública
export const getPublicUrl = (path) => {
  try {
    const { data } = supabase.storage
      .from('almacenes-imagenes')
      .getPublicUrl(path);
    return data?.publicUrl || null;
  } catch (error) {
    return null;
  }
};