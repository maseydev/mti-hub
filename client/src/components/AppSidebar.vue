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
        v-for="item in primaryItems"
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
        v-for="item in secondaryItems"
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

const route = useRoute()

const primaryItems = [
  { to: '/dashboard', label: 'Дашборд', icon: Gauge },
  { to: '/clients', label: 'Клиенты', icon: BriefcaseBusiness },
  { to: '/projects', label: 'Проекты', icon: FolderKanban },
  { to: '/services', label: 'Регулярные услуги', icon: RefreshCw },
  { to: '/billing', label: 'Ожидаемые платежи', icon: CreditCard },
  { to: '/tasks', label: 'Задачи', icon: CheckSquare },
  { to: '/transactions', label: 'Транзакции', icon: Layers3 },
]

const secondaryItems = [
  { to: '/categories', label: 'Категории', icon: Tags },
  { to: '/accounts', label: 'Кошельки', icon: Landmark },
  { to: '/team', label: 'Команда', icon: Users },
  { to: '/telegram', label: 'Telegram', icon: Bot },
]

const isActive = (path) => route.path === path || (path !== '/dashboard' && route.path.startsWith(`${path}/`))
</script>
