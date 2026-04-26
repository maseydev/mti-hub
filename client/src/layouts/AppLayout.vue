<template>
  <div class="app-layout">
    <AppSidebar />
    <div class="main-wrapper">
      <header class="app-header">
        <div class="header-left">
          <h2 class="page-title">{{ pageTitle }}</h2>
        </div>
        <div class="header-right">
          <span class="user-name">{{ auth.user?.name }}</span>
          <el-button link @click="handleLogout">Выйти</el-button>
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
  background: #f5f7fa;
}
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.app-header {
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 10;
}
.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.user-name {
  color: #606266;
  font-size: 14px;
}
.main-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}
</style>
