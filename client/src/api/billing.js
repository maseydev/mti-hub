import api from './index'
export const billingApi = {
  getItems: (params) => api.get('/billing/items', { params }),
  getItemById: (id) => api.get(`/billing/items/${id}`),
  createItem: (data) => api.post('/billing/items', data),
  updateItem: (id, data) => api.put(`/billing/items/${id}`, data),
  markPaid: (id) => api.post(`/billing/items/${id}/mark-paid`),
  generate: () => api.post('/billing/generate'),
}
