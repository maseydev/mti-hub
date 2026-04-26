<template>
  <div>
    <div class="toolbar">
      <div class="toolbar-left">
        <el-select v-model="filters.status" placeholder="Все статусы" clearable @change="load" style="width:160px">
          <el-option value="ACTIVE" label="Активен" />
          <el-option value="PAUSED" label="Приостановлен" />
          <el-option value="ARCHIVED" label="Архив" />
        </el-select>
        <el-input v-model="filters.search" placeholder="Поиск..." clearable @input="load" style="width:220px" />
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreate">Добавить клиента</el-button>
    </div>

    <el-table :data="clients" v-loading="loading" style="margin-top:16px">
      <el-table-column prop="name" label="Название" min-width="160">
        <template #default="{ row }">
          <router-link :to="`/clients/${row.id}`" style="color:#409eff;text-decoration:none">{{ row.name }}</router-link>
        </template>
      </el-table-column>
      <el-table-column prop="contactName" label="Контакт" min-width="140" />
      <el-table-column prop="email" label="Email" min-width="180" />
      <el-table-column prop="phone" label="Телефон" min-width="140" />
      <el-table-column label="Проекты" width="80" align="center">
        <template #default="{ row }">{{ row._count?.projects ?? 0 }}</template>
      </el-table-column>
      <el-table-column label="Статус" width="140">
        <template #default="{ row }"><StatusBadge :status="row.status" domain="client" /></template>
      </el-table-column>
      <el-table-column label="Действия" width="120" align="center">
        <template #default="{ row }">
          <el-button link :icon="Edit" @click="openEdit(row)" />
          <el-popconfirm title="Архивировать клиента?" @confirm="remove(row.id)">
            <template #reference>
              <el-button link :icon="Delete" style="color:#f56c6c" />
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editingId ? 'Редактировать клиента' : 'Новый клиент'" width="560px">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Название *" prop="name">
              <el-input v-model="form.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Контактное лицо">
              <el-input v-model="form.contactName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Email">
              <el-input v-model="form.email" type="email" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Телефон">
              <el-input v-model="form.phone" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Telegram">
              <el-input v-model="form.telegram" placeholder="@username" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Компания">
              <el-input v-model="form.companyName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="ИНН">
              <el-input v-model="form.taxId" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Статус">
              <el-select v-model="form.status" style="width:100%">
                <el-option value="ACTIVE" label="Активен" />
                <el-option value="PAUSED" label="Приостановлен" />
                <el-option value="ARCHIVED" label="Архив" />
              </el-select>
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
import { clientsApi } from '@/api/clients'
import StatusBadge from '@/components/StatusBadge.vue'

const clients = ref([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const editingId = ref(null)
const formRef = ref()
const filters = reactive({ status: '', search: '' })

const emptyForm = () => ({ name: '', contactName: '', email: '', phone: '', telegram: '', companyName: '', taxId: '', notes: '', status: 'ACTIVE' })
const form = ref(emptyForm())
const rules = { name: [{ required: true, message: 'Обязательное поле', trigger: 'blur' }] }

const load = async () => {
  loading.value = true
  try {
    const res = await clientsApi.getAll({ status: filters.status || undefined, search: filters.search || undefined })
    clients.value = res.data.data
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  editingId.value = null
  form.value = emptyForm()
  dialogVisible.value = true
}

const openEdit = (row) => {
  editingId.value = row.id
  form.value = { ...emptyForm(), ...row }
  dialogVisible.value = true
}

const save = async () => {
  await formRef.value.validate()
  saving.value = true
  try {
    if (editingId.value) {
      await clientsApi.update(editingId.value, form.value)
      ElMessage.success('Клиент обновлён')
    } else {
      await clientsApi.create(form.value)
      ElMessage.success('Клиент добавлен')
    }
    dialogVisible.value = false
    load()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || 'Ошибка')
  } finally {
    saving.value = false
  }
}

const remove = async (id) => {
  await clientsApi.remove(id)
  ElMessage.success('Клиент архивирован')
  load()
}

onMounted(load)
</script>

<style scoped>
.toolbar { display: flex; justify-content: space-between; align-items: center; }
.toolbar-left { display: flex; gap: 12px; }
</style>
