<template>
  <div class="space-y-5">
    <!-- Finance dashboard (ADMIN) -->
    <template v-if="auth.isAdmin">
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <div v-for="stat in stats" :key="stat.label" class="ui-card p-5">
          <div class="ui-eyebrow">{{ stat.label }}</div>
          <div class="mt-3 text-2xl font-semibold ui-number" :class="stat.className">{{ stat.value }}</div>
          <div v-if="stat.sub" class="mt-1 text-sm ui-number text-slate-500">{{ stat.sub }}</div>
        </div>
      </div>

      <div class="grid gap-5 xl:grid-cols-2">
        <section class="ui-card">
          <div class="ui-card-header">Предстоящие платежи (30 дней)</div>
          <div class="ui-table-scroll">
            <table class="ui-table">
              <thead>
                <tr>
                  <th>Клиент</th>
                  <th>Услуга</th>
                  <th>Сумма</th>
                  <th>Дата</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in upcoming" :key="row.id">
                  <td>{{ row.client?.name || '—' }}</td>
                  <td class="max-w-64 truncate">{{ row.title }}</td>
                  <td>{{ fmt(row.amount) }}</td>
                  <td>{{ fmtDate(row.dueDate) }}</td>
                  <td><StatusBadge :status="row.status" domain="billing" /></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="!upcoming.length && !loading" class="ui-empty m-5">Нет предстоящих платежей</div>
        </section>

        <section class="ui-card">
          <div class="ui-card-header text-rose-300">Просроченные платежи</div>
          <div class="ui-table-scroll">
            <table class="ui-table">
              <thead>
                <tr>
                  <th>Клиент</th>
                  <th>Услуга</th>
                  <th>Сумма</th>
                  <th>Дата</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in overdue" :key="row.id">
                  <td>{{ row.client?.name || '—' }}</td>
                  <td class="max-w-64 truncate">{{ row.title }}</td>
                  <td>{{ fmt(row.amount) }}</td>
                  <td class="ui-number font-semibold text-rose-300">{{ fmtDate(row.dueDate) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="!overdue.length && !loading" class="ui-empty m-5">Просроченных платежей нет</div>
        </section>
      </div>

      <section class="ui-card">
        <div class="ui-card-header">Доходы и расходы за 6 месяцев</div>
        <div class="ui-table-scroll">
          <table class="ui-table">
            <thead>
              <tr>
                <th>Месяц</th>
                <th>Доходы</th>
                <th>Расходы</th>
                <th>Прибыль</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in chart" :key="row.label">
                <td>{{ row.label }}</td>
                <td class="ui-number metric-positive">{{ fmt(row.income) }}</td>
                <td class="ui-number metric-negative">{{ fmt(row.expense) }}</td>
                <td class="ui-number" :class="row.income - row.expense >= 0 ? 'metric-positive' : 'metric-negative'">
                  {{ fmt(row.income - row.expense) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>

    <!-- Task dashboard (MANAGER / MEMBER) -->
    <template v-else>
      <div class="grid gap-4 sm:grid-cols-4">
        <div class="ui-card p-5">
          <div class="ui-eyebrow">К выполнению</div>
          <div class="mt-3 text-2xl font-semibold ui-number metric-neutral">{{ taskSummary.todo }}</div>
        </div>
        <div class="ui-card p-5">
          <div class="ui-eyebrow">В работе</div>
          <div class="mt-3 text-2xl font-semibold ui-number text-sky-300">{{ taskSummary.inProgress }}</div>
        </div>
        <div class="ui-card p-5">
          <div class="ui-eyebrow">Выполнено</div>
          <div class="mt-3 text-2xl font-semibold ui-number metric-positive">{{ taskSummary.done }}</div>
        </div>
        <div class="ui-card p-5">
          <div class="ui-eyebrow">Просрочено</div>
          <div class="mt-3 text-2xl font-semibold ui-number metric-negative">{{ taskSummary.overdue }}</div>
        </div>
      </div>

      <section class="ui-card">
        <div class="ui-card-header">{{ auth.isMember ? 'Мои задачи' : 'Задачи команды' }}</div>
        <div class="ui-table-scroll">
          <table class="ui-table">
            <thead>
              <tr>
                <th>Задача</th>
                <th>Проект</th>
                <th v-if="!auth.isMember">Исполнитель</th>
                <th>Приоритет</th>
                <th>Срок</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in taskList" :key="row.id">
                <td><router-link :to="`/tasks`" class="font-medium text-slate-100 hover:text-sky-300">{{ row.title }}</router-link></td>
                <td>{{ row.project?.name || '—' }}</td>
                <td v-if="!auth.isMember">{{ row.assignee?.name || '—' }}</td>
                <td><StatusBadge :status="row.priority" domain="priority" /></td>
                <td :class="isOverdue(row.dueDate) ? 'font-semibold text-rose-300' : ''">{{ fmtDate(row.dueDate) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="!taskList.length && !loading" class="ui-empty m-5">Нет активных задач</div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { dashboardApi } from '@/api/dashboard'
import { useAuthStore } from '@/stores/auth'
import StatusBadge from '@/components/StatusBadge.vue'

const auth = useAuthStore()
const loading = ref(false)

// Finance
const summary = ref({
  currentMonthIncome: 0, currentMonthExpense: 0, currentMonthProfit: 0,
  upcomingPaymentsCount: 0, upcomingPaymentsAmount: 0,
  overduePaymentsCount: 0, overduePaymentsAmount: 0,
  activeClientsCount: 0, activeServicesCount: 0,
})
const upcoming = ref([])
const overdue = ref([])
const chart = ref([])

// Tasks
const taskSummary = ref({ todo: 0, inProgress: 0, done: 0, overdue: 0 })
const taskList = ref([])

const fmt = (v) => Number(v || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₽'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU') : '—'
const isOverdue = (d) => d && new Date(d) < new Date()

const stats = computed(() => [
  { label: 'Доходы за месяц', value: fmt(summary.value.currentMonthIncome), className: 'metric-positive' },
  { label: 'Расходы за месяц', value: fmt(summary.value.currentMonthExpense), className: 'metric-negative' },
  { label: 'Прибыль за месяц', value: fmt(summary.value.currentMonthProfit), className: summary.value.currentMonthProfit >= 0 ? 'metric-positive' : 'metric-negative' },
  { label: 'Предстоящие платежи', value: summary.value.upcomingPaymentsCount, sub: fmt(summary.value.upcomingPaymentsAmount), className: 'metric-neutral' },
  { label: 'Просрочено', value: summary.value.overduePaymentsCount, sub: fmt(summary.value.overduePaymentsAmount), className: 'metric-negative' },
  { label: 'Активных клиентов', value: summary.value.activeClientsCount, sub: `Услуг: ${summary.value.activeServicesCount}`, className: 'metric-neutral' },
])

onMounted(async () => {
  loading.value = true
  try {
    if (auth.isAdmin) {
      const [s, u, o, c] = await Promise.allSettled([
        dashboardApi.getSummary(),
        dashboardApi.getUpcomingPayments(),
        dashboardApi.getOverdue(),
        dashboardApi.getMonthlyChart(),
      ])
      if (s.status === 'fulfilled') summary.value = s.value.data.data
      if (u.status === 'fulfilled') upcoming.value = u.value.data.data
      if (o.status === 'fulfilled') overdue.value = o.value.data.data
      if (c.status === 'fulfilled') chart.value = c.value.data.data
    } else {
      const res = await (auth.isMember ? dashboardApi.getMyTasks() : dashboardApi.getTeamTasks())
      taskSummary.value = res.data.data.summary
      taskList.value = res.data.data.list
    }
  } finally {
    loading.value = false
  }
})
</script>
