<template>
  <div>
    <div class="toolbar">
      <div class="toolbar-left">
        <el-select v-model="filters.type" placeholder="Все типы" clearable @change="load" style="width:130px">
          <el-option value="INCOME" label="Доход" />
          <el-option value="EXPENSE" label="Расход" />
        </el-select>
        <el-select v-model="filters.clientId" placeholder="Клиент" clearable @change="load" style="width:170px" filterable>
          <el-option v-for="c in clients" :key="c.id" :value="c.id" :label="c.name" />
        </el-select>
        <el-select v-model="filters.categoryId" placeholder="Категория" clearable @change="load" style="width:170px">
          <el-option v-for="c in categories" :key="c.id" :value="c.id" :label="c.name" />
        </el-select>
        <el-date-picker v-model="filters.dateRange" type="daterange" start-placeholder="От" end-placeholder="До" @change="load" value-format="YYYY-MM-DD" style="width:230px" />
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreate('INCOME')">Добавить транзакцию</el-button>
    </div>

    <el-table :data="transactions" v-loading="loading" style="margin-top:16px">
      <el-table-column label="Дата" width="110">
        <template #default="{ row }">{{ fmtDate(row.date) }}</template>
      </el-table-column>
      <el-table-column prop="description" label="Описание" min-width="200" show-overflow-tooltip />
      <el-table-column label="Тип" width="90">
        <template #default="{ row }"><StatusBadge :status="row.type" domain="transaction" /></template>
      </el-table-column>
      <el-table-column label="Сумма" width="130">
        <template #default="{ row }">
          <span :style="row.type === 'INCOME' ? 'color:#67c23a;font-weight:600' : 'color:#f56c6c;font-weight:600'">
            {{ row.type === 'INCOME' ? '+' : '−' }}{{ fmt(row.amount) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="Категория" width="140">
        <template #default="{ row }">
          <el-tag v-if="row.category" size="small" :style="row.category.color ? `color:${row.category.color};border-color:${row.category.color}` : ''">{{ row.category.name }}</el-tag>
          <span v-else style="color:#c0c4cc">—</span>
        </template>
      </el-table-column>
      <el-table-column label="Клиент" width="130">
        <template #default="{ row }">{{ row.client?.name || '—' }}</template>
      </el-table-column>
      <el-table-column label="Счёт" width="120">
        <template #default="{ row }">{{ row.account?.name || '—' }}</template>
      </el-table-column>
      <el-table-column label="" width="80" align="center">
        <template #default="{ row }">
          <el-button v-if="!row.billingItemId" link :icon="Delete" style="color:#f56c6c" @click="remove(row.id)" />
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" title="Новая транзакция" width="520px">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="Тип *" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio-button value="INCOME">Доход</el-radio-button>
            <el-radio-button value="EXPENSE">Расход</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Сумма *" prop="amount">
              <el-input-number v-model="form.amount" :min="0.01" :precision="2" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Дата *" prop="date">
              <el-date-picker v-model="form.date" type="date" style="width:100%" value-format="YYYY-MM-DDTHH:mm:ssZ" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="Описание">
              <el-input v-model="form.description" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Категория">
              <el-select v-model="form.categoryId" style="width:100%" clearable>
                <el-option v-for="c in filteredCategories" :key="c.id" :value="c.id" :label="c.name" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Счёт/Кошелёк">
              <el-select v-model="form.accountId" style="width:100%" clearable>
                <el-option v-for="a in accounts" :key="a.id" :value="a.id" :label="a.name" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Клиент">
              <el-select v-model="form.clientId" style="width:100%" clearable filterable>
                <el-option v-for="c in clients" :key="c.id" :value="c.id" :label="c.name" />
              </el-select>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { transactionsApi } from '@/api/transactions'
import { clientsApi } from '@/api/clients'
import { categoriesApi } from '@/api/categories'
import { accountsApi } from '@/api/accounts'
import StatusBadge from '@/components/StatusBadge.vue'

const transactions = ref([])
const clients = ref([])
const categories = ref([])
const accounts = ref([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const formRef = ref()
const filters = reactive({ type: '', clientId: '', categoryId: '', dateRange: null })

const empty = () => ({ type: 'INCOME', amount: 0, date: null, description: '', categoryId: null, accountId: null, clientId: null })
const form = ref(empty())
const rules = {
  type: [{ required: true }],
  amount: [{ required: true, type: 'number', min: 0.01, trigger: 'blur' }],
  date: [{ required: true, message: 'Укажите дату', trigger: 'change' }],
}

const filteredCategories = computed(() => categories.value.filter(c => c.type === form.value.type))

const fmt = (v) => Number(v || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₽'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU') : '—'

const load = async () => {
  loading.value = true
  try {
    const p = { type: filters.type || undefined, clientId: filters.clientId || undefined, categoryId: filters.categoryId || undefined, dateFrom: filters.dateRange?.[0] || undefined, dateTo: filters.dateRange?.[1] || undefined }
    const res = await transactionsApi.getAll(p)
    transactions.value = res.data.data
  } finally { loading.value = false }
}

const openCreate = (type) => { form.value = { ...empty(), type }; dialogVisible.value = true }

const save = async () => {
  await formRef.value.validate()
  saving.value = true
  try {
    await transactionsApi.create(form.value)
    ElMessage.success('Транзакция добавлена')
    dialogVisible.value = false; load()
  } catch (err) { ElMessage.error(err.response?.data?.error || 'Ошибка') }
  finally { saving.value = false }
}

const remove = async (id) => {
  await ElMessageBox.confirm('Удалить транзакцию?', 'Подтверждение', { type: 'warning' })
  await transactionsApi.remove(id)
  ElMessage.success('Транзакция удалена'); load()
}

onMounted(async () => {
  const [, cr, catr, acr] = await Promise.all([load(), clientsApi.getAll(), categoriesApi.getAll(), accountsApi.getAll()])
  clients.value = cr.data.data
  categories.value = catr.data.data
  accounts.value = acr.data.data
})
</script>

<style scoped>
.toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
.toolbar-left { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
</style>
