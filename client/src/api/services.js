import api from './index'
export const servicesApi = {
  getAll: (params) => api.get('/services', { params }),
  getById: (id) => api.get(`/services/${id}`),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  remove: (id) => api.delete(`/services/${id}`),
  pause: (id) => api.post(`/services/${id}/pause`),
  resume: (id) => api.post(`/services/${id}/resume`),
}
