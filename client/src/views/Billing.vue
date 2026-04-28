<template>
  <div>
    <div class="ui-toolbar">
      <div class="ui-toolbar-left">
        <select v-model="filters.status" class="ui-select w-44" @change="load">
          <option value="">Все статусы</option>
          <option value="PLANNED">Запланировано</option>
          <option value="DUE">К оплате</option>
          <option value="OVERDUE">Просрочено</option>
          <option value="PAID">Оплачено</option>
          <option value="CANCELLED">Отменено</option>
        </select>
        <select v-model="filters.clientId" class="ui-select w-52" @change="load">
          <option value="">Клиент</option>
          <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <AppDatePicker v-model="filters.dateFrom" class="w-40" placeholder="От" @change="load" />
        <AppDatePicker v-model="filters.dateTo" class="w-40" placeholder="До" @change="load" />
      </div>
      <div class="flex flex-wrap gap-2">
        <button class="ui-button" type="button" :disabled="generating" @click="generate">
          {{ generating ? 'Создаём...' : 'Создать платежи из регулярных услуг' }}
        </button>
        <button class="ui-button ui-button-primary" type="button" @click="openCreate">
          <Plus class="size-4" /> Добавить платёж
        </button>
      </div>
    </div>

    <div class="ui-table-wrap">
      <div class="ui-table-scroll">
        <table class="ui-table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Клиент</th>
              <th>Сумма</th>
              <th>Дата</th>
              <th>Оплачено</th>
              <th>Статус</th>
              <th class="text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in items" :key="row.id" :class="row.status === 'OVERDUE' ? 'bg-red-950/20' : ''">
              <td class="max-w-80 truncate">{{ row.title }}</td>
              <td>{{ row.client?.name || '—' }}</td>
              <td>{{ fmt(row.amount) }}</td>
              <td>{{ fmtDate(row.dueDate) }}</td>
              <td>{{ row.paidAt ? fmtDate(row.paidAt) : '—' }}</td>
              <td><StatusBadge :status="row.status" domain="billing" /></td>
              <td>
                <div v-if="!['PAID','CANCELLED'].includes(row.status)" class="flex justify-end gap-2">
                  <button class="ui-button ui-button-ghost px-2 text-teal-300" type="button" @click="markPaid(row.id)">Отметить как оплачено</button>
                  <button class="ui-button ui-button-danger px-2" type="button" @click="cancelItem(row.id)">Отмена</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="!items.length && !loading" class="ui-empty m-5">Платежи не найдены</div>
    </div>

    <div v-if="dialogVisible" class="ui-modal-backdrop">
      <section class="ui-modal max-w-xl">
        <header class="ui-modal-header">
          <h2 class="ui-modal-title">Новый ожидаемый платёж</h2>
          <button class="ui-button ui-button-ghost px-2" type="button" @click="dialogVisible = false"><X class="size-4" /></button>
        </header>
        <div class="ui-modal-body space-y-4">
          <label>
            <span class="ui-label">Клиент *</span>
            <select v-model="form.clientId" class="ui-select">
              <option value="">Выберите клиента</option>
              <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </label>
          <label><span class="ui-label">Название *</span><input v-model="form.title" class="ui-input" /></label>
          <div class="grid gap-4 sm:grid-cols-2">
            <label><span class="ui-label">Сумма *</span><MoneyInput v-model="form.amount" /></label>
            <label><span class="ui-label">Дата оплаты *</span><AppDatePicker v-model="form.dueDate" :clearable="false" /></label>
          </div>
          <label><span class="ui-label">Заметки</span><textarea v-model="form.notes" class="ui-textarea" /></label>
        </div>
        <footer class="ui-modal-footer">
          <button class="ui-button" type="button" @click="dialogVisible = false">Отмена</button>
          <button class="ui-button ui-button-primary" type="button" :disabled="saving" @click="save">
            {{ saving ? 'Сохраняем...' : 'Сохранить' }}
          </button>
        </footer>
      </section>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { Plus, X } from 'lucide-vue-next'
import { billingApi } from '@/api/billing'
import { clientsApi } from '@/api/clients'
import StatusBadge from '@/components/StatusBadge.vue'
import AppDatePicker from '@/components/AppDatePicker.vue'
import MoneyInput from '@/components/MoneyInput.vue'
import { confirmAction, notify } from '@/utils/notify'

const items = ref([])
const clients = ref([])
const loading = ref(false)
const saving = ref(false)
const generating = ref(false)
const dialogVisible = ref(false)
const filters = reactive({ status: '', clientId: '', dateFrom: '', dateTo: '' })

const empty = () => ({ clientId: '', title: '', amount: 0, dueDate: '', notes: '' })
const form = ref(empty())

const fmt = (v) => Number(v || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₽'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU') : '—'

const load = async () => {
  loading.value = true
  try {
    const p = {
      status: filters.status || undefined,
      clientId: filters.clientId || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
    }
    const res = await billingApi.getItems(p)
    items.value = res.data.data
  } finally { loading.value = false }
}

const openCreate = () => { form.value = empty(); dialogVisible.value = true }

const save = async () => {
  if (!form.value.clientId) return notify.error('Выберите клиента')
  if (!form.value.title.trim()) return notify.error('Укажите название')
  if (!form.value.amount || form.value.amount <= 0) return notify.error('Укажите сумму')
  if (!form.value.dueDate) return notify.error('Укажите дату оплаты')
  saving.value = true
  try {
    await billingApi.createItem(form.value)
    notify.success('Платёж добавлен')
    dialogVisible.value = false
    load()
  } catch (err) { notify.error(err.response?.data?.error || 'Ошибка') }
  finally { saving.value = false }
}

const markPaid = async (id) => {
  await billingApi.markPaid(id)
  notify.success('Отмечено как оплачено')
  load()
}

const cancelItem = async (id) => {
  if (!await confirmAction('Отменить платёж?')) return
  await billingApi.updateItem(id, { status: 'CANCELLED' })
  notify.success('Платёж отменён')
  load()
}

const generate = async () => {
  generating.value = true
  try {
    const res = await billingApi.generate()
    const { created, skipped } = res.data.data
    notify.success(`Создано: ${created}, пропущено: ${skipped}`)
    load()
  } catch (err) { notify.error(err.response?.data?.error || 'Ошибка') }
  finally { generating.value = false }
}

onMounted(async () => {
  const [, cr] = await Promise.all([load(), clientsApi.getAll({ status: 'ACTIVE' })])
  clients.value = cr.data.data
})
</script>
