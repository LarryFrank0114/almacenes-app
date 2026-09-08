// ============================================
// CONFIGURACIÓN DE LA EMPRESA (FALLBACK)
// ============================================
// Este archivo se usa como configuración por defecto
// mientras el Navbar carga los datos desde la base de datos.
// Los cambios en tiempo real se obtienen de la tabla 'configuracion'.

export const companyConfig = {
  // ============ DATOS DE LA EMPRESA ============
  name: 'Mi Empresa S.A.C.',
  slogan: 'Gestiona tu inventario de forma inteligente',
  
  // ============ LOGO Y FAVICON ============
  logo: '/logo.png',           // Coloca tu logo en public/logo.png
  favicon: '/favicon.ico',     // Coloca tu favicon en public/favicon.ico
  
  // ============ COLORES DE LA EMPRESA ============
  primaryColor: '#00d4ff',      // Color principal (azul neón)
  secondaryColor: '#ff00e5',    // Color secundario (rosa neón)
  accentColor: '#00ff87',       // Color de acento (verde neón)
  
  // ============ CONFIGURACIÓN AVANZADA ============
  colors: {
    primary: '#00d4ff',
    secondary: '#ff00e5',
    accent: '#00ff87',
    background: '#0a0a0f',
    text: '#ffffff',
  },
  
  // ============ METADATOS ============
  description: 'Sistema de gestión de almacenes e inventario',
  keywords: 'almacenes, inventario, gestión, stock, productos',
  author: 'Tu Empresa',
  
  // ============ REDES SOCIALES ============
  social: {
    facebook: 'https://facebook.com/tuempresa',
    instagram: 'https://instagram.com/tuempresa',
    twitter: 'https://twitter.com/tuempresa',
    linkedin: 'https://linkedin.com/company/tuempresa',
  },
  
  // ============ CONTACTO ============
  contact: {
    email: 'info@tuempresa.com',
    phone: '+51 999 999 999',
    address: 'Av. Principal 123, Lima, Perú',
  },
  
  // ============ HORARIO ============
  schedule: {
    monday: '8:00 AM - 6:00 PM',
    tuesday: '8:00 AM - 6:00 PM',
    wednesday: '8:00 AM - 6:00 PM',
    thursday: '8:00 AM - 6:00 PM',
    friday: '8:00 AM - 6:00 PM',
    saturday: '9:00 AM - 1:00 PM',
    sunday: 'Cerrado',
  },
};

// ============================================
// EXPORTAR CONFIGURACIÓN POR DEFECTO
// ============================================
export default companyConfig;

// ============================================
// FUNCIÓN PARA OBTENER CONFIGURACIÓN DINÁMICA
// ============================================
export const getCompanyConfig = () => {
  // Esta función permite obtener la configuración actualizada
  // desde localStorage si existe, o usar la configuración por defecto
  try {
    const savedConfig = localStorage.getItem('empresa_config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      return {
        ...companyConfig,
        name: parsed.nombre || companyConfig.name,
        slogan: parsed.slogan || companyConfig.slogan,
        logo: parsed.logo || companyConfig.logo,
        primaryColor: parsed.primarycolor || companyConfig.primaryColor,
        secondaryColor: parsed.secondarycolor || companyConfig.secondaryColor,
        accentColor: parsed.accentcolor || companyConfig.accentColor,
        colors: {
          primary: parsed.primarycolor || companyConfig.colors.primary,
          secondary: parsed.secondarycolor || companyConfig.colors.secondary,
          accent: parsed.accentcolor || companyConfig.colors.accent,
          background: companyConfig.colors.background,
          text: companyConfig.colors.text,
        }
      };
    }
  } catch (error) {
    console.warn('⚠️ Error al cargar configuración desde localStorage:', error);
  }
  return companyConfig;
};

// ============================================
// FUNCIÓN PARA ACTUALIZAR LA CONFIGURACIÓN
// ============================================
export const updateCompanyConfig = (newConfig) => {
  try {
    localStorage.setItem('empresa_config', JSON.stringify(newConfig));
    // Disparar evento para actualizar componentes
    window.dispatchEvent(new CustomEvent('companyConfigUpdated', { detail: newConfig }));
    return true;
  } catch (error) {
    console.error('❌ Error al guardar configuración:', error);
    return false;
  }
};