<template>
  <div>
    <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
      <el-button type="primary" :icon="Plus" @click="openCreate">Добавить счёт</el-button>
    </div>

    <el-table :data="accounts" v-loading="loading">
      <el-table-column prop="name" label="Название" min-width="160" />
      <el-table-column label="Тип" width="120">
        <template #default="{ row }">{{ typeLabel(row.type) }}</template>
      </el-table-column>
      <el-table-column prop="currency" label="Валюта" width="80" />
      <el-table-column label="Нач. баланс" width="140">
        <template #default="{ row }">{{ fmt(row.openingBalance) }}</template>
      </el-table-column>
      <el-table-column label="Текущий баланс" width="160">
        <template #default="{ row }">
          <span :style="row.balance >= 0 ? 'color:#67c23a;font-weight:600' : 'color:#f56c6c;font-weight:600'">{{ fmt(row.balance) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Активен" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.isActive ? 'success' : 'info'" size="small">{{ row.isActive ? 'Да' : 'Нет' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Действия" width="100" align="center">
        <template #default="{ row }">
          <el-button link :icon="Edit" @click="openEdit(row)" />
          <el-popconfirm title="Удалить счёт?" @confirm="remove(row.id)">
            <template #reference><el-button link :icon="Delete" style="color:#f56c6c" /></template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editingId ? 'Редактировать счёт' : 'Новый счёт'" width="440px">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-row :gutter="16">
          <el-col :span="14">
            <el-form-item label="Название *" prop="name">
              <el-input v-model="form.name" />
            </el-form-item>
          </el-col>
          <el-col :span="10">
            <el-form-item label="Тип *" prop="type">
              <el-select v-model="form.type" style="width:100%">
                <el-option v-for="[v,l] in TYPE_OPTIONS" :key="v" :value="v" :label="l" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="10">
            <el-form-item label="Валюта">
              <el-input v-model="form.currency" maxlength="3" />
            </el-form-item>
          </el-col>
          <el-col :span="14">
            <el-form-item label="Начальный баланс">
              <el-input-number v-model="form.openingBalance" :precision="2" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Активен">
              <el-switch v-model="form.isActive" />
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
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { accountsApi } from '@/api/accounts'

const TYPE_OPTIONS = [['CASH','Наличные'],['BANK','Банк'],['CARD','Карта'],['CRYPTO','Крипто'],['OTHER','Прочее']]
const TYPE_MAP = Object.fromEntries(TYPE_OPTIONS)
const typeLabel = (t) => TYPE_MAP[t] || t

const accounts = ref([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const editingId = ref(null)
const formRef = ref()

const empty = () => ({ name: '', type: 'BANK', currency: 'RUB', openingBalance: 0, isActive: true })
const form = ref(empty())
const rules = {
  name: [{ required: true, message: 'Обязательное поле', trigger: 'blur' }],
  type: [{ required: true }],
}

const fmt = (v) => Number(v || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₽'

const load = async () => {
  loading.value = true
  try { accounts.value = (await accountsApi.getAll()).data.data }
  finally { loading.value = false }
}

const openCreate = () => { editingId.value = null; form.value = empty(); dialogVisible.value = true }
const openEdit = (row) => { editingId.value = row.id; form.value = { ...empty(), ...row }; dialogVisible.value = true }

const save = async () => {
  await formRef.value.validate()
  saving.value = true
  try {
    editingId.value ? await accountsApi.update(editingId.value, form.value) : await accountsApi.create(form.value)
    ElMessage.success(editingId.value ? 'Счёт обновлён' : 'Счёт добавлен')
    dialogVisible.value = false; load()
  } catch (err) { ElMessage.error(err.response?.data?.error || 'Ошибка') }
  finally { saving.value = false }
}

const remove = async (id) => {
  try { await accountsApi.remove(id); ElMessage.success('Удалено'); load() }
  catch (err) { ElMessage.error(err.response?.data?.error || 'Ошибка') }
}

onMounted(load)
</script>
