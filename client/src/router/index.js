import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const ADMIN_ROLES = ['ADMIN', 'OWNER']
const MANAGER_ROLES = ['ADMIN', 'OWNER', 'MANAGER']

const routes = [
  { path: '/login', component: () => import('@/views/Login.vue'), meta: { public: true } },
  { path: '/forbidden', component: () => import('@/views/Forbidden.vue'), meta: { public: true } },
  {
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', component: () => import('@/views/Dashboard.vue') },
      { path: 'profile', component: () => import('@/views/Profile.vue') },
      { path: 'clients', component: () => import('@/views/Clients.vue'), meta: { roles: MANAGER_ROLES } },
      { path: 'clients/:id', component: () => import('@/views/ClientDetail.vue'), meta: { roles: MANAGER_ROLES } },
      { path: 'projects', component: () => import('@/views/Projects.vue'), meta: { roles: MANAGER_ROLES } },
      { path: 'projects/:id', component: () => import('@/views/ProjectDetail.vue') },
      { path: 'tasks', component: () => import('@/views/Tasks.vue') },
      { path: 'notes', component: () => import('@/views/NotesView.vue') },
      { path: 'services', component: () => import('@/views/Services.vue'), meta: { roles: ADMIN_ROLES } },
      { path: 'billing', component: () => import('@/views/Billing.vue'), meta: { roles: ADMIN_ROLES } },
      { path: 'transactions', component: () => import('@/views/Transactions.vue'), meta: { roles: ADMIN_ROLES } },
      { path: 'categories', component: () => import('@/views/Categories.vue'), meta: { roles: ADMIN_ROLES } },
      { path: 'accounts', component: () => import('@/views/Accounts.vue'), meta: { roles: ADMIN_ROLES } },
      { path: 'telegram', component: () => import('@/views/TelegramSettings.vue') },
      { path: 'team', component: () => import('@/views/Team.vue'), meta: { roles: ADMIN_ROLES } },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.token) return '/login'
  if (to.path === '/login' && auth.token) return '/dashboard'

  if (to.meta.roles && auth.user) {
    if (!to.meta.roles.includes(auth.user.role)) return '/forbidden'
  }
})

export default router
