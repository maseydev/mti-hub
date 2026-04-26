<template>
  <aside class="border-r border-slate-800 bg-slate-950 lg:min-h-screen lg:w-72 lg:flex-none">
    <div class="flex h-16 items-center gap-3 border-b border-slate-800 px-5">
      <div class="grid size-9 place-items-center rounded-lg bg-sky-500 text-sm font-black text-slate-950">M</div>
      <div>
        <div class="text-sm font-bold text-white">MTI-HUB</div>
        <div class="ui-eyebrow">Studio finance</div>
      </div>
    </div>

    <nav class="flex gap-1 overflow-x-auto p-3 lg:block lg:space-y-1">
      <RouterLink
        v-for="item in visiblePrimary"
        :key="item.to"
        :to="item.to"
        class="flex flex-none items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition lg:flex-auto"
        :class="isActive(item.to) ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'"
      >
        <component :is="item.icon" class="size-4" />
        <span>{{ item.label }}</span>
      </RouterLink>

      <div class="mx-3 hidden border-t border-slate-800 py-2 lg:block" />

      <RouterLink
        v-for="item in visibleSecondary"
        :key="item.to"
        :to="item.to"
        class="flex flex-none items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition lg:flex-auto"
        :class="isActive(item.to) ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'"
      >
        <component :is="item.icon" class="size-4" />
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  Bot,
  BriefcaseBusiness,
  CheckSquare,
  CreditCard,
  FolderKanban,
  Gauge,
  Landmark,
  Layers3,
  RefreshCw,
  Tags,
  Users,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()

const primaryItems = [
  { to: '/dashboard', label: 'Дашборд', icon: Gauge, roles: null },
  { to: '/clients', label: 'Клиенты', icon: BriefcaseBusiness, roles: ['ADMIN', 'OWNER', 'MANAGER'] },
  { to: '/projects', label: 'Проекты', icon: FolderKanban, roles: ['ADMIN', 'OWNER', 'MANAGER'] },
  { to: '/services', label: 'Регулярные услуги', icon: RefreshCw, roles: ['ADMIN', 'OWNER'] },
  { to: '/billing', label: 'Ожидаемые платежи', icon: CreditCard, roles: ['ADMIN', 'OWNER'] },
  { to: '/tasks', label: 'Задачи', icon: CheckSquare, roles: null },
  { to: '/transactions', label: 'Транзакции', icon: Layers3, roles: ['ADMIN', 'OWNER'] },
]

const secondaryItems = [
  { to: '/categories', label: 'Категории', icon: Tags, roles: ['ADMIN', 'OWNER'] },
  { to: '/accounts', label: 'Кошельки', icon: Landmark, roles: ['ADMIN', 'OWNER'] },
  { to: '/team', label: 'Команда', icon: Users, roles: ['ADMIN', 'OWNER'] },
  { to: '/telegram', label: 'Telegram', icon: Bot, roles: null },
]

const canSee = (item) => !item.roles || item.roles.includes(auth.user?.role)

const visiblePrimary = computed(() => primaryItems.filter(canSee))
const visibleSecondary = computed(() => secondaryItems.filter(canSee))

const isActive = (path) => route.path === path || (path !== '/dashboard' && route.path.startsWith(`${path}/`))
</script>
