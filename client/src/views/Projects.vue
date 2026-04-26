<template>
  <div>
    <div class="ui-toolbar">
      <div class="ui-toolbar-left">
        <select v-model="filters.clientId" class="ui-select w-56" @change="load">
          <option value="">Все клиенты</option>
          <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <select v-model="filters.status" class="ui-select w-48" @change="load">
          <option value="">Все статусы</option>
          <option value="ACTIVE">Активен</option>
          <option value="PAUSED">Приостановлен</option>
          <option value="FINISHED">Завершён</option>
          <option value="ARCHIVED">Архив</option>
        </select>
      </div>
      <button class="ui-button ui-button-primary" type="button" @click="openCreate"><Plus class="size-4" /> Добавить проект</button>
    </div>

    <div class="ui-table-wrap">
      <div class="ui-table-scroll">
        <table class="ui-table">
          <thead>
            <tr>
              <th>Проект</th>
              <th>Клиент</th>
              <th>Статус</th>
              <th>Начало</th>
              <th>Конец</th>
              <th>Сайт</th>
              <th class="text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in projects" :key="row.id">
              <td><router-link :to="`/projects/${row.id}`" class="font-medium text-slate-100 hover:text-sky-300">{{ row.name }}</router-link></td>
              <td><router-link v-if="row.client" :to="`/clients/${row.client.id}`">{{ row.client.name }}</router-link><span v-else>—</span></td>
              <td><StatusBadge :status="row.status" domain="project" /></td>
              <td>{{ fmtDate(row.startDate) }}</td>
              <td>{{ fmtDate(row.endDate) }}</td>
              <td><a v-if="row.productionUrl" :href="row.productionUrl" target="_blank" class="text-xs">{{ row.productionUrl }}</a><span v-else class="text-slate-500">—</span></td>
              <td>
                <div class="flex justify-end gap-1">
                  <button class="ui-button ui-button-ghost px-2" type="button" @click="openEdit(row)"><Pencil class="size-4" /></button>
                  <button class="ui-button ui-button-danger px-2" type="button" @click="remove(row.id)"><Trash2 class="size-4" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="!projects.length && !loading" class="ui-empty m-5">Проекты не найдены</div>
    </div>

    <div v-if="dialogVisible" class="ui-modal-backdrop" @click.self="dialogVisible = false">
      <section class="ui-modal">
        <header class="ui-modal-header">
          <h2 class="ui-modal-title">{{ editingId ? 'Редактировать проект' : 'Новый проект' }}</h2>
          <button class="ui-button ui-button-ghost px-2" type="button" @click="dialogVisible = false"><X class="size-4" /></button>
        </header>
        <div class="ui-modal-body">
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="sm:col-span-2">
              <span class="ui-label">Клиент *</span>
              <select v-model="form.clientId" class="ui-select">
                <option value="">Выберите клиента</option>
                <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </label>
            <label class="sm:col-span-2"><span class="ui-label">Название *</span><input v-model="form.name" class="ui-input" /></label>
            <label>
              <span class="ui-label">Статус</span>
              <select v-model="form.status" class="ui-select">
                <option value="ACTIVE">Активен</option>
                <option value="PAUSED">Приостановлен</option>
                <option value="FINISHED">Завершён</option>
                <option value="ARCHIVED">Архив</option>
              </select>
            </label>
            <label><span class="ui-label">Репозиторий</span><input v-model="form.repositoryUrl" class="ui-input" placeholder="https://github.com/..." /></label>
            <label><span class="ui-label">Начало</span><AppDatePicker v-model="form.startDate" /></label>
            <label><span class="ui-label">Сайт</span><input v-model="form.productionUrl" class="ui-input" placeholder="https://example.com" /></label>
            <label class="sm:col-span-2"><span class="ui-label">Описание</span><textarea v-model="form.description" class="ui-textarea" /></label>
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
import { projectsApi } from '@/api/projects'
import { clientsApi } from '@/api/clients'
import StatusBadge from '@/components/StatusBadge.vue'
import AppDatePicker from '@/components/AppDatePicker.vue'
import { confirmAction, notify } from '@/utils/notify'

const projects = ref([])
const clients = ref([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const editingId = ref(null)
const filters = reactive({ clientId: '', status: '' })

const toDateInput = (d) => d ? new Date(d).toISOString().slice(0, 10) : ''
const empty = () => ({ clientId: '', name: '', description: '', status: 'ACTIVE', startDate: '', endDate: '', repositoryUrl: '', productionUrl: '', notes: '' })
const form = ref(empty())

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU') : '—'

const load = async () => {
  loading.value = true
  try {
    const res = await projectsApi.getAll({ clientId: filters.clientId || undefined, status: filters.status || undefined })
    projects.value = res.data.data
  } finally { loading.value = false }
}

const openCreate = () => { editingId.value = null; form.value = empty(); dialogVisible.value = true }
const openEdit = (row) => {
  editingId.value = row.id
  form.value = { ...empty(), ...row, startDate: toDateInput(row.startDate), endDate: toDateInput(row.endDate) }
  dialogVisible.value = true
}

const save = async () => {
  if (!form.value.clientId) return notify.error('Выберите клиента')
  if (!form.value.name.trim()) return notify.error('Укажите название')
  saving.value = true
  try {
    editingId.value ? await projectsApi.update(editingId.value, form.value) : await projectsApi.create(form.value)
    notify.success(editingId.value ? 'Проект обновлён' : 'Проект добавлен')
    dialogVisible.value = false
    load()
  } catch (err) { notify.error(err.response?.data?.error || 'Ошибка') }
  finally { saving.value = false }
}

const remove = async (id) => {
  if (!await confirmAction('Архивировать проект?')) return
  await projectsApi.remove(id)
  notify.success('Проект архивирован')
  load()
}

onMounted(async () => {
  const [, cr] = await Promise.all([load(), clientsApi.getAll({ status: 'ACTIVE' })])
  clients.value = cr.data.data
})
</script>
