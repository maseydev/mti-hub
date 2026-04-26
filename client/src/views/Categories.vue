<template>
  <div>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span>Категории доходов</span>
              <el-button size="small" type="primary" :icon="Plus" @click="openCreate('INCOME')">Добавить</el-button>
            </div>
          </template>
          <el-table :data="income" v-loading="loading" size="small">
            <el-table-column label="Цвет" width="60">
              <template #default="{ row }">
                <span v-if="row.color" :style="`display:inline-block;width:16px;height:16px;border-radius:50%;background:${row.color}`" />
              </template>
            </el-table-column>
            <el-table-column prop="name" label="Название" min-width="150" />
            <el-table-column label="" width="80" align="center">
              <template #default="{ row }">
                <el-button link :icon="Edit" @click="openEdit(row)" />
                <el-button v-if="!row.isSystem" link :icon="Delete" style="color:#f56c6c" @click="remove(row.id)" />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span>Категории расходов</span>
              <el-button size="small" type="primary" :icon="Plus" @click="openCreate('EXPENSE')">Добавить</el-button>
            </div>
          </template>
          <el-table :data="expense" v-loading="loading" size="small">
            <el-table-column label="Цвет" width="60">
              <template #default="{ row }">
                <span v-if="row.color" :style="`display:inline-block;width:16px;height:16px;border-radius:50%;background:${row.color}`" />
              </template>
            </el-table-column>
            <el-table-column prop="name" label="Название" min-width="150" />
            <el-table-column label="" width="80" align="center">
              <template #default="{ row }">
                <el-button link :icon="Edit" @click="openEdit(row)" />
                <el-button v-if="!row.isSystem" link :icon="Delete" style="color:#f56c6c" @click="remove(row.id)" />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="dialogVisible" :title="editingId ? 'Редактировать категорию' : 'Новая категория'" width="400px">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="Название *" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="Тип *" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio-button value="INCOME">Доход</el-radio-button>
            <el-radio-button value="EXPENSE">Расход</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="Цвет">
          <el-color-picker v-model="form.color" />
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
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { categoriesApi } from '@/api/categories'

const cats = ref([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const editingId = ref(null)
const formRef = ref()

const income = computed(() => cats.value.filter(c => c.type === 'INCOME'))
const expense = computed(() => cats.value.filter(c => c.type === 'EXPENSE'))

const empty = (type = 'INCOME') => ({ name: '', type, color: '' })
const form = ref(empty())
const rules = {
  name: [{ required: true, message: 'Обязательное поле', trigger: 'blur' }],
  type: [{ required: true }],
}

const load = async () => {
  loading.value = true
  try { cats.value = (await categoriesApi.getAll()).data.data }
  finally { loading.value = false }
}

const openCreate = (type) => { editingId.value = null; form.value = empty(type); dialogVisible.value = true }
const openEdit = (row) => { editingId.value = row.id; form.value = { name: row.name, type: row.type, color: row.color || '' }; dialogVisible.value = true }

const save = async () => {
  await formRef.value.validate()
  saving.value = true
  try {
    editingId.value ? await categoriesApi.update(editingId.value, form.value) : await categoriesApi.create(form.value)
    ElMessage.success(editingId.value ? 'Категория обновлена' : 'Категория добавлена')
    dialogVisible.value = false; load()
  } catch (err) { ElMessage.error(err.response?.data?.error || 'Ошибка') }
  finally { saving.value = false }
}

const remove = async (id) => {
  await ElMessageBox.confirm('Удалить категорию?', 'Подтверждение', { type: 'warning' })
  try { await categoriesApi.remove(id); ElMessage.success('Удалено'); load() }
  catch (err) { ElMessage.error(err.response?.data?.error || 'Ошибка') }
}

onMounted(load)
</script>
