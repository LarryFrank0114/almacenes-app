import axios from 'axios';

const API_URL = 'https://almacenes-app-production.up.railway.app';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (config.baseURL && config.baseURL.startsWith('http://')) {
      config.baseURL = config.baseURL.replace('http://', 'https://');
    }
    if (config.url && config.url.startsWith('http://')) {
      config.url = config.url.replace('http://', 'https://');
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
};

export const movimientoService = {
  getAll: (params) => api.get('/movimientos/', { params }),
  getById: (id) => api.get(`/movimientos/${id}/`),
  create: (data) => api.post('/movimientos/', data),
  delete: (id) => api.delete(`/movimientos/${id}/`),
};

// ✅ NUEVO: Servicios para Auditoría
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