import api from './index'

export const notesApi = {
  getAll: (params) => api.get('/notes', { params }),
  getById: (id) => api.get(`/notes/${id}`),
  create: (data) => api.post('/notes', data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  remove: (id) => api.delete(`/notes/${id}`),
  pin: (id) => api.post(`/notes/${id}/pin`),
  unpin: (id) => api.post(`/notes/${id}/unpin`),
  archive: (id) => api.post(`/notes/${id}/archive`),
  unarchive: (id) => api.post(`/notes/${id}/unarchive`),
}
