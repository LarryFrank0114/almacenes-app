import axios from 'axios';

const API_URL = 'https://almacenes-app-production.up.railway.app';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Interceptor para forzar HTTPS y enviar email del usuario
api.interceptors.request.use(
  (config) => {
    // Forzar HTTPS
    if (config.baseURL && config.baseURL.startsWith('http://')) {
      config.baseURL = config.baseURL.replace('http://', 'https://');
    }
    if (config.url && config.url.startsWith('http://')) {
      config.url = config.url.replace('http://', 'https://');
    }
    
    // ✅ Enviar email del usuario logueado (si existe)
    if (typeof window !== 'undefined') {
      try {
        // Intentar obtener el email desde Supabase Auth
        const authData = localStorage.getItem('sb-voiarysvrncxnyegsitm-auth-token');
        if (authData) {
          const parsed = JSON.parse(authData);
          if (parsed?.user?.email) {
            config.headers['X-User-Email'] = parsed.user.email;
          }
        }
        
        // Fallback: buscar en localStorage 'user'
        if (!config.headers['X-User-Email']) {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            if (user?.email) {
              config.headers['X-User-Email'] = user.email;
            }
          }
        }
      } catch (e) {
        // Silencioso
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

export const warehouseService = {
  getAll: () => api.get('/almacenes/'),
  getById: (id) => api.get(`/almacenes/${id}/`),
  create: (data) => api.post('/almacenes/', data),
  update: (id, data) => api.put(`/almacenes/${id}/`, data),
  delete: (id) => api.delete(`/almacenes/${id}/`),
};

export const itemService = {
  getPaginated: (params) => api.get('/items/', { params }),
  getAll: (params) => api.get('/items/', { params }),
  getById: (id) => api.get(`/items/${id}/`),
  create: (data) => api.post('/items/', data),
  update: (id, data) => api.put(`/items/${id}/`, data),
  delete: (id) => api.delete(`/items/${id}/`),
  updateStock: (id, cantidad) => api.patch(`/items/${id}/stock`, null, { params: { cantidad } }),
  getStats: () => api.get('/items/stats/count'),
  
  // ✅ NUEVO: Analizar Excel sin modificar la BD
  // Retorna: { total_filas, total_cambios, total_no_encontrados, total_errores, cambios: [...], no_encontrados: [...], errores: [...] }
  previewBulkUpdate: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/items/preview-bulk-update', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // ✅ NUEVO: Aplicar los cambios aprobados
  // Recibe: [{ item_id, stock_nuevo }, ...]
  // Retorna: { message, actualizados, errores, detalle_errores }
  applyBulkUpdate: (cambios) => {
    return api.post('/items/apply-bulk-update', cambios);
  },
};

export const movimientoService = {
  getAll: (params) => api.get('/movimientos/', { params }),
  getById: (id) => api.get(`/movimientos/${id}/`),
  create: (data) => api.post('/movimientos/', data),
  delete: (id) => api.delete(`/movimientos/${id}/`),
};

export const auditService = {
  getAll: (params) => api.get('/audit-log/', { params }),
  getStats: () => api.get('/audit-log/stats'),
  getItemHistory: (itemId) => api.get(`/audit-log/item/${itemId}`),
};

export const configuracionService = {
  get: () => api.get('/configuracion/'),
  update: (data) => api.put('/configuracion/', data),
  updateLogo: (logo_url) => api.patch('/configuracion/logo', null, { params: { logo_url } }),
};

export default api;