import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/login', component: () => import('@/views/Login.vue'), meta: { public: true } },
  {
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', component: () => import('@/views/Dashboard.vue') },
      { path: 'clients', component: () => import('@/views/Clients.vue') },
      { path: 'clients/:id', component: () => import('@/views/ClientDetail.vue') },
      { path: 'projects', component: () => import('@/views/Projects.vue') },
      { path: 'projects/:id', component: () => import('@/views/ProjectDetail.vue') },
      { path: 'tasks', component: () => import('@/views/Tasks.vue') },
      { path: 'services', component: () => import('@/views/Services.vue') },
      { path: 'billing', component: () => import('@/views/Billing.vue') },
      { path: 'transactions', component: () => import('@/views/Transactions.vue') },
      { path: 'categories', component: () => import('@/views/Categories.vue') },
      { path: 'accounts', component: () => import('@/views/Accounts.vue') },
      { path: 'telegram', component: () => import('@/views/TelegramSettings.vue') },
      { path: 'team', component: () => import('@/views/Team.vue') },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.token) {
    return '/login'
  }
  if (to.path === '/login' && auth.token) {
    return '/dashboard'
  }
})

export default router
