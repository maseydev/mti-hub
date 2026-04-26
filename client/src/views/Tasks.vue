<template>
  <div>
    <div class="ui-toolbar">
      <div class="ui-toolbar-left">
        <select v-if="auth.isAdminOrManager" v-model="filters.projectId" class="ui-select w-52" @change="load">
          <option value="">Все проекты</option>
          <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
        <select v-if="!auth.isMember" v-model="filters.assigneeId" class="ui-select w-48" @change="load">
          <option value="">Исполнитель</option>
          <option v-for="m in members" :key="m.id" :value="m.id">{{ m.name }}</option>
        </select>
        <select v-model="filters.status" class="ui-select w-44" :disabled="filters.overdue" @change="load">
          <option value="">Все статусы</option>
          <option v-for="[val, lbl] in STATUS_OPTIONS" :key="val" :value="val">{{ lbl }}</option>
        </select>
        <select v-model="filters.priority" class="ui-select w-36" @change="load">
          <option value="">Приоритет</option>
          <option v-for="[val, lbl] in PRIORITY_OPTIONS" :key="val" :value="val">{{ lbl }}</option>
        </select>
        <label class="flex items-center gap-2 text-sm text-slate-300">
          <input v-model="filters.overdue" type="checkbox" @change="load" /> Просроченные
        </label>
      </div>
      <button v-if="auth.isAdminOrManager" class="ui-button ui-button-primary" type="button" @click="openCreate">
        <Plus class="size-4" /> Добавить задачу
      </button>
    </div>

    <div class="ui-table-wrap">
      <div class="ui-table-scroll">
        <table class="ui-table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Клиент</th>
              <th>Проект</th>
              <th>Исполнитель</th>
              <th>Статус</th>
              <th>Приоритет</th>
              <th>План старт</th>
              <th>План конец</th>
              <th>Дедлайн</th>
              <th class="text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in tasks"
              :key="row.id"
              :class="isOverdue(row) ? 'bg-red-950/20' : ''"
            >
              <td class="max-w-64 truncate font-medium text-slate-100">{{ row.title }}</td>
              <td>{{ row.project?.client?.name || '—' }}</td>
              <td>
                <router-link :to="`/projects/${row.projectId}`" class="hover:text-sky-300">
                  {{ row.project?.name || '—' }}
                </router-link>
              </td>
              <td>{{ row.assignee?.name || '—' }}</td>
              <td><StatusBadge :status="row.status" domain="task" /></td>
              <td><StatusBadge :status="row.priority" domain="priority" /></td>
              <td class="ui-number">{{ fmtDate(row.plannedStart) }}</td>
              <td class="ui-number">{{ fmtDate(row.plannedEnd) }}</td>
              <td class="ui-number" :class="isOverdue(row) ? 'font-semibold text-rose-300' : ''">
                {{ fmtDate(row.dueDate) }}
              </td>
              <td>
                <div class="flex justify-end gap-1">
                  <select
                    class="ui-select py-1 text-xs"
                    :value="row.status"
                    @change="changeStatus(row.id, $event.target.value)"
                  >
                    <option v-for="[val, lbl] in STATUS_OPTIONS" :key="val" :value="val">{{ lbl }}</option>
                  </select>
                  <button v-if="auth.isAdminOrManager" class="ui-button ui-button-ghost px-2" type="button" @click="openEdit(row)">
                    <Pencil class="size-4" />
                  </button>
                  <button v-if="auth.isAdminOrManager" class="ui-button ui-button-danger px-2" type="button" @click="remove(row.id)">
                    <Trash2 class="size-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="!tasks.length && !loading" class="ui-empty m-5">Задачи не найдены</div>
    </div>

    <TaskFormModal
      :visible="dialogVisible"
      :task="editingTask"
      :projects="projects"
      :members="members"
      @close="dialogVisible = false"
      @saved="onSaved"
    />
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { Pencil, Plus, Trash2 } from 'lucide-vue-next'
import { tasksApi } from '@/api/tasks'
import { projectsApi } from '@/api/projects'
import { teamApi } from '@/api/team'
import StatusBadge from '@/components/StatusBadge.vue'
import TaskFormModal from '@/components/TaskFormModal.vue'
import { confirmAction, notify } from '@/utils/notify'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const STATUS_OPTIONS = [
  ['TODO', 'К выполнению'],
  ['IN_PROGRESS', 'В работе'],
  ['DONE', 'Готово'],
  ['CANCELLED', 'Отменено'],
]
const PRIORITY_OPTIONS = [
  ['LOW', 'Низкий'],
  ['MEDIUM', 'Средний'],
  ['HIGH', 'Высокий'],
]

const tasks = ref([])
const projects = ref([])
const members = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const editingTask = ref(null)
const filters = reactive({ projectId: '', assigneeId: '', status: '', priority: '', overdue: false })

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU') : '—'
const isOverdue = (row) => {
  if (!row.dueDate || ['DONE', 'CANCELLED'].includes(row.status)) return false
  return new Date(row.dueDate) < new Date()
}

const load = async () => {
  loading.value = true
  try {
    const p = {
      projectId: filters.projectId || undefined,
      assigneeId: filters.assigneeId || undefined,
      status: !filters.overdue && filters.status ? filters.status : undefined,
      priority: filters.priority || undefined,
      overdue: filters.overdue ? 'true' : undefined,
    }
    tasks.value = (await tasksApi.getAll(p)).data.data
  } finally {
    loading.value = false
  }
}

const openCreate = () => { editingTask.value = null; dialogVisible.value = true }
const openEdit = (row) => { editingTask.value = row; dialogVisible.value = true }
const onSaved = () => load()

const changeStatus = async (id, status) => {
  try {
    await tasksApi.updateStatus(id, status)
    load()
  } catch (err) {
    notify.error(err.response?.data?.error || 'Ошибка')
  }
}

const remove = async (id) => {
  if (!await confirmAction('Удалить задачу?')) return
  try {
    await tasksApi.remove(id)
    notify.success('Задача удалена')
    load()
  } catch (err) {
    notify.error(err.response?.data?.error || 'Ошибка')
  }
}

onMounted(async () => {
  const promises = [load()]
  if (auth.isAdminOrManager) {
    promises.push(projectsApi.getAll(), teamApi.getAll())
  }
  const [, pr, mr] = await Promise.allSettled(promises)
  if (pr?.status === 'fulfilled') projects.value = pr.value.data.data
  if (mr?.status === 'fulfilled') members.value = mr.value.data.data
})
</script>
