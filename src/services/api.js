import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor: adjunta el token JWT automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor: redirige al login si el token expiró
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  registro: (data) => api.post('/auth/registro', data),
  getMe: () => api.get('/auth/me'),
  recuperarPassword: (email) => api.post('/auth/recuperar', { email }),
  nuevaPassword: (token, password) => api.post(`/auth/nueva-password/${token}`, { password }),
};

// ── Usuarios (superadmin) ─────────────────────────────
export const usuariosAPI = {
  getAll: (params) => api.get('/usuarios', { params }),
  cambiarEstado: (id, estado) => api.put(`/usuarios/${id}/estado`, { estado }),
  cambiarRol: (id, rol) => api.put(`/usuarios/${id}/rol`, { rol }),
  eliminar: (id) => api.delete(`/usuarios/${id}`),
};

// ── Turnos ────────────────────────────────────────────
export const turnosAPI = {
  getAll: (params) => api.get('/turnos', { params }),
  getHoy: () => api.get('/turnos/hoy'),
  getSemana: () => api.get('/turnos/semana'),
  getById: (id) => api.get(`/turnos/${id}`),
  crear: (data) => api.post('/turnos', data),
  actualizar: (id, data) => api.put(`/turnos/${id}`, data),
  cambiarEstado: (id, estado) => api.patch(`/turnos/${id}/estado`, { estado }),
  eliminar: (id) => api.delete(`/turnos/${id}`),
  exportarPDF: (fecha) => api.get('/turnos/exportar/pdf', { params: { fecha }, responseType: 'blob' }),
};

// ── Pacientes ─────────────────────────────────────────
export const pacientesAPI = {
  getAll: (params) => api.get('/pacientes', { params }),
  getById: (id) => api.get(`/pacientes/${id}`),
  getTurnos: (id, params) => api.get(`/pacientes/${id}/turnos`, { params }),
  crear: (data) => api.post('/pacientes', data),
  actualizar: (id, data) => api.put(`/pacientes/${id}`, data),
  agregarHistorial: (id, data) => api.post(`/pacientes/${id}/historial`, data),
  actualizarHistorial: (id, historialId, data) => api.put(`/pacientes/${id}/historial/${historialId}`, data),
  eliminar: (id) => api.delete(`/pacientes/${id}`),
  getCumpleanos: (periodo) => api.get('/pacientes/cumpleanos', { params: { periodo } }),
  getStats: () => api.get('/pacientes/stats'),
  getPendientes: () => api.get('/pacientes/pendientes'),
};

// ── Configuracion ─────────────────────────────────────
export const configuracionAPI = {
  get: () => api.get('/configuracion'),
  actualizar: (data) => api.put('/configuracion', data),
  whatsappQR: () => api.get('/configuracion/whatsapp/qr'),
  whatsappStatus: () => api.get('/configuracion/whatsapp/status'),
};


export default api;
