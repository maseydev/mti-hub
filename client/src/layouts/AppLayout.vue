<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 lg:flex">
    <AppSidebar />
    <div class="min-w-0 flex-1">
      <header class="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/85 backdrop-blur">
        <div class="flex min-h-16 items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div class="min-w-0">
            <h1 class="truncate text-lg font-semibold text-white">{{ pageTitle }}</h1>
            <p class="mt-0.5 ui-eyebrow">Billing workspace</p>
          </div>
          <div class="flex items-center gap-3">
            <router-link to="/profile" class="hidden max-w-48 truncate text-sm font-medium text-slate-400 transition hover:text-slate-100 sm:block">
              {{ auth.user?.name }}
            </router-link>
            <button class="ui-button ui-button-ghost" type="button" @click="handleLogout">
              Выйти
            </button>
          </div>
        </div>
      </header>
      <main class="px-4 py-6 sm:px-6 lg:px-8">
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
  '/profile': 'Профиль',
  '/clients': 'Клиенты',
  '/projects': 'Проекты',
  '/services': 'Регулярные услуги',
  '/billing': 'Ожидаемые платежи',
  '/transactions': 'Транзакции',
  '/categories': 'Категории',
  '/accounts': 'Кошельки',
  '/tasks': 'Задачи',
  '/team': 'Команда',
  '/telegram': 'Telegram',
}

const pageTitle = computed(() => {
  if (route.path.startsWith('/clients/') && route.params.id) return 'Карточка клиента'
  if (route.path.startsWith('/projects/') && route.params.id) return 'Проект'
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
