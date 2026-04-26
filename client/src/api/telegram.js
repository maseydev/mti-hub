import api from './index'
export const telegramApi = {
  getSettings: () => api.get('/telegram/settings'),
  updateSettings: (data) => api.put('/telegram/settings', data),
  test: () => api.post('/telegram/test'),
}
