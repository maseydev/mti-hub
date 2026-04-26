<template>
  <div>
    <div class="ui-toolbar">
      <div class="ui-toolbar-left">
        <select v-model="filters.status" class="ui-select w-40" @change="load">
          <option value="">Статус</option>
          <option value="ACTIVE">Активна</option>
          <option value="PAUSED">Пауза</option>
          <option value="CANCELLED">Отменена</option>
          <option value="ARCHIVED">Архив</option>
        </select>
        <select v-model="filters.type" class="ui-select w-44" @change="load">
          <option value="">Тип</option>
          <option v-for="[val,lbl] in TYPE_OPTIONS" :key="val" :value="val">{{ lbl }}</option>
        </select>
        <select v-model="filters.clientId" class="ui-select w-52" @change="load">
          <option value="">Клиент</option>
          <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <label class="flex items-center gap-2 text-sm text-slate-300"><input v-model="filters.dueSoon" type="checkbox" @change="load" /> Скоро</label>
        <label class="flex items-center gap-2 text-sm text-slate-300"><input v-model="filters.overdue" type="checkbox" @change="load" /> Просрочено</label>
      </div>
      <button class="ui-button ui-button-primary" type="button" @click="openCreate"><Plus class="size-4" /> Добавить регулярную услугу</button>
    </div>

    <div class="ui-table-wrap">
      <div class="ui-table-scroll">
        <table class="ui-table">
          <thead>
            <tr>
              <th>Услуга</th>
              <th>Клиент</th>
              <th>Тип</th>
              <th>Цикл</th>
              <th>Сумма</th>
              <th>След. оплата</th>
              <th>Статус</th>
              <th class="text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in services" :key="row.id">
              <td class="font-medium text-slate-100">{{ row.title }}</td>
              <td>{{ row.client?.name || '—' }}</td>
              <td>{{ typeLabel(row.type) }}</td>
              <td>{{ cycleLabel(row.billingCycle) }}</td>
              <td>{{ fmt(row.amount) }}</td>
              <td class="ui-number" :class="isDue(row.nextDueDate) ? 'font-semibold metric-negative' : ''">{{ fmtDate(row.nextDueDate) }}</td>
              <td><StatusBadge :status="row.status" domain="service" /></td>
              <td>
                <div class="flex justify-end gap-1">
                  <button class="ui-button ui-button-ghost px-2" type="button" @click="openEdit(row)"><Pencil class="size-4" /></button>
                  <button v-if="row.status === 'ACTIVE'" class="ui-button ui-button-ghost px-2" type="button" @click="pauseService(row.id)">Пауза</button>
                  <button v-if="row.status === 'PAUSED'" class="ui-button ui-button-ghost px-2" type="button" @click="resumeService(row.id)">Старт</button>
                  <button class="ui-button ui-button-danger px-2" type="button" @click="remove(row.id)"><Trash2 class="size-4" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="!services.length && !loading" class="ui-empty m-5">Регулярные услуги не найдены</div>
    </div>

    <div v-if="dialogVisible" class="ui-modal-backdrop" @click.self="dialogVisible = false">
      <section class="ui-modal">
        <header class="ui-modal-header">
          <h2 class="ui-modal-title">{{ editingId ? 'Редактировать регулярную услугу' : 'Новая регулярная услуга' }}</h2>
          <button class="ui-button ui-button-ghost px-2" type="button" @click="dialogVisible = false"><X class="size-4" /></button>
        </header>
        <div class="ui-modal-body">
          <div class="grid gap-4 sm:grid-cols-2">
            <label>
              <span class="ui-label">Клиент *</span>
              <select v-model="form.clientId" class="ui-select">
                <option value="">Выберите клиента</option>
                <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </label>
            <label><span class="ui-label">Название *</span><input v-model="form.title" class="ui-input" /></label>
            <label>
              <span class="ui-label">Тип *</span>
              <select v-model="form.type" class="ui-select">
                <option v-for="[val,lbl] in TYPE_OPTIONS" :key="val" :value="val">{{ lbl }}</option>
              </select>
            </label>
            <label>
              <span class="ui-label">Цикл оплаты *</span>
              <select v-model="form.billingCycle" class="ui-select">
                <option v-for="[val,lbl] in CYCLE_OPTIONS" :key="val" :value="val">{{ lbl }}</option>
              </select>
            </label>
            <label><span class="ui-label">Сумма *</span><input v-model.number="form.amount" class="ui-input" min="0.01" step="0.01" type="number" /></label>
            <label><span class="ui-label">Следующая оплата *</span><AppDatePicker v-model="form.nextDueDate" :clearable="false" /></label>
            <label>
              <span class="ui-label">Статус</span>
              <select v-model="form.status" class="ui-select">
                <option value="ACTIVE">Активна</option>
                <option value="PAUSED">Пауза</option>
                <option value="CANCELLED">Отменена</option>
              </select>
            </label>
            <label class="flex items-end gap-2 pb-2 text-sm text-slate-300">
              <input v-model="form.autoCreateIncome" type="checkbox" /> Авто-доход
            </label>
            <label class="sm:col-span-2"><span class="ui-label">Заметки</span><textarea v-model="form.notes" class="ui-textarea" /></label>
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
import { onMounted, reactive, ref } from 'vue'
import { Pencil, Plus, Trash2, X } from 'lucide-vue-next'
import { servicesApi } from '@/api/services'
import { clientsApi } from '@/api/clients'
import StatusBadge from '@/components/StatusBadge.vue'
import AppDatePicker from '@/components/AppDatePicker.vue'
import { confirmAction, notify } from '@/utils/notify'

const TYPE_OPTIONS = [['HOSTING','Хостинг'],['DOMAIN','Домен'],['MAINTENANCE','Обслуживание'],['SERVER','Сервер'],['LICENSE','Лицензия'],['SUPPORT','Поддержка'],['OTHER','Прочее']]
const CYCLE_OPTIONS = [['MONTHLY','Ежемесячно'],['QUARTERLY','Ежеквартально'],['SEMI_YEARLY','Раз в полгода'],['YEARLY','Ежегодно']]
const TYPE_MAP = Object.fromEntries(TYPE_OPTIONS)
const CYCLE_MAP = Object.fromEntries(CYCLE_OPTIONS)
const typeLabel = (t) => TYPE_MAP[t] || t
const cycleLabel = (c) => CYCLE_MAP[c] || c

const services = ref([])
const clients = ref([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const editingId = ref(null)
const filters = reactive({ status: '', type: '', clientId: '', dueSoon: false, overdue: false })

const toDateInput = (d) => d ? new Date(d).toISOString().slice(0, 10) : ''
const empty = () => ({ clientId: '', projectId: null, title: '', description: '', type: 'HOSTING', billingCycle: 'MONTHLY', amount: 0, currency: 'RUB', nextDueDate: '', autoCreateIncome: true, status: 'ACTIVE', notes: '' })
const form = ref(empty())

const fmt = (v) => Number(v || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₽'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU') : '—'
const isDue = (d) => d && new Date(d) <= new Date()

const load = async () => {
  loading.value = true
  try {
    const p = { status: filters.status || undefined, type: filters.type || undefined, clientId: filters.clientId || undefined, dueSoon: filters.dueSoon || undefined, overdue: filters.overdue || undefined }
    const res = await servicesApi.getAll(p)
    services.value = res.data.data
  } finally { loading.value = false }
}

const openCreate = () => { editingId.value = null; form.value = empty(); dialogVisible.value = true }
const openEdit = (row) => {
  editingId.value = row.id
  form.value = { ...empty(), ...row, nextDueDate: toDateInput(row.nextDueDate) }
  dialogVisible.value = true
}

const save = async () => {
  if (!form.value.clientId) return notify.error('Выберите клиента')
  if (!form.value.title.trim()) return notify.error('Укажите название')
  if (!form.value.amount || form.value.amount <= 0) return notify.error('Укажите сумму')
  if (!form.value.nextDueDate) return notify.error('Укажите дату следующей оплаты')
  saving.value = true
  try {
    editingId.value ? await servicesApi.update(editingId.value, form.value) : await servicesApi.create(form.value)
    notify.success(editingId.value ? 'Регулярная услуга обновлена' : 'Регулярная услуга добавлена')
    dialogVisible.value = false
    load()
  } catch (err) { notify.error(err.response?.data?.error || 'Ошибка') }
  finally { saving.value = false }
}

const remove = async (id) => {
  if (!await confirmAction('Архивировать регулярную услугу?')) return
  await servicesApi.remove(id)
  notify.success('Регулярная услуга архивирована')
  load()
}
const pauseService = async (id) => { await servicesApi.pause(id); notify.success('Регулярная услуга приостановлена'); load() }
const resumeService = async (id) => { await servicesApi.resume(id); notify.success('Регулярная услуга возобновлена'); load() }

onMounted(async () => {
  const [, cr] = await Promise.all([load(), clientsApi.getAll({ status: 'ACTIVE' })])
  clients.value = cr.data.data
})
</script>
