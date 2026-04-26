<template>
  <div class="app-layout">
    <AppSidebar />
    <div class="main-wrapper">
      <header class="app-header">
        <div class="header-left">
          <h2 class="page-title">{{ pageTitle }}</h2>
          <span class="page-kicker">Billing workspace</span>
        </div>
        <div class="header-right">
          <span class="user-name">{{ auth.user?.name }}</span>
          <el-button class="logout-btn" link @click="handleLogout">Выйти</el-button>
        </div>
      </header>
      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppSidebar from '@/components/AppSidebar.vue'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const titles = {
  '/dashboard': 'Дашборд',
  '/clients': 'Клиенты',
  '/projects': 'Проекты',
  '/services': 'Услуги и продления',
  '/billing': 'Счета к оплате',
  '/transactions': 'Транзакции',
  '/categories': 'Категории',
  '/accounts': 'Счета и кошельки',
  '/telegram': 'Telegram',
}

const pageTitle = computed(() => {
  if (route.path.startsWith('/clients/') && route.params.id) return 'Карточка клиента'
  return titles[route.path] || 'MTI-HUB'
})

const handleLogout = () => {
  auth.logout()
  router.push('/login')
}

onMounted(() => {
  if (!auth.user) auth.fetchMe()
})
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: var(--app-bg);
  color: var(--app-text);
}
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.app-header {
  min-height: 68px;
  background: rgba(11, 13, 16, 0.84);
  border-bottom: 1px solid var(--app-border);
  backdrop-filter: blur(16px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 28px;
  position: sticky;
  top: 0;
  z-index: 10;
}
.header-left {
  min-width: 0;
}
.page-title {
  font-size: 20px;
  line-height: 1.2;
  font-weight: 750;
  color: var(--app-text);
  margin: 0;
}
.page-kicker {
  display: block;
  margin-top: 4px;
  color: var(--app-text-muted);
  font-size: 12px;
  text-transform: uppercase;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.user-name {
  max-width: 220px;
  overflow: hidden;
  color: var(--app-text-soft);
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.logout-btn {
  color: var(--app-text-muted) !important;
}
.main-content {
  flex: 1;
  padding: 28px;
  overflow-y: auto;
}
@media (max-width: 900px) {
  .app-layout {
    flex-direction: column;
  }
  .app-header {
    padding: 14px 16px;
  }
  .main-content {
    padding: 16px;
  }
}
</style>
