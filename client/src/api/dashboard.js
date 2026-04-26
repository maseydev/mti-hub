import api from './index'
export const dashboardApi = {
  getSummary: () => api.get('/dashboard/summary'),
  getUpcomingPayments: () => api.get('/dashboard/upcoming-payments'),
  getOverdue: () => api.get('/dashboard/overdue'),
  getMonthlyChart: () => api.get('/dashboard/monthly-chart'),
  getAdminTasks: () => api.get('/dashboard/admin-tasks'),
  getTeamTasks: () => api.get('/dashboard/team-tasks'),
  getMyTasks: () => api.get('/dashboard/my-tasks'),
}
