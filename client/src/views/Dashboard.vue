<template>
  <div>
    <div class="stat-cards" v-loading="loadingSummary">
      <el-card class="stat-card">
        <div class="stat-label">Доходы за месяц</div>
        <div class="stat-value income">{{ fmt(summary.currentMonthIncome) }}</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-label">Расходы за месяц</div>
        <div class="stat-value expense">{{ fmt(summary.currentMonthExpense) }}</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-label">Прибыль за месяц</div>
        <div class="stat-value" :class="summary.currentMonthProfit >= 0 ? 'income' : 'expense'">
          {{ fmt(summary.currentMonthProfit) }}
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-label">Предстоящие платежи</div>
        <div class="stat-value">{{ summary.upcomingPaymentsCount }}</div>
        <div class="stat-sub">{{ fmt(summary.upcomingPaymentsAmount) }}</div>
      </el-card>
      <el-card class="stat-card danger">
        <div class="stat-label">Просрочено</div>
        <div class="stat-value expense">{{ summary.overduePaymentsCount }}</div>
        <div class="stat-sub">{{ fmt(summary.overduePaymentsAmount) }}</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-label">Активных клиентов</div>
        <div class="stat-value">{{ summary.activeClientsCount }}</div>
        <div class="stat-sub">Услуг: {{ summary.activeServicesCount }}</div>
      </el-card>
    </div>

    <el-row :gutter="20" style="margin-top:24px">
      <el-col :span="12">
        <el-card>
          <template #header><span>Предстоящие платежи (30 дней)</span></template>
          <el-table :data="upcoming" size="small" v-loading="loadingUpcoming">
            <el-table-column prop="client.name" label="Клиент" min-width="120" />
            <el-table-column prop="title" label="Услуга" min-width="160" show-overflow-tooltip />
            <el-table-column label="Сумма" width="120">
              <template #default="{ row }">{{ fmt(row.amount) }}</template>
            </el-table-column>
            <el-table-column label="Дата" width="110">
              <template #default="{ row }">{{ fmtDate(row.dueDate) }}</template>
            </el-table-column>
            <el-table-column label="Статус" width="110">
              <template #default="{ row }"><StatusBadge :status="row.status" domain="billing" /></template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!upcoming.length && !loadingUpcoming" description="Нет предстоящих платежей" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header><span style="color:#f56c6c">Просроченные платежи</span></template>
          <el-table :data="overdue" size="small" v-loading="loadingOverdue">
            <el-table-column prop="client.name" label="Клиент" min-width="120" />
            <el-table-column prop="title" label="Услуга" min-width="160" show-overflow-tooltip />
            <el-table-column label="Сумма" width="120">
              <template #default="{ row }">{{ fmt(row.amount) }}</template>
            </el-table-column>
            <el-table-column label="Дата" width="110">
              <template #default="{ row }"><span style="color:#f56c6c">{{ fmtDate(row.dueDate) }}</span></template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!overdue.length && !loadingOverdue" description="Просроченных платежей нет 🎉" />
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top:24px">
      <template #header>Доходы и расходы за 6 месяцев</template>
      <el-table :data="chart" size="small" v-loading="loadingChart">
        <el-table-column prop="label" label="Месяц" width="100" />
        <el-table-column label="Доходы">
          <template #default="{ row }"><span style="color:#67c23a">{{ fmt(row.income) }}</span></template>
        </el-table-column>
        <el-table-column label="Расходы">
          <template #default="{ row }"><span style="color:#f56c6c">{{ fmt(row.expense) }}</span></template>
        </el-table-column>
        <el-table-column label="Прибыль">
          <template #default="{ row }">
            <span :style="row.income - row.expense >= 0 ? 'color:#67c23a' : 'color:#f56c6c'">
              {{ fmt(row.income - row.expense) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { dashboardApi } from '@/api/dashboard'
import StatusBadge from '@/components/StatusBadge.vue'

const summary = ref({
  currentMonthIncome: 0, currentMonthExpense: 0, currentMonthProfit: 0,
  upcomingPaymentsCount: 0, upcomingPaymentsAmount: 0,
  overduePaymentsCount: 0, overduePaymentsAmount: 0,
  activeClientsCount: 0, activeServicesCount: 0,
})
const upcoming = ref([])
const overdue = ref([])
const chart = ref([])
const loadingSummary = ref(false)
const loadingUpcoming = ref(false)
const loadingOverdue = ref(false)
const loadingChart = ref(false)

const fmt = (v) => Number(v || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₽'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU') : '—'

onMounted(async () => {
  loadingSummary.value = true
  loadingUpcoming.value = true
  loadingOverdue.value = true
  loadingChart.value = true

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

  loadingSummary.value = loadingUpcoming.value = loadingOverdue.value = loadingChart.value = false
})
</script>

<style scoped>
.stat-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.stat-card { text-align: center; }
.stat-label { font-size: 13px; color: #909399; margin-bottom: 8px; }
.stat-value { font-size: 28px; font-weight: 700; color: #303133; }
.stat-sub { font-size: 13px; color: #909399; margin-top: 4px; }
.income { color: #67c23a !important; }
.expense { color: #f56c6c !important; }
</style>
