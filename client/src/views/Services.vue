<template>
  <div>
    <div class="toolbar">
      <div class="toolbar-left">
        <el-select v-model="filters.status" placeholder="Статус" clearable @change="load" style="width:140px">
          <el-option value="ACTIVE" label="Активна" />
          <el-option value="PAUSED" label="Пауза" />
          <el-option value="CANCELLED" label="Отменена" />
          <el-option value="ARCHIVED" label="Архив" />
        </el-select>
        <el-select v-model="filters.type" placeholder="Тип" clearable @change="load" style="width:150px">
          <el-option v-for="[val,lbl] in TYPE_OPTIONS" :key="val" :value="val" :label="lbl" />
        </el-select>
        <el-select v-model="filters.clientId" placeholder="Клиент" clearable @change="load" style="width:180px" filterable>
          <el-option v-for="c in clients" :key="c.id" :value="c.id" :label="c.name" />
        </el-select>
        <el-checkbox v-model="filters.dueSoon" label="Скоро" @change="load" />
        <el-checkbox v-model="filters.overdue" label="Просрочено" @change="load" />
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreate">Добавить услугу</el-button>
    </div>

    <el-table :data="services" v-loading="loading" style="margin-top:16px">
      <el-table-column prop="title" label="Услуга" min-width="180" />
      <el-table-column label="Клиент" min-width="140">
        <template #default="{ row }">{{ row.client?.name }}</template>
      </el-table-column>
      <el-table-column label="Тип" width="120">
        <template #default="{ row }">{{ typeLabel(row.type) }}</template>
      </el-table-column>
      <el-table-column label="Цикл" width="120">
        <template #default="{ row }">{{ cycleLabel(row.billingCycle) }}</template>
      </el-table-column>
      <el-table-column label="Сумма" width="120">
        <template #default="{ row }">{{ fmt(row.amount) }}</template>
      </el-table-column>
      <el-table-column label="След. оплата" width="130">
        <template #default="{ row }">
          <span :style="isDue(row.nextDueDate) ? 'color:#f56c6c;font-weight:600' : ''">{{ fmtDate(row.nextDueDate) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Статус" width="110">
        <template #default="{ row }"><StatusBadge :status="row.status" domain="service" /></template>
      </el-table-column>
      <el-table-column label="Действия" width="140" align="center">
        <template #default="{ row }">
          <el-button link :icon="Edit" @click="openEdit(row)" />
          <el-button v-if="row.status === 'ACTIVE'" link @click="pauseService(row.id)" title="Приостановить">⏸</el-button>
          <el-button v-if="row.status === 'PAUSED'" link @click="resumeService(row.id)" title="Возобновить">▶️</el-button>
          <el-popconfirm title="Архивировать услугу?" @confirm="remove(row.id)">
            <template #reference><el-button link :icon="Delete" style="color:#f56c6c" /></template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editingId ? 'Редактировать услугу' : 'Новая услуга'" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Клиент *" prop="clientId">
              <el-select v-model="form.clientId" style="width:100%" filterable>
                <el-option v-for="c in clients" :key="c.id" :value="c.id" :label="c.name" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Название *" prop="title">
              <el-input v-model="form.title" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Тип *" prop="type">
              <el-select v-model="form.type" style="width:100%">
                <el-option v-for="[val,lbl] in TYPE_OPTIONS" :key="val" :value="val" :label="lbl" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Цикл оплаты *" prop="billingCycle">
              <el-select v-model="form.billingCycle" style="width:100%">
                <el-option v-for="[val,lbl] in CYCLE_OPTIONS" :key="val" :value="val" :label="lbl" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Сумма *" prop="amount">
              <el-input-number v-model="form.amount" :min="0.01" :precision="2" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Следующая оплата *" prop="nextDueDate">
              <el-date-picker v-model="form.nextDueDate" type="date" style="width:100%" value-format="YYYY-MM-DDTHH:mm:ssZ" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Статус">
              <el-select v-model="form.status" style="width:100%">
                <el-option value="ACTIVE" label="Активна" />
                <el-option value="PAUSED" label="Пауза" />
                <el-option value="CANCELLED" label="Отменена" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Авто-доход">
              <el-switch v-model="form.autoCreateIncome" active-text="Да" inactive-text="Нет" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="Заметки">
              <el-input v-model="form.notes" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">Отмена</el-button>
        <el-button type="primary" :loading="saving" @click="save">Сохранить</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { servicesApi } from '@/api/services'
import { clientsApi } from '@/api/clients'
import StatusBadge from '@/components/StatusBadge.vue'

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
const formRef = ref()
const filters = reactive({ status: '', type: '', clientId: '', dueSoon: false, overdue: false })

const empty = () => ({ clientId: '', projectId: null, title: '', description: '', type: 'HOSTING', billingCycle: 'MONTHLY', amount: 0, currency: 'RUB', nextDueDate: null, autoCreateIncome: true, status: 'ACTIVE', notes: '' })
const form = ref(empty())
const rules = {
  clientId: [{ required: true, message: 'Выберите клиента', trigger: 'change' }],
  title: [{ required: true, message: 'Обязательное поле', trigger: 'blur' }],
  type: [{ required: true, trigger: 'change' }],
  billingCycle: [{ required: true, trigger: 'change' }],
  amount: [{ required: true, type: 'number', min: 0.01, message: 'Укажите сумму', trigger: 'blur' }],
  nextDueDate: [{ required: true, message: 'Укажите дату', trigger: 'change' }],
}

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
const openEdit = (row) => { editingId.value = row.id; form.value = { ...empty(), ...row }; dialogVisible.value = true }

const save = async () => {
  await formRef.value.validate()
  saving.value = true
  try {
    editingId.value ? await servicesApi.update(editingId.value, form.value) : await servicesApi.create(form.value)
    ElMessage.success(editingId.value ? 'Услуга обновлена' : 'Услуга добавлена')
    dialogVisible.value = false; load()
  } catch (err) { ElMessage.error(err.response?.data?.error || 'Ошибка') }
  finally { saving.value = false }
}

const remove = async (id) => { await servicesApi.remove(id); ElMessage.success('Услуга архивирована'); load() }
const pauseService = async (id) => { await servicesApi.pause(id); ElMessage.success('Услуга приостановлена'); load() }
const resumeService = async (id) => { await servicesApi.resume(id); ElMessage.success('Услуга возобновлена'); load() }

onMounted(async () => {
  const [, cr] = await Promise.all([load(), clientsApi.getAll({ status: 'ACTIVE' })])
  clients.value = cr.data.data
})
</script>

<style scoped>
.toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
.toolbar-left { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
</style>
