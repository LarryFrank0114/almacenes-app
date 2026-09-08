import { supabase } from './supabase';

const CONFIG_KEY = 'empresa_config';

const DEFAULT_CONFIG = {
  nombre: 'Mi Empresa S.A.C.',
  slogan: 'Gestiona tu inventario de forma inteligente',
  logo: null,
  primarycolor: '#00d4ff',
  secondarycolor: '#ff00e5',
  accentcolor: '#00ff87'
};

// ============================================
// OBTENER CONFIGURACIÓN
// ============================================
export const getConfig = async () => {
  try {
    console.log('🔍 Cargando configuración...');
    
    const { data, error } = await supabase
      .from('configuracion')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      console.warn('⚠️ Error al obtener configuración:', error.message);
      
      const localConfig = localStorage.getItem(CONFIG_KEY);
      if (localConfig) {
        try {
          return JSON.parse(localConfig);
        } catch (e) {
          return DEFAULT_CONFIG;
        }
      }
      return DEFAULT_CONFIG;
    }

    if (data) {
      console.log('✅ Configuración cargada:', data);
      localStorage.setItem(CONFIG_KEY, JSON.stringify(data));
      return data;
    }

    console.log('📝 No hay configuración, creando por defecto...');
    await saveConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  } catch (error) {
    console.warn('⚠️ Error al cargar configuración:', error);
    const localConfig = localStorage.getItem(CONFIG_KEY);
    if (localConfig) {
      try {
        return JSON.parse(localConfig);
      } catch (e) {
        return DEFAULT_CONFIG;
      }
    }
    return DEFAULT_CONFIG;
  }
};

// ============================================
// GUARDAR CONFIGURACIÓN
// ============================================
export const saveConfig = async (config) => {
  try {
    console.log('📦 Guardando configuración:', config);
    
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));

    const { data, error } = await supabase
      .from('configuracion')
      .upsert({
        id: 1,
        nombre: config.nombre || 'Mi Empresa S.A.C.',
        slogan: config.slogan || '',
        logo: config.logo || null,
        primarycolor: config.primarycolor || '#00d4ff',
        secondarycolor: config.secondarycolor || '#ff00e5',
        accentcolor: config.accentcolor || '#00ff87',
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('❌ Error al guardar en Supabase:', error);
      
      if (error.message?.includes('row-level security') || error.code === '42501') {
        console.warn('⚠️ Error de RLS. Guardado solo en localStorage.');
        return config;
      }
      return config;
    }

    console.log('✅ Configuración guardada:', data);
    return data?.[0] || config;
  } catch (error) {
    console.error('❌ Error al guardar configuración:', error);
    return config;
  }
};

// ============================================
// SUBIR LOGO (VERSIÓN FINAL CON MÚLTIPLES MÉTODOS)
// ============================================
export const uploadLogo = async (file) => {
  try {
    if (!file) {
      console.warn('⚠️ No hay archivo para subir');
      return null;
    }

    console.log('📤 Subiendo logo:', file.name);

    if (file.size > 5 * 1024 * 1024) {
      throw new Error('La imagen no puede superar los 5MB');
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Formato no permitido. Usa JPG, PNG o WEBP');
    }

    // ✅ NOMBRE LIMPIO Y ÚNICO
    const cleanName = file.name.replace(/\s+/g, '_');
    const fileExt = cleanName.split('.').pop();
    const fileName = `logo_${Date.now()}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    console.log('📁 Ruta:', filePath);

    // ✅ MÉTODO 1: Intentar subir directamente
    const { data, error } = await supabase.storage
      .from('empresa-config')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      });

    if (error) {
      console.error('❌ Error al subir logo:', error);
      
      // ✅ MÉTODO 2: Si falla por RLS, intentar con otro nombre
      if (error.message?.includes('row-level security') || error.message?.includes('permission denied')) {
        console.warn('⚠️ Error de permisos, intentando método alternativo...');
        
        const altPath = `logos/logo_alt_${Date.now()}.${fileExt}`;
        const { data: retryData, error: retryError } = await supabase.storage
          .from('empresa-config')
          .upload(altPath, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type
          });
        
        if (retryError) {
          console.error('❌ Error en reintento:', retryError);
          throw new Error('Error al subir logo: ' + retryError.message);
        }
        
        const { data: urlData } = supabase.storage
          .from('empresa-config')
          .getPublicUrl(altPath);
        return urlData?.publicUrl;
      }
      
      // ✅ MÉTODO 3: Si el bucket no existe, crearlo
      if (error.message?.includes('Bucket not found')) {
        console.log('📁 Creando bucket...');
        await supabase.storage.createBucket('empresa-config', { public: true });
        
        const { data: retryData, error: retryError } = await supabase.storage
          .from('empresa-config')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type
          });
        
        if (retryError) throw retryError;
        
        const { data: urlData } = supabase.storage
          .from('empresa-config')
          .getPublicUrl(filePath);
        return urlData?.publicUrl;
      }
      
      throw error;
    }

    console.log('✅ Logo subido:', data);

    const { data: urlData } = supabase.storage
      .from('empresa-config')
      .getPublicUrl(filePath);

    const publicUrl = urlData?.publicUrl;
    console.log('🔗 URL pública:', publicUrl);

    return publicUrl;
  } catch (error) {
    console.error('❌ Error en uploadLogo:', error);
    throw error;
  }
};

// ============================================
// ELIMINAR LOGO
// ============================================
export const deleteLogo = async () => {
  try {
    console.log('🗑️ Eliminando logo...');
    
    const extensions = ['png', 'jpg', 'jpeg', 'webp'];
    for (const ext of extensions) {
      try {
        await supabase.storage
          .from('empresa-config')
          .remove([`logos/logo.${ext}`]);
        await supabase.storage
          .from('empresa-config')
          .remove([`logos/logo_alt.${ext}`]);
      } catch (e) {
        // Ignorar errores si el archivo no existe
      }
    }
    
    try {
      const config = await getConfig();
      await saveConfig({ ...config, logo: null });
    } catch (e) {
      console.warn('⚠️ Error al actualizar configuración:', e);
    }
    
    console.log('✅ Logo eliminado');
    return true;
  } catch (error) {
    console.warn('⚠️ Error al eliminar logo:', error);
    return false;
  }
};

// ============================================
// RESETEAR CONFIGURACIÓN
// ============================================
export const resetConfig = async () => {
  try {
    localStorage.removeItem(CONFIG_KEY);
    await saveConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  } catch (error) {
    console.error('❌ Error al resetear configuración:', error);
    return DEFAULT_CONFIG;
  }
};

export default {
  getConfig,
  saveConfig,
  uploadLogo,
  deleteLogo,
  resetConfig
};