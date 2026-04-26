<template>
  <div>
    <div class="toolbar">
      <div class="toolbar-left">
        <el-select v-model="filters.clientId" placeholder="Все клиенты" clearable @change="load" style="width:200px">
          <el-option v-for="c in clients" :key="c.id" :value="c.id" :label="c.name" />
        </el-select>
        <el-select v-model="filters.status" placeholder="Все статусы" clearable @change="load" style="width:160px">
          <el-option value="ACTIVE" label="Активен" />
          <el-option value="PAUSED" label="Приостановлен" />
          <el-option value="FINISHED" label="Завершён" />
          <el-option value="ARCHIVED" label="Архив" />
        </el-select>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreate">Добавить проект</el-button>
    </div>

    <el-table :data="projects" v-loading="loading" style="margin-top:16px">
      <el-table-column prop="name" label="Проект" min-width="180" />
      <el-table-column label="Клиент" min-width="150">
        <template #default="{ row }">
          <router-link :to="`/clients/${row.client?.id}`" style="color:#409eff;text-decoration:none">{{ row.client?.name }}</router-link>
        </template>
      </el-table-column>
      <el-table-column label="Статус" width="120">
        <template #default="{ row }"><StatusBadge :status="row.status" domain="project" /></template>
      </el-table-column>
      <el-table-column label="Начало" width="110">
        <template #default="{ row }">{{ fmtDate(row.startDate) }}</template>
      </el-table-column>
      <el-table-column label="Конец" width="110">
        <template #default="{ row }">{{ fmtDate(row.endDate) }}</template>
      </el-table-column>
      <el-table-column label="Сайт" width="140">
        <template #default="{ row }">
          <a v-if="row.productionUrl" :href="row.productionUrl" target="_blank" style="color:#409eff;font-size:12px">{{ row.productionUrl }}</a>
          <span v-else style="color:#c0c4cc">—</span>
        </template>
      </el-table-column>
      <el-table-column label="Действия" width="100" align="center">
        <template #default="{ row }">
          <el-button link :icon="Edit" @click="openEdit(row)" />
          <el-popconfirm title="Архивировать проект?" @confirm="remove(row.id)">
            <template #reference><el-button link :icon="Delete" style="color:#f56c6c" /></template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editingId ? 'Редактировать проект' : 'Новый проект'" width="560px">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item label="Клиент *" prop="clientId">
              <el-select v-model="form.clientId" style="width:100%" filterable>
                <el-option v-for="c in clients" :key="c.id" :value="c.id" :label="c.name" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="Название *" prop="name">
              <el-input v-model="form.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Статус">
              <el-select v-model="form.status" style="width:100%">
                <el-option value="ACTIVE" label="Активен" />
                <el-option value="PAUSED" label="Приостановлен" />
                <el-option value="FINISHED" label="Завершён" />
                <el-option value="ARCHIVED" label="Архив" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Репозиторий">
              <el-input v-model="form.repositoryUrl" placeholder="https://github.com/..." />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Начало">
              <el-date-picker v-model="form.startDate" type="date" style="width:100%" value-format="YYYY-MM-DDTHH:mm:ssZ" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Сайт">
              <el-input v-model="form.productionUrl" placeholder="https://example.com" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="Описание">
              <el-input v-model="form.description" type="textarea" :rows="2" />
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
import { projectsApi } from '@/api/projects'
import { clientsApi } from '@/api/clients'
import StatusBadge from '@/components/StatusBadge.vue'

const projects = ref([])
const clients = ref([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const editingId = ref(null)
const formRef = ref()
const filters = reactive({ clientId: '', status: '' })

const empty = () => ({ clientId: '', name: '', description: '', status: 'ACTIVE', startDate: null, endDate: null, repositoryUrl: '', productionUrl: '', notes: '' })
const form = ref(empty())
const rules = {
  clientId: [{ required: true, message: 'Выберите клиента', trigger: 'change' }],
  name: [{ required: true, message: 'Обязательное поле', trigger: 'blur' }],
}

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU') : '—'

const load = async () => {
  loading.value = true
  try {
    const res = await projectsApi.getAll({ clientId: filters.clientId || undefined, status: filters.status || undefined })
    projects.value = res.data.data
  } finally { loading.value = false }
}

const openCreate = () => { editingId.value = null; form.value = empty(); dialogVisible.value = true }
const openEdit = (row) => { editingId.value = row.id; form.value = { ...empty(), ...row }; dialogVisible.value = true }

const save = async () => {
  await formRef.value.validate()
  saving.value = true
  try {
    editingId.value ? await projectsApi.update(editingId.value, form.value) : await projectsApi.create(form.value)
    ElMessage.success(editingId.value ? 'Проект обновлён' : 'Проект добавлен')
    dialogVisible.value = false; load()
  } catch (err) { ElMessage.error(err.response?.data?.error || 'Ошибка') }
  finally { saving.value = false }
}

const remove = async (id) => { await projectsApi.remove(id); ElMessage.success('Проект архивирован'); load() }

onMounted(async () => {
  const [, cr] = await Promise.all([load(), clientsApi.getAll({ status: 'ACTIVE' })])
  clients.value = cr.data.data
})
</script>

<style scoped>
.toolbar { display: flex; justify-content: space-between; align-items: center; }
.toolbar-left { display: flex; gap: 12px; }
</style>
