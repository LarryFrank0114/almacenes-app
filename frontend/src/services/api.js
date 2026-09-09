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
  getAll: () => api.get('/almacenes/'),  // ✅ Barra final
  getById: (id) => api.get(`/almacenes/${id}/`),  // ✅ Barra final
  create: (data) => api.post('/almacenes/', data),  // ✅ Barra final
  update: (id, data) => api.put(`/almacenes/${id}/`, data),  // ✅ Barra final
  delete: (id) => api.delete(`/almacenes/${id}/`),  // ✅ Barra final
};

// Servicios para Items
export const itemService = {
  getAll: (params) => api.get('/items/', { params }),  // ✅ Barra final
  getById: (id) => api.get(`/items/${id}/`),  // ✅ Barra final
  create: (data) => api.post('/items/', data),  // ✅ Barra final
  update: (id, data) => api.put(`/items/${id}/`, data),  // ✅ Barra final
  delete: (id) => api.delete(`/items/${id}/`),  // ✅ Barra final
  updateStock: (id, cantidad) => api.patch(`/items/${id}/stock`, null, { params: { cantidad } }),  // ✅ Barra final
};

// 👈 NUEVO SERVICIO DE CONFIGURACIÓN
export const configuracionService = {
  get: () => api.get('/configuracion/'),  // ✅ Barra final
  update: (data) => api.put('/configuracion/', data),  // ✅ Barra final
  updateLogo: (logo_url) => api.patch('/configuracion/logo', null, { params: { logo_url } }),  // ✅ Barra final
};

export default api;
