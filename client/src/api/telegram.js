import api from './index'
export const telegramApi = {
  // Admin: global finance reminder settings
  getSettings: () => api.get('/telegram/settings'),
  updateSettings: (data) => api.put('/telegram/settings', data),
  test: () => api.post('/telegram/test'),
  // Admin: bot token management
  getBots: () => api.get('/telegram/bots'),
  updateBot: (type, data) => api.put(`/telegram/bots/${type}`, data),
  testBot: (type, chatId) => api.post(`/telegram/bots/${type}/test`, { chatId }),
  // User: personal telegram settings
  getMySettings: () => api.get('/telegram/me'),
  updateMySettings: (data) => api.put('/telegram/me', data),
  testMyTask: () => api.post('/telegram/me/test-task'),
}
