<template>
  <div>
    <div class="ui-toolbar">
      <div class="ui-toolbar-left">
        <select v-model="filters.type" class="ui-select w-36" @change="load">
          <option value="">Все типы</option>
          <option value="INCOME">Доход</option>
          <option value="EXPENSE">Расход</option>
        </select>
        <select v-model="filters.clientId" class="ui-select w-48" @change="load">
          <option value="">Клиент</option>
          <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <select v-model="filters.categoryId" class="ui-select w-48" @change="load">
          <option value="">Категория</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <AppDatePicker v-model="filters.dateFrom" class="w-40" placeholder="От" @change="load" />
        <AppDatePicker v-model="filters.dateTo" class="w-40" placeholder="До" @change="load" />
      </div>
      <button class="ui-button ui-button-primary" type="button" @click="openCreate('INCOME')"><Plus class="size-4" /> Добавить транзакцию</button>
    </div>

    <div class="ui-table-wrap">
      <div class="ui-table-scroll">
        <table class="ui-table">
          <thead>
            <tr><th>Дата</th><th>Описание</th><th>Тип</th><th>Сумма</th><th>Категория</th><th>Клиент</th><th>Кошелёк</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="row in transactions" :key="row.id">
              <td>{{ fmtDate(row.date) }}</td>
              <td class="max-w-80 truncate">{{ row.description || '—' }}</td>
              <td><StatusBadge :status="row.type" domain="transaction" /></td>
              <td class="ui-number" :class="row.type === 'INCOME' ? 'font-semibold metric-positive' : 'font-semibold metric-negative'">
                {{ row.type === 'INCOME' ? '+' : '−' }}{{ fmt(row.amount) }}
              </td>
              <td>
                <span v-if="row.category" class="inline-flex rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-slate-700" :style="row.category.color ? { color: row.category.color } : {}">{{ row.category.name }}</span>
                <span v-else class="text-slate-500">—</span>
              </td>
              <td>{{ row.client?.name || '—' }}</td>
              <td>{{ row.account?.name || '—' }}</td>
              <td class="text-right">
                <button v-if="!row.billingItemId" class="ui-button ui-button-danger px-2" type="button" @click="remove(row.id)"><Trash2 class="size-4" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="!transactions.length && !loading" class="ui-empty m-5">Транзакции не найдены</div>
    </div>

    <div v-if="dialogVisible" class="ui-modal-backdrop" @click.self="dialogVisible = false">
      <section class="ui-modal max-w-xl">
        <header class="ui-modal-header">
          <h2 class="ui-modal-title">Новая транзакция</h2>
          <button class="ui-button ui-button-ghost px-2" type="button" @click="dialogVisible = false"><X class="size-4" /></button>
        </header>
        <div class="ui-modal-body">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <span class="ui-label">Тип *</span>
              <div class="inline-flex rounded-md border border-slate-700 bg-slate-950 p-1">
                <button class="rounded px-3 py-1.5 text-sm font-semibold" :class="form.type === 'INCOME' ? 'bg-sky-500 text-slate-950' : 'text-slate-400'" type="button" @click="form.type = 'INCOME'">Доход</button>
                <button class="rounded px-3 py-1.5 text-sm font-semibold" :class="form.type === 'EXPENSE' ? 'bg-sky-500 text-slate-950' : 'text-slate-400'" type="button" @click="form.type = 'EXPENSE'">Расход</button>
              </div>
            </div>
            <label><span class="ui-label">Сумма *</span><input v-model.number="form.amount" class="ui-input" min="0.01" step="0.01" type="number" /></label>
            <label><span class="ui-label">Дата *</span><AppDatePicker v-model="form.date" :clearable="false" /></label>
            <label class="sm:col-span-2"><span class="ui-label">Описание</span><input v-model="form.description" class="ui-input" /></label>
            <label>
              <span class="ui-label">Категория</span>
              <select v-model="form.categoryId" class="ui-select">
                <option :value="null">Без категории</option>
                <option v-for="c in filteredCategories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </label>
            <label>
              <span class="ui-label">Кошелёк</span>
              <select v-model="form.accountId" class="ui-select">
                <option :value="null">Без кошелька</option>
                <option v-for="a in accounts" :key="a.id" :value="a.id">{{ a.name }}</option>
              </select>
            </label>
            <label>
              <span class="ui-label">Клиент</span>
              <select v-model="form.clientId" class="ui-select">
                <option :value="null">Без клиента</option>
                <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </label>
          </div>
        </div>
        <footer class="ui-modal-footer">
          <button class="ui-button" type="button" @click="dialogVisible = false">Отмена</button>
          <button class="ui-button ui-button-primary" type="button" :disabled="saving" @click="save">{{ saving ? 'Сохраняем...' : 'Сохранить' }}</button>
        </footer>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { Plus, Trash2, X } from 'lucide-vue-next'
import { transactionsApi } from '@/api/transactions'
import { clientsApi } from '@/api/clients'
import { categoriesApi } from '@/api/categories'
import { accountsApi } from '@/api/accounts'
import StatusBadge from '@/components/StatusBadge.vue'
import AppDatePicker from '@/components/AppDatePicker.vue'
import { confirmAction, notify } from '@/utils/notify'

const transactions = ref([])
const clients = ref([])
const categories = ref([])
const accounts = ref([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const filters = reactive({ type: '', clientId: '', categoryId: '', dateFrom: '', dateTo: '' })

const empty = () => ({ type: 'INCOME', amount: 0, date: '', description: '', categoryId: null, accountId: null, clientId: null })
const form = ref(empty())
const filteredCategories = computed(() => categories.value.filter(c => c.type === form.value.type))

const fmt = (v) => Number(v || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₽'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU') : '—'

const load = async () => {
  loading.value = true
  try {
    const p = { type: filters.type || undefined, clientId: filters.clientId || undefined, categoryId: filters.categoryId || undefined, dateFrom: filters.dateFrom || undefined, dateTo: filters.dateTo || undefined }
    const res = await transactionsApi.getAll(p)
    transactions.value = res.data.data
  } finally { loading.value = false }
}

const openCreate = (type) => { form.value = { ...empty(), type, date: new Date().toISOString().slice(0, 10) }; dialogVisible.value = true }

const save = async () => {
  if (!form.value.amount || form.value.amount <= 0) return notify.error('Укажите сумму')
  if (!form.value.date) return notify.error('Укажите дату')
  saving.value = true
  try {
    await transactionsApi.create(form.value)
    notify.success('Транзакция добавлена')
    dialogVisible.value = false
    load()
  } catch (err) { notify.error(err.response?.data?.error || 'Ошибка') }
  finally { saving.value = false }
}

const remove = async (id) => {
  if (!await confirmAction('Удалить транзакцию?')) return
  await transactionsApi.remove(id)
  notify.success('Транзакция удалена')
  load()
}

onMounted(async () => {
  const [, cr, catr, acr] = await Promise.all([load(), clientsApi.getAll(), categoriesApi.getAll(), accountsApi.getAll()])
  clients.value = cr.data.data
  categories.value = catr.data.data
  accounts.value = acr.data.data
})
</script>
