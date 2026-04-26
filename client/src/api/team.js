import api from './index'

export const teamApi = {
  getAll: () => api.get('/team'),
  getById: (id) => api.get(`/team/${id}`),
  create: (data) => api.post('/team', data),
  update: (id, data) => api.put(`/team/${id}`, data),
  deactivate: (id) => api.delete(`/team/${id}`),
}
