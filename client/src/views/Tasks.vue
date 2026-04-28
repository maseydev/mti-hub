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
      <div class="flex flex-wrap items-center gap-2">
        <div class="inline-flex rounded-md border border-slate-700 bg-slate-950 p-1">
          <button
            class="rounded px-3 py-1.5 text-sm font-semibold"
            :class="viewMode === 'table' ? 'bg-blue-400 text-slate-950' : 'text-slate-400 hover:text-slate-100'"
            type="button"
            @click="viewMode = 'table'"
          >
            Таблица
          </button>
          <button
            class="rounded px-3 py-1.5 text-sm font-semibold"
            :class="viewMode === 'projects' ? 'bg-blue-400 text-slate-950' : 'text-slate-400 hover:text-slate-100'"
            type="button"
            @click="viewMode = 'projects'"
          >
            По проектам
          </button>
        </div>
        <button v-if="auth.isAdminOrManager" class="ui-button ui-button-primary" type="button" @click="openCreate">
          <Plus class="size-4" /> Добавить задачу
        </button>
      </div>
    </div>

    <div v-if="viewMode === 'table'" class="ui-table-wrap">
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

    <div v-else class="space-y-3">
      <section
        v-for="group in groupedProjects"
        :key="group.id"
        class="overflow-hidden rounded-lg border border-slate-800/80 bg-slate-900/70"
      >
        <div
          class="flex w-full items-center gap-4 px-4 py-3 text-left transition hover:bg-slate-800/35"
          @click="toggleProject(group.id)"
        >
          <ChevronRight v-if="isProjectCollapsed(group.id)" class="size-5 flex-none text-slate-500" />
          <ChevronDown v-else class="size-5 flex-none text-slate-500" />
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <router-link
                v-if="group.id !== 'no-project'"
                :to="`/projects/${group.id}`"
                class="truncate text-base font-semibold text-slate-100 hover:text-sky-300"
                @click.stop
              >
                {{ group.name }}
              </router-link>
              <span v-else class="truncate text-base font-semibold text-slate-100">{{ group.name }}</span>
              <span class="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-400">{{ group.tasks.length }} задач</span>
            </div>
            <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>{{ group.clientName }}</span>
              <span>TODO {{ group.counts.todo }}</span>
              <span>В работе {{ group.counts.inProgress }}</span>
              <span>Готово {{ group.counts.done }}</span>
              <span :class="group.counts.overdue ? 'font-semibold text-rose-300' : ''">Просрочено {{ group.counts.overdue }}</span>
              <span v-if="group.counts.unassigned">Без исполнителя {{ group.counts.unassigned }}</span>
            </div>
          </div>
          <div class="hidden w-36 flex-none sm:block">
            <div class="mb-1 flex justify-between text-xs text-slate-500">
              <span>Прогресс</span>
              <span>{{ group.progress }}%</span>
            </div>
            <div class="h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div class="h-full rounded-full bg-teal-300" :style="{ width: `${group.progress}%` }" />
            </div>
          </div>
        </div>

        <div v-if="!isProjectCollapsed(group.id)" class="border-t border-slate-800">
          <div
            v-for="row in group.tasks"
            :key="row.id"
            class="flex flex-col gap-3 border-b border-slate-800/80 px-4 py-3 last:border-b-0 hover:bg-slate-800/30 xl:flex-row xl:items-center xl:justify-between"
            :class="isOverdue(row) ? 'bg-red-950/15' : ''"
          >
            <div class="flex min-w-0 flex-1 gap-3">
              <span class="mt-1 h-9 w-1 flex-none rounded-full" :class="priorityAccent(row.priority)" />
              <div class="min-w-0">
                <div class="truncate font-medium text-slate-100">{{ row.title }}</div>
                <div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>{{ row.assignee?.name || 'Без исполнителя' }}</span>
                  <StatusBadge :status="row.status" domain="task" />
                  <StatusBadge :status="row.priority" domain="priority" />
                  <span>Старт {{ fmtDate(row.plannedStart) }}</span>
                  <span>Конец {{ fmtDate(row.plannedEnd) }}</span>
                  <span class="ui-number" :class="isOverdue(row) ? 'font-semibold text-rose-300' : 'text-slate-500'">Дедлайн {{ fmtDate(row.dueDate) }}</span>
                </div>
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-1 xl:flex-none">
              <select
                class="ui-select w-32 py-1 text-xs"
                :value="row.status"
                @change="changeStatus(row.id, $event.target.value)"
              >
                <option v-for="[val, lbl] in STATUS_OPTIONS" :key="val" :value="val">{{ lbl }}</option>
              </select>
              <button v-if="auth.isAdminOrManager" class="ui-button ui-button-ghost px-2 py-1" type="button" @click="openEdit(row)">
                <Pencil class="size-4" />
              </button>
              <button v-if="auth.isAdminOrManager" class="ui-button ui-button-danger px-2 py-1" type="button" @click="remove(row.id)">
                <Trash2 class="size-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
      <div v-if="!groupedProjects.length && !loading" class="ui-empty">Задачи не найдены</div>
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-vue-next'
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
const TASKS_COLLAPSED_KEY = 'tasksCollapsedProjects:v2'
const viewMode = ref(localStorage.getItem('tasksViewMode') || 'table')
const collapsedProjects = reactive(JSON.parse(localStorage.getItem(TASKS_COLLAPSED_KEY) || '{}'))

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU') : '—'
const isOverdue = (row) => {
  if (!row.dueDate || ['DONE', 'CANCELLED'].includes(row.status)) return false
  return new Date(row.dueDate) < new Date()
}
const priorityAccent = (priority) => ({
  HIGH: 'bg-rose-400',
  MEDIUM: 'bg-blue-400',
  LOW: 'bg-slate-500',
}[priority] || 'bg-slate-500')

const statusRank = (status) => ({
  IN_PROGRESS: 0,
  TODO: 1,
  DONE: 3,
  CANCELLED: 4,
}[status] ?? 2)

const sortedTasks = (rows) => [...rows].sort((a, b) => {
  const overdueDiff = Number(isOverdue(b)) - Number(isOverdue(a))
  if (overdueDiff) return overdueDiff
  const statusDiff = statusRank(a.status) - statusRank(b.status)
  if (statusDiff) return statusDiff
  const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER
  const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER
  return aDue - bDue
})

const groupedProjects = computed(() => {
  const map = new Map()
  for (const task of tasks.value) {
    const id = task.project?.id || task.projectId || 'no-project'
    if (!map.has(id)) {
      map.set(id, {
        id,
        name: task.project?.name || 'Без проекта',
        clientName: task.project?.client?.name || 'Клиент не указан',
        tasks: [],
      })
    }
    map.get(id).tasks.push(task)
  }

  return [...map.values()].map((group) => {
    const done = group.tasks.filter(t => t.status === 'DONE').length
    const activeTotal = group.tasks.filter(t => t.status !== 'CANCELLED').length || group.tasks.length || 1
    const counts = {
      todo: group.tasks.filter(t => t.status === 'TODO').length,
      inProgress: group.tasks.filter(t => t.status === 'IN_PROGRESS').length,
      done,
      overdue: group.tasks.filter(isOverdue).length,
      unassigned: group.tasks.filter(t => !t.assigneeId).length,
    }
    return {
      ...group,
      tasks: sortedTasks(group.tasks),
      counts,
      progress: Math.round((done / activeTotal) * 100),
    }
  }).sort((a, b) => {
    if (b.counts.overdue !== a.counts.overdue) return b.counts.overdue - a.counts.overdue
    if (b.counts.inProgress !== a.counts.inProgress) return b.counts.inProgress - a.counts.inProgress
    return a.name.localeCompare(b.name, 'ru')
  })
})

const isProjectCollapsed = (id) => collapsedProjects[id] ?? true
const toggleProject = (id) => { collapsedProjects[id] = !isProjectCollapsed(id) }

watch(viewMode, (value) => localStorage.setItem('tasksViewMode', value))
watch(collapsedProjects, (value) => localStorage.setItem(TASKS_COLLAPSED_KEY, JSON.stringify(value)), { deep: true })

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
    promises.push(projectsApi.getAll({ status: 'ACTIVE' }), teamApi.getAll())
  }
  const [, pr, mr] = await Promise.allSettled(promises)
  if (pr?.status === 'fulfilled') projects.value = pr.value.data.data
  if (mr?.status === 'fulfilled') members.value = mr.value.data.data
})
</script>
