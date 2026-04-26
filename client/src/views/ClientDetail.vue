<template>
  <div v-loading="loading">
    <el-page-header @back="$router.push('/clients')" style="margin-bottom:20px">
      <template #content>{{ client?.name }}</template>
    </el-page-header>

    <el-row :gutter="20" v-if="client">
      <el-col :span="8">
        <el-card>
          <template #header>Информация о клиенте</template>
          <el-descriptions :column="1" size="small">
            <el-descriptions-item label="Контакт">{{ client.contactName || '—' }}</el-descriptions-item>
            <el-descriptions-item label="Email">{{ client.email || '—' }}</el-descriptions-item>
            <el-descriptions-item label="Телефон">{{ client.phone || '—' }}</el-descriptions-item>
            <el-descriptions-item label="Telegram">{{ client.telegram || '—' }}</el-descriptions-item>
            <el-descriptions-item label="Компания">{{ client.companyName || '—' }}</el-descriptions-item>
            <el-descriptions-item label="ИНН">{{ client.taxId || '—' }}</el-descriptions-item>
            <el-descriptions-item label="Статус">
              <StatusBadge :status="client.status" domain="client" />
            </el-descriptions-item>
          </el-descriptions>
          <div v-if="client.notes" style="margin-top:12px;color:#606266;font-size:13px">{{ client.notes }}</div>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-tabs>
          <el-tab-pane :label="`Проекты (${client.projects?.length || 0})`">
            <el-table :data="client.projects" size="small">
              <el-table-column prop="name" label="Проект" min-width="180">
                <template #default="{ row }">
                  <router-link :to="`/projects`" style="color:#409eff;text-decoration:none">{{ row.name }}</router-link>
                </template>
              </el-table-column>
              <el-table-column label="Статус" width="120">
                <template #default="{ row }"><StatusBadge :status="row.status" domain="project" /></template>
              </el-table-column>
              <el-table-column label="Сайт" width="160">
                <template #default="{ row }">
                  <a v-if="row.productionUrl" :href="row.productionUrl" target="_blank" style="color:#409eff">{{ row.productionUrl }}</a>
                  <span v-else>—</span>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="!client.projects?.length" description="Нет проектов" />
          </el-tab-pane>

          <el-tab-pane :label="`Услуги (${client.services?.length || 0})`">
            <el-table :data="client.services" size="small">
              <el-table-column prop="title" label="Услуга" min-width="180" />
              <el-table-column label="Тип" width="120">
                <template #default="{ row }">{{ typeLabel(row.type) }}</template>
              </el-table-column>
              <el-table-column label="Сумма" width="120">
                <template #default="{ row }">{{ fmt(row.amount) }}</template>
              </el-table-column>
              <el-table-column label="Следующая оплата" width="150">
                <template #default="{ row }">{{ fmtDate(row.nextDueDate) }}</template>
              </el-table-column>
              <el-table-column label="Статус" width="110">
                <template #default="{ row }"><StatusBadge :status="row.status" domain="service" /></template>
              </el-table-column>
            </el-table>
            <el-empty v-if="!client.services?.length" description="Нет услуг" />
          </el-tab-pane>

          <el-tab-pane :label="`Счета (${client.billingItems?.length || 0})`">
            <el-table :data="client.billingItems" size="small">
              <el-table-column prop="title" label="Название" min-width="200" />
              <el-table-column label="Сумма" width="120">
                <template #default="{ row }">{{ fmt(row.amount) }}</template>
              </el-table-column>
              <el-table-column label="Дата" width="110">
                <template #default="{ row }">{{ fmtDate(row.dueDate) }}</template>
              </el-table-column>
              <el-table-column label="Статус" width="120">
                <template #default="{ row }"><StatusBadge :status="row.status" domain="billing" /></template>
              </el-table-column>
            </el-table>
            <el-empty v-if="!client.billingItems?.length" description="Нет счетов" />
          </el-tab-pane>

          <el-tab-pane :label="`Транзакции (${client.transactions?.length || 0})`">
            <el-table :data="client.transactions" size="small">
              <el-table-column label="Дата" width="110">
                <template #default="{ row }">{{ fmtDate(row.date) }}</template>
              </el-table-column>
              <el-table-column prop="description" label="Описание" min-width="200" />
              <el-table-column label="Тип" width="90">
                <template #default="{ row }"><StatusBadge :status="row.type" domain="transaction" /></template>
              </el-table-column>
              <el-table-column label="Сумма" width="120">
                <template #default="{ row }">
                  <span :style="row.type === 'INCOME' ? 'color:#67c23a' : 'color:#f56c6c'">{{ fmt(row.amount) }}</span>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="!client.transactions?.length" description="Нет транзакций" />
          </el-tab-pane>
        </el-tabs>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { clientsApi } from '@/api/clients'
import StatusBadge from '@/components/StatusBadge.vue'

const route = useRoute()
const client = ref(null)
const loading = ref(false)

const fmt = (v) => Number(v || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₽'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU') : '—'

const TYPE_LABELS = { HOSTING: 'Хостинг', DOMAIN: 'Домен', MAINTENANCE: 'Обслуживание', SERVER: 'Сервер', LICENSE: 'Лицензия', SUPPORT: 'Поддержка', OTHER: 'Прочее' }
const typeLabel = (t) => TYPE_LABELS[t] || t

onMounted(async () => {
  loading.value = true
  try {
    const res = await clientsApi.getById(route.params.id)
    client.value = res.data.data
  } finally {
    loading.value = false
  }
})
</script>
