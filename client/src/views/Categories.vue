<template>
  <div class="grid gap-5 xl:grid-cols-2">
    <section v-for="group in groups" :key="group.type" class="ui-card">
      <div class="ui-card-header flex items-center justify-between">
        <span>{{ group.title }}</span>
        <button class="ui-button ui-button-primary py-1.5 text-xs" type="button" @click="openCreate(group.type)">
          <Plus class="size-4" /> Добавить
        </button>
      </div>
      <div class="ui-table-scroll">
        <table class="ui-table">
          <thead><tr><th>Цвет</th><th>Название</th><th class="text-right">Действия</th></tr></thead>
          <tbody>
            <tr v-for="row in group.items" :key="row.id">
              <td><span v-if="row.color" class="inline-block size-4 rounded-full" :style="{ backgroundColor: row.color }" /></td>
              <td class="font-medium text-slate-100">{{ row.name }}</td>
              <td>
                <div class="flex justify-end gap-1">
                  <button class="ui-button ui-button-ghost px-2" type="button" @click="openEdit(row)"><Pencil class="size-4" /></button>
                  <button v-if="!row.isSystem" class="ui-button ui-button-danger px-2" type="button" @click="remove(row.id)"><Trash2 class="size-4" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="dialogVisible" class="ui-modal-backdrop" @click.self="dialogVisible = false">
      <section class="ui-modal max-w-md">
        <header class="ui-modal-header">
          <h2 class="ui-modal-title">{{ editingId ? 'Редактировать категорию' : 'Новая категория' }}</h2>
          <button class="ui-button ui-button-ghost px-2" type="button" @click="dialogVisible = false"><X class="size-4" /></button>
        </header>
        <div class="ui-modal-body space-y-4">
          <label><span class="ui-label">Название *</span><input v-model="form.name" class="ui-input" /></label>
          <label>
            <span class="ui-label">Тип *</span>
            <select v-model="form.type" class="ui-select">
              <option value="INCOME">Доход</option>
              <option value="EXPENSE">Расход</option>
            </select>
          </label>
          <label><span class="ui-label">Цвет</span><input v-model="form.color" class="h-10 w-20 rounded-md border border-slate-700 bg-slate-950 p-1" type="color" /></label>
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
import { computed, onMounted, ref } from 'vue'
import { Pencil, Plus, Trash2, X } from 'lucide-vue-next'
import { categoriesApi } from '@/api/categories'
import { confirmAction, notify } from '@/utils/notify'

const cats = ref([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const editingId = ref(null)

const income = computed(() => cats.value.filter(c => c.type === 'INCOME'))
const expense = computed(() => cats.value.filter(c => c.type === 'EXPENSE'))
const groups = computed(() => [
  { type: 'INCOME', title: 'Категории доходов', items: income.value },
  { type: 'EXPENSE', title: 'Категории расходов', items: expense.value },
])

const empty = (type = 'INCOME') => ({ name: '', type, color: '#38bdf8' })
const form = ref(empty())

const load = async () => {
  loading.value = true
  try { cats.value = (await categoriesApi.getAll()).data.data }
  finally { loading.value = false }
}

const openCreate = (type) => { editingId.value = null; form.value = empty(type); dialogVisible.value = true }
const openEdit = (row) => { editingId.value = row.id; form.value = { name: row.name, type: row.type, color: row.color || '#38bdf8' }; dialogVisible.value = true }

const save = async () => {
  if (!form.value.name.trim()) return notify.error('Укажите название категории')
  saving.value = true
  try {
    editingId.value ? await categoriesApi.update(editingId.value, form.value) : await categoriesApi.create(form.value)
    notify.success(editingId.value ? 'Категория обновлена' : 'Категория добавлена')
    dialogVisible.value = false
    load()
  } catch (err) { notify.error(err.response?.data?.error || 'Ошибка') }
  finally { saving.value = false }
}

const remove = async (id) => {
  if (!await confirmAction('Удалить категорию?')) return
  try { await categoriesApi.remove(id); notify.success('Удалено'); load() }
  catch (err) { notify.error(err.response?.data?.error || 'Ошибка') }
}

onMounted(load)
</script>
