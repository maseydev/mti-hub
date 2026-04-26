<template>
  <div class="space-y-5">
    <button class="ui-button ui-button-ghost" type="button" @click="$router.push('/projects')">
      <ArrowLeft class="size-4" /> Проекты
    </button>

    <div v-if="project" class="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside class="ui-card self-start">
        <div class="ui-card-header">{{ project.name }}</div>
        <dl class="divide-y divide-slate-800 px-5 text-sm">
          <div class="grid grid-cols-3 gap-3 py-3">
            <dt class="text-slate-500">Клиент</dt>
            <dd class="col-span-2">
              <router-link v-if="project.client" :to="`/clients/${project.client.id}`" class="text-slate-200 hover:text-sky-300">
                {{ project.client.name }}
              </router-link>
              <span v-else class="text-slate-400">—</span>
            </dd>
          </div>
          <div class="grid grid-cols-3 gap-3 py-3">
            <dt class="text-slate-500">Статус</dt>
            <dd class="col-span-2"><StatusBadge :status="project.status" domain="project" /></dd>
          </div>
          <div v-if="project.productionUrl" class="grid grid-cols-3 gap-3 py-3">
            <dt class="text-slate-500">Сайт</dt>
            <dd class="col-span-2 truncate">
              <a :href="project.productionUrl" target="_blank" class="text-sky-400 hover:underline text-xs">{{ project.productionUrl }}</a>
            </dd>
          </div>
          <div v-if="project.repositoryUrl" class="grid grid-cols-3 gap-3 py-3">
            <dt class="text-slate-500">Репо</dt>
            <dd class="col-span-2 truncate">
              <a :href="project.repositoryUrl" target="_blank" class="text-sky-400 hover:underline text-xs">{{ project.repositoryUrl }}</a>
            </dd>
          </div>
          <div v-if="project.startDate" class="grid grid-cols-3 gap-3 py-3">
            <dt class="text-slate-500">Начало</dt>
            <dd class="col-span-2 text-slate-200">{{ fmtDate(project.startDate) }}</dd>
          </div>
        </dl>
        <p v-if="project.description" class="border-t border-slate-800 px-5 py-4 text-sm text-slate-400">
          {{ project.description }}
        </p>
      </aside>

      <section class="space-y-5">
        <div class="ui-card">
          <div class="ui-card-header flex items-center justify-between">
            <span>Задачи <span class="ml-2 text-xs text-slate-500">{{ tasks.length }}</span></span>
            <button class="ui-button ui-button-primary py-1.5 text-xs" type="button" @click="openCreate">
              <Plus class="size-4" /> Добавить задачу
            </button>
          </div>

          <div class="mb-3 flex flex-wrap gap-2 px-5 pt-3">
            <select v-model="taskFilter" class="ui-select w-44" @change="loadTasks">
              <option value="">Все статусы</option>
              <option v-for="[val, lbl] in STATUS_OPTIONS" :key="val" :value="val">{{ lbl }}</option>
            </select>
          </div>

          <div class="ui-table-scroll">
            <table class="ui-table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Исполнитель</th>
                  <th>Статус</th>
                  <th>Приоритет</th>
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
                  <td class="max-w-xs truncate font-medium text-slate-100">{{ row.title }}</td>
                  <td>{{ row.assignee?.name || '—' }}</td>
                  <td><StatusBadge :status="row.status" domain="task" /></td>
                  <td><StatusBadge :status="row.priority" domain="priority" /></td>
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
                      <button class="ui-button ui-button-ghost px-2" type="button" @click="openEdit(row)">
                        <Pencil class="size-4" />
                      </button>
                      <button class="ui-button ui-button-danger px-2" type="button" @click="remove(row.id)">
                        <Trash2 class="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="!tasks.length && !loadingTasks" class="ui-empty m-5">Задач пока нет</div>
        </div>

        <NotesPanel
          v-if="project"
          title="Заметки проекта"
          :fixed-project-id="project.id"
          :show-filters="false"
        />
      </section>
    </div>

    <TaskFormModal
      :visible="dialogVisible"
      :task="editingTask"
      :fixed-project-id="project?.id"
      :members="members"
      @close="dialogVisible = false"
      @saved="onSaved"
    />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-vue-next'
import { projectsApi } from '@/api/projects'
import { tasksApi } from '@/api/tasks'
import { teamApi } from '@/api/team'
import StatusBadge from '@/components/StatusBadge.vue'
import NotesPanel from '@/components/NotesPanel.vue'
import TaskFormModal from '@/components/TaskFormModal.vue'
import { confirmAction, notify } from '@/utils/notify'

const STATUS_OPTIONS = [
  ['TODO', 'К выполнению'],
  ['IN_PROGRESS', 'В работе'],
  ['DONE', 'Готово'],
  ['CANCELLED', 'Отменено'],
]

const route = useRoute()
const project = ref(null)
const tasks = ref([])
const members = ref([])
const loadingTasks = ref(false)
const dialogVisible = ref(false)
const editingTask = ref(null)
const taskFilter = ref('')

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU') : '—'
const isOverdue = (row) => {
  if (!row.dueDate || ['DONE', 'CANCELLED'].includes(row.status)) return false
  return new Date(row.dueDate) < new Date()
}

const loadTasks = async () => {
  if (!project.value) return
  loadingTasks.value = true
  try {
    const p = { projectId: project.value.id, status: taskFilter.value || undefined }
    tasks.value = (await tasksApi.getAll(p)).data.data
  } finally {
    loadingTasks.value = false
  }
}

const openCreate = () => { editingTask.value = null; dialogVisible.value = true }
const openEdit = (row) => { editingTask.value = row; dialogVisible.value = true }
const onSaved = () => loadTasks()

const changeStatus = async (id, status) => {
  try {
    await tasksApi.updateStatus(id, status)
    loadTasks()
  } catch (err) {
    notify.error(err.response?.data?.error || 'Ошибка')
  }
}

const remove = async (id) => {
  if (!await confirmAction('Удалить задачу?')) return
  try {
    await tasksApi.remove(id)
    notify.success('Задача удалена')
    loadTasks()
  } catch (err) {
    notify.error(err.response?.data?.error || 'Ошибка')
  }
}

onMounted(async () => {
  const [pr, mr] = await Promise.all([
    projectsApi.getById(route.params.id),
    teamApi.getAll(),
  ])
  project.value = pr.data.data
  members.value = mr.data.data
  await loadTasks()
})
</script>
