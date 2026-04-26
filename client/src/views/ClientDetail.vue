<template>
  <div class="space-y-5">
    <button class="ui-button ui-button-ghost" type="button" @click="$router.push('/clients')">
      <ArrowLeft class="size-4" /> {{ client?.name || 'Клиент' }}
    </button>

    <div v-if="client" class="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside class="ui-card">
        <div class="ui-card-header">Информация о клиенте</div>
        <dl class="divide-y divide-slate-800 px-5 text-sm">
          <div v-for="item in infoItems" :key="item.label" class="grid grid-cols-3 gap-3 py-3">
            <dt class="text-slate-500">{{ item.label }}</dt>
            <dd class="col-span-2 text-slate-200">{{ item.value }}</dd>
          </div>
          <div class="grid grid-cols-3 gap-3 py-3">
            <dt class="text-slate-500">Статус</dt>
            <dd class="col-span-2"><StatusBadge :status="client.status" domain="client" /></dd>
          </div>
        </dl>
        <p v-if="client.notes" class="border-t border-slate-800 px-5 py-4 text-sm text-slate-400">{{ client.notes }}</p>
      </aside>

      <section class="space-y-5">
        <DataPanel title="Проекты" :count="client.projects?.length || 0">
          <table class="ui-table">
            <thead><tr><th>Проект</th><th>Статус</th><th>Сайт</th></tr></thead>
            <tbody>
              <tr v-for="row in client.projects" :key="row.id">
                <td><router-link to="/projects">{{ row.name }}</router-link></td>
                <td><StatusBadge :status="row.status" domain="project" /></td>
                <td><a v-if="row.productionUrl" :href="row.productionUrl" target="_blank">{{ row.productionUrl }}</a><span v-else class="text-slate-500">—</span></td>
              </tr>
            </tbody>
          </table>
          <div v-if="!client.projects?.length" class="ui-empty m-5">Нет проектов</div>
        </DataPanel>

        <DataPanel title="Регулярные услуги" :count="client.services?.length || 0">
          <table class="ui-table">
            <thead><tr><th>Услуга</th><th>Тип</th><th>Сумма</th><th>Следующая оплата</th><th>Статус</th></tr></thead>
            <tbody>
              <tr v-for="row in client.services" :key="row.id">
                <td>{{ row.title }}</td>
                <td>{{ typeLabel(row.type) }}</td>
                <td>{{ fmt(row.amount) }}</td>
                <td>{{ fmtDate(row.nextDueDate) }}</td>
                <td><StatusBadge :status="row.status" domain="service" /></td>
              </tr>
            </tbody>
          </table>
          <div v-if="!client.services?.length" class="ui-empty m-5">Нет регулярных услуг</div>
        </DataPanel>

        <DataPanel title="Ожидаемые платежи" :count="client.billingItems?.length || 0">
          <table class="ui-table">
            <thead><tr><th>Название</th><th>Сумма</th><th>Дата</th><th>Статус</th></tr></thead>
            <tbody>
              <tr v-for="row in client.billingItems" :key="row.id">
                <td>{{ row.title }}</td>
                <td>{{ fmt(row.amount) }}</td>
                <td>{{ fmtDate(row.dueDate) }}</td>
                <td><StatusBadge :status="row.status" domain="billing" /></td>
              </tr>
            </tbody>
          </table>
          <div v-if="!client.billingItems?.length" class="ui-empty m-5">Нет ожидаемых платежей</div>
        </DataPanel>

        <DataPanel title="Транзакции" :count="client.transactions?.length || 0">
          <table class="ui-table">
            <thead><tr><th>Дата</th><th>Описание</th><th>Тип</th><th>Сумма</th></tr></thead>
            <tbody>
              <tr v-for="row in client.transactions" :key="row.id">
                <td>{{ fmtDate(row.date) }}</td>
                <td>{{ row.description || '—' }}</td>
                <td><StatusBadge :status="row.type" domain="transaction" /></td>
                <td class="ui-number" :class="row.type === 'INCOME' ? 'metric-positive' : 'metric-negative'">{{ fmt(row.amount) }}</td>
              </tr>
            </tbody>
          </table>
          <div v-if="!client.transactions?.length" class="ui-empty m-5">Нет транзакций</div>
        </DataPanel>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import { clientsApi } from '@/api/clients'
import StatusBadge from '@/components/StatusBadge.vue'

const DataPanel = defineComponent({
  props: { title: String, count: Number },
  setup(props, { slots }) {
    return () => h('section', { class: 'ui-card' }, [
      h('div', { class: 'ui-card-header flex items-center justify-between' }, [
        h('span', props.title),
        h('span', { class: 'text-xs text-slate-500' }, String(props.count)),
      ]),
      h('div', { class: 'ui-table-scroll' }, slots.default?.()),
    ])
  },
})

const route = useRoute()
const client = ref(null)
const loading = ref(false)

const fmt = (v) => Number(v || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₽'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU') : '—'
const TYPE_LABELS = { HOSTING: 'Хостинг', DOMAIN: 'Домен', MAINTENANCE: 'Обслуживание', SERVER: 'Сервер', LICENSE: 'Лицензия', SUPPORT: 'Поддержка', OTHER: 'Прочее' }
const typeLabel = (t) => TYPE_LABELS[t] || t

const infoItems = computed(() => client.value ? [
  { label: 'Контакт', value: client.value.contactName || '—' },
  { label: 'Email', value: client.value.email || '—' },
  { label: 'Телефон', value: client.value.phone || '—' },
  { label: 'Telegram', value: client.value.telegram || '—' },
  { label: 'Компания', value: client.value.companyName || '—' },
  { label: 'ИНН', value: client.value.taxId || '—' },
] : [])

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
