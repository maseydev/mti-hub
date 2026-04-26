<template>
  <div class="space-y-5">

    <!-- ── ADMIN ─────────────────────────────────────────────────── -->
    <template v-if="auth.isAdmin">

      <!-- Finance overview -->
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <div v-for="stat in financeStats" :key="stat.label" class="ui-card p-5">
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
                <tr v-for="row in overduePayments" :key="row.id">
                  <td>{{ row.client?.name || '—' }}</td>
                  <td class="max-w-64 truncate">{{ row.title }}</td>
                  <td>{{ fmt(row.amount) }}</td>
                  <td class="ui-number font-semibold text-rose-300">{{ fmtDate(row.dueDate) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="!overduePayments.length && !loading" class="ui-empty m-5">Просроченных платежей нет</div>
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

      <!-- Task overview -->
      <div class="flex items-center gap-3 pt-1">
        <div class="h-px flex-1 bg-slate-800" />
        <span class="ui-eyebrow">Задачи</span>
        <div class="h-px flex-1 bg-slate-800" />
      </div>

      <div class="grid gap-4 sm:grid-cols-5">
        <div class="ui-card p-5">
          <div class="ui-eyebrow">Мои открытые</div>
          <div class="mt-3 text-2xl font-semibold ui-number metric-neutral">{{ adminTasks.my.open }}</div>
        </div>
        <div class="ui-card p-5">
          <div class="ui-eyebrow">Мои — сегодня</div>
          <div class="mt-3 text-2xl font-semibold ui-number text-amber-300">{{ adminTasks.my.dueToday }}</div>
        </div>
        <div class="ui-card p-5">
          <div class="ui-eyebrow">Мои — просрочено</div>
          <div class="mt-3 text-2xl font-semibold ui-number metric-negative">{{ adminTasks.my.overdue }}</div>
        </div>
        <div class="ui-card p-5">
          <div class="ui-eyebrow">Команда открытые</div>
          <div class="mt-3 text-2xl font-semibold ui-number metric-neutral">{{ adminTasks.team.open }}</div>
        </div>
        <div class="ui-card p-5">
          <div class="ui-eyebrow">Команда просрочено</div>
          <div class="mt-3 text-2xl font-semibold ui-number metric-negative">{{ adminTasks.team.overdue }}</div>
        </div>
      </div>

      <section class="ui-card">
        <div class="ui-card-header">Открытые задачи команды</div>
        <div class="ui-table-scroll">
          <table class="ui-table">
            <thead>
              <tr>
                <th>Задача</th>
                <th>Проект</th>
                <th>Исполнитель</th>
                <th>Приоритет</th>
                <th>Срок</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in adminTasks.teamList" :key="row.id" :class="isOverdueTask(row) ? 'bg-red-950/20' : ''">
                <td class="font-medium text-slate-100">{{ row.title }}</td>
                <td>{{ row.project?.name || '—' }}</td>
                <td>{{ row.assignee?.name || '—' }}</td>
                <td><StatusBadge :status="row.priority" domain="priority" /></td>
                <td :class="isOverdueTask(row) ? 'font-semibold text-rose-300' : ''">{{ fmtDate(row.dueDate) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="!adminTasks.teamList.length && !loading" class="ui-empty m-5">Нет открытых задач</div>
      </section>
    </template>

    <!-- ── MANAGER / MEMBER ───────────────────────────────────────── -->
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
              <tr v-for="row in taskList" :key="row.id" :class="isOverdueTask(row) ? 'bg-red-950/20' : ''">
                <td><router-link to="/tasks" class="font-medium text-slate-100 hover:text-sky-300">{{ row.title }}</router-link></td>
                <td>{{ row.project?.name || '—' }}</td>
                <td v-if="!auth.isMember">{{ row.assignee?.name || '—' }}</td>
                <td><StatusBadge :status="row.priority" domain="priority" /></td>
                <td :class="isOverdueTask(row) ? 'font-semibold text-rose-300' : ''">{{ fmtDate(row.dueDate) }}</td>
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

// Finance (admin)
const financeSummary = ref({
  currentMonthIncome: 0, currentMonthExpense: 0, currentMonthProfit: 0,
  upcomingPaymentsCount: 0, upcomingPaymentsAmount: 0,
  overduePaymentsCount: 0, overduePaymentsAmount: 0,
  activeClientsCount: 0, activeServicesCount: 0,
})
const upcoming = ref([])
const overduePayments = ref([])
const chart = ref([])

// Admin tasks
const adminTasks = ref({ my: { open: 0, dueToday: 0, overdue: 0 }, team: { open: 0, overdue: 0 }, teamList: [] })

// Manager / member tasks
const taskSummary = ref({ todo: 0, inProgress: 0, done: 0, overdue: 0 })
const taskList = ref([])

const fmt = (v) => Number(v || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₽'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU') : '—'
const isOverdueTask = (row) => row.dueDate && !['DONE', 'CANCELLED'].includes(row.status) && new Date(row.dueDate) < new Date()

const financeStats = computed(() => [
  { label: 'Доходы за месяц', value: fmt(financeSummary.value.currentMonthIncome), className: 'metric-positive' },
  { label: 'Расходы за месяц', value: fmt(financeSummary.value.currentMonthExpense), className: 'metric-negative' },
  { label: 'Прибыль за месяц', value: fmt(financeSummary.value.currentMonthProfit), className: financeSummary.value.currentMonthProfit >= 0 ? 'metric-positive' : 'metric-negative' },
  { label: 'Предстоящие платежи', value: financeSummary.value.upcomingPaymentsCount, sub: fmt(financeSummary.value.upcomingPaymentsAmount), className: 'metric-neutral' },
  { label: 'Просрочено (платежи)', value: financeSummary.value.overduePaymentsCount, sub: fmt(financeSummary.value.overduePaymentsAmount), className: 'metric-negative' },
  { label: 'Активных клиентов', value: financeSummary.value.activeClientsCount, sub: `Услуг: ${financeSummary.value.activeServicesCount}`, className: 'metric-neutral' },
])

const loadDashboard = async () => {
  loading.value = true
  try {
    if (!auth.user && auth.token) await auth.fetchMe()
    if (!auth.user) return

    if (auth.isAdmin) {
      const [s, u, o, c, at] = await Promise.allSettled([
        dashboardApi.getSummary(),
        dashboardApi.getUpcomingPayments(),
        dashboardApi.getOverdue(),
        dashboardApi.getMonthlyChart(),
        dashboardApi.getAdminTasks(),
      ])
      if (s.status === 'fulfilled') financeSummary.value = s.value.data.data
      if (u.status === 'fulfilled') upcoming.value = u.value.data.data
      if (o.status === 'fulfilled') overduePayments.value = o.value.data.data
      if (c.status === 'fulfilled') chart.value = c.value.data.data
      if (at.status === 'fulfilled') adminTasks.value = at.value.data.data
    } else {
      const res = await (auth.isMember ? dashboardApi.getMyTasks() : dashboardApi.getTeamTasks())
      taskSummary.value = res.data.data.summary
      taskList.value = res.data.data.list
    }
  } finally {
    loading.value = false
  }
}

onMounted(loadDashboard)
</script>
