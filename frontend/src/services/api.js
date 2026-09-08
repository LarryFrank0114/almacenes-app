import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Servicios para Almacenes
export const warehouseService = {
  getAll: () => api.get('/almacenes'),
  getById: (id) => api.get(`/almacenes/${id}`),
  create: (data) => api.post('/almacenes', data),
  update: (id, data) => api.put(`/almacenes/${id}`, data),
  delete: (id) => api.delete(`/almacenes/${id}`),
};

// Servicios para Items
export const itemService = {
  getAll: (params) => api.get('/items', { params }),
  getById: (id) => api.get(`/items/${id}`),
  create: (data) => api.post('/items', data),
  update: (id, data) => api.put(`/items/${id}`, data),
  delete: (id) => api.delete(`/items/${id}`),
  updateStock: (id, cantidad) => api.patch(`/items/${id}/stock`, null, { params: { cantidad } }),
};

// 👈 NUEVO SERVICIO DE CONFIGURACIÓN
export const configuracionService = {
  get: () => api.get('/configuracion'),
  update: (data) => api.put('/configuracion', data),
  updateLogo: (logo_url) => api.patch('/configuracion/logo', null, { params: { logo_url } }),
};

export default api;