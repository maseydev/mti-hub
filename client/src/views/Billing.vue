<template>
  <div>
    <div class="toolbar">
      <div class="toolbar-left">
        <el-select v-model="filters.status" placeholder="Все статусы" clearable @change="load" style="width:150px">
          <el-option value="PLANNED" label="Запланировано" />
          <el-option value="DUE" label="К оплате" />
          <el-option value="OVERDUE" label="Просрочено" />
          <el-option value="PAID" label="Оплачено" />
          <el-option value="CANCELLED" label="Отменено" />
        </el-select>
        <el-select v-model="filters.clientId" placeholder="Клиент" clearable @change="load" style="width:180px" filterable>
          <el-option v-for="c in clients" :key="c.id" :value="c.id" :label="c.name" />
        </el-select>
        <el-date-picker v-model="filters.dateRange" type="daterange" start-placeholder="От" end-placeholder="До" @change="load" value-format="YYYY-MM-DD" style="width:240px" />
      </div>
      <div style="display:flex;gap:8px">
        <el-button @click="generate" :loading="generating">Сгенерировать из услуг</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreate">Добавить счёт</el-button>
      </div>
    </div>

    <el-table :data="items" v-loading="loading" style="margin-top:16px"
      :row-class-name="({ row }) => row.status === 'OVERDUE' ? 'row-overdue' : ''">
      <el-table-column prop="title" label="Название" min-width="200" show-overflow-tooltip />
      <el-table-column label="Клиент" min-width="140">
        <template #default="{ row }">{{ row.client?.name }}</template>
      </el-table-column>
      <el-table-column label="Сумма" width="130">
        <template #default="{ row }">{{ fmt(row.amount) }}</template>
      </el-table-column>
      <el-table-column label="Дата" width="110">
        <template #default="{ row }">{{ fmtDate(row.dueDate) }}</template>
      </el-table-column>
      <el-table-column label="Оплачено" width="110">
        <template #default="{ row }">{{ row.paidAt ? fmtDate(row.paidAt) : '—' }}</template>
      </el-table-column>
      <el-table-column label="Статус" width="130">
        <template #default="{ row }"><StatusBadge :status="row.status" domain="billing" /></template>
      </el-table-column>
      <el-table-column label="Действия" width="140" align="center">
        <template #default="{ row }">
          <el-button
            v-if="!['PAID','CANCELLED'].includes(row.status)"
            link type="success" @click="markPaid(row.id)"
            title="Отметить оплачено">✓ Оплачено</el-button>
          <el-popconfirm title="Отменить счёт?" @confirm="cancelItem(row.id)">
            <template #reference>
              <el-button v-if="!['PAID','CANCELLED'].includes(row.status)" link style="color:#f56c6c">Отмена</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" title="Новый счёт вручную" width="480px">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="Клиент *" prop="clientId">
          <el-select v-model="form.clientId" style="width:100%" filterable>
            <el-option v-for="c in clients" :key="c.id" :value="c.id" :label="c.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="Название *" prop="title">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Сумма *" prop="amount">
              <el-input-number v-model="form.amount" :min="0.01" :precision="2" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Дата оплаты *" prop="dueDate">
              <el-date-picker v-model="form.dueDate" type="date" style="width:100%" value-format="YYYY-MM-DDTHH:mm:ssZ" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="Заметки">
          <el-input v-model="form.notes" type="textarea" :rows="2" />
        </el-form-item>
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
import { Plus } from '@element-plus/icons-vue'
import { billingApi } from '@/api/billing'
import { clientsApi } from '@/api/clients'
import StatusBadge from '@/components/StatusBadge.vue'

const items = ref([])
const clients = ref([])
const loading = ref(false)
const saving = ref(false)
const generating = ref(false)
const dialogVisible = ref(false)
const formRef = ref()
const filters = reactive({ status: '', clientId: '', dateRange: null })

const empty = () => ({ clientId: '', title: '', amount: 0, dueDate: null, notes: '' })
const form = ref(empty())
const rules = {
  clientId: [{ required: true, message: 'Выберите клиента', trigger: 'change' }],
  title: [{ required: true, message: 'Обязательное поле', trigger: 'blur' }],
  amount: [{ required: true, type: 'number', min: 0.01, trigger: 'blur' }],
  dueDate: [{ required: true, message: 'Укажите дату', trigger: 'change' }],
}

const fmt = (v) => Number(v || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₽'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU') : '—'

const load = async () => {
  loading.value = true
  try {
    const p = {
      status: filters.status || undefined,
      clientId: filters.clientId || undefined,
      dateFrom: filters.dateRange?.[0] || undefined,
      dateTo: filters.dateRange?.[1] || undefined,
    }
    const res = await billingApi.getItems(p)
    items.value = res.data.data
  } finally { loading.value = false }
}

const openCreate = () => { form.value = empty(); dialogVisible.value = true }

const save = async () => {
  await formRef.value.validate()
  saving.value = true
  try {
    await billingApi.createItem(form.value)
    ElMessage.success('Счёт добавлен')
    dialogVisible.value = false; load()
  } catch (err) { ElMessage.error(err.response?.data?.error || 'Ошибка') }
  finally { saving.value = false }
}

const markPaid = async (id) => {
  await billingApi.markPaid(id)
  ElMessage.success('Отмечено как оплачено')
  load()
}

const cancelItem = async (id) => {
  await billingApi.updateItem(id, { status: 'CANCELLED' })
  ElMessage.success('Счёт отменён'); load()
}

const generate = async () => {
  generating.value = true
  try {
    const res = await billingApi.generate()
    const { created, skipped } = res.data.data
    ElMessage.success(`Создано: ${created}, пропущено: ${skipped}`)
    load()
  } catch (err) { ElMessage.error(err.response?.data?.error || 'Ошибка') }
  finally { generating.value = false }
}

onMounted(async () => {
  const [, cr] = await Promise.all([load(), clientsApi.getAll({ status: 'ACTIVE' })])
  clients.value = cr.data.data
})
</script>

<style scoped>
.toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
.toolbar-left { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
</style>
<style>
.row-overdue td { background: rgba(255, 107, 107, 0.09) !important; }
</style>
