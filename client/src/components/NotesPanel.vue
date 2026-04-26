<template>
  <section class="ui-card">
    <div class="ui-card-header flex items-center justify-between gap-3">
      <span>{{ title }} <span class="ml-2 text-xs text-slate-500">{{ notes.length }}</span></span>
      <button class="ui-button ui-button-primary py-1.5 text-xs" type="button" @click="openCreate">
        <Plus class="size-4" /> Добавить заметку
      </button>
    </div>

    <div v-if="showFilters" class="border-b border-slate-800 p-4">
      <div class="flex flex-wrap gap-3">
        <div class="relative min-w-64 flex-1">
          <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <input v-model="filters.q" class="ui-input pl-9" placeholder="Поиск по заметкам..." @input="load" />
        </div>
        <select v-if="!fixedClientId" v-model="filters.clientId" class="ui-select w-52" @change="load">
          <option value="">Все клиенты</option>
          <option v-for="client in clients" :key="client.id" :value="client.id">{{ client.name }}</option>
        </select>
        <select v-if="!fixedProjectId" v-model="filters.projectId" class="ui-select w-52" @change="load">
          <option value="">Все проекты</option>
          <option v-for="project in projects" :key="project.id" :value="project.id">{{ project.name }}</option>
        </select>
        <select v-model="filters.isPinned" class="ui-select w-40" @change="load">
          <option value="">Все</option>
          <option value="true">Закрепленные</option>
        </select>
        <select v-model="filters.isArchived" class="ui-select w-40" @change="load">
          <option value="false">Активные</option>
          <option value="true">Архив</option>
          <option value="">Все</option>
        </select>
      </div>
    </div>

    <div class="p-5">
      <div v-if="notes.length" class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <article v-for="note in notes" :key="note.id" class="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
          <div class="flex items-start justify-between gap-3">
            <h3 class="line-clamp-2 font-semibold text-slate-100">{{ note.title }}</h3>
            <div class="flex flex-none items-center gap-1">
              <Pin v-if="note.isPinned" class="size-4 text-blue-300" />
              <Archive v-if="note.isArchived" class="size-4 text-slate-500" />
            </div>
          </div>
          <p class="mt-3 line-clamp-4 whitespace-pre-line text-sm leading-6 text-slate-400">{{ note.content || '—' }}</p>

          <div class="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
            <span v-if="note.client" class="rounded-full bg-slate-800 px-2 py-1">{{ note.client.name }}</span>
            <span v-if="note.project" class="rounded-full bg-slate-800 px-2 py-1">{{ note.project.name }}</span>
            <span class="rounded-full bg-slate-800 px-2 py-1">{{ note.createdBy?.name || '—' }}</span>
            <span class="rounded-full bg-slate-800 px-2 py-1">{{ fmtDate(note.updatedAt) }}</span>
          </div>

          <div class="mt-4 flex flex-wrap justify-end gap-1">
            <button class="ui-button ui-button-ghost px-2 py-1.5" type="button" @click="openEdit(note)">
              <Pencil class="size-4" />
            </button>
            <button class="ui-button ui-button-ghost px-2 py-1.5" type="button" @click="togglePin(note)">
              {{ note.isPinned ? 'Открепить' : 'Закрепить' }}
            </button>
            <button class="ui-button ui-button-ghost px-2 py-1.5" type="button" @click="toggleArchive(note)">
              {{ note.isArchived ? 'Вернуть' : 'В архив' }}
            </button>
            <button class="ui-button ui-button-danger px-2 py-1.5" type="button" @click="remove(note.id)">
              <Trash2 class="size-4" />
            </button>
          </div>
        </article>
      </div>
      <div v-else-if="!loading" class="ui-empty">Заметок пока нет</div>
      <div v-else class="py-8 text-center text-sm text-slate-500">Загрузка...</div>
    </div>

    <div v-if="dialogVisible" class="ui-modal-backdrop" @click.self="dialogVisible = false">
      <section class="ui-modal max-w-2xl">
        <header class="ui-modal-header">
          <h2 class="ui-modal-title">{{ editingId ? 'Редактировать заметку' : 'Новая заметка' }}</h2>
          <button class="ui-button ui-button-ghost px-2" type="button" @click="dialogVisible = false"><X class="size-4" /></button>
        </header>
        <div class="ui-modal-body space-y-4">
          <label><span class="ui-label">Название *</span><input v-model="form.title" class="ui-input" /></label>
          <label><span class="ui-label">Текст</span><textarea v-model="form.content" class="ui-textarea min-h-40" /></label>
          <div class="grid gap-4 sm:grid-cols-2">
            <label v-if="!fixedClientId">
              <span class="ui-label">Клиент</span>
              <select v-model="form.clientId" class="ui-select">
                <option value="">Без клиента</option>
                <option v-for="client in clients" :key="client.id" :value="client.id">{{ client.name }}</option>
              </select>
            </label>
            <label v-if="!fixedProjectId">
              <span class="ui-label">Проект</span>
              <select v-model="form.projectId" class="ui-select">
                <option value="">Без проекта</option>
                <option v-for="project in projects" :key="project.id" :value="project.id">{{ project.name }}</option>
              </select>
            </label>
          </div>
          <div class="flex flex-wrap gap-4 text-sm text-slate-300">
            <label class="flex items-center gap-2"><input v-model="form.isPinned" type="checkbox" /> Закрепить</label>
            <label class="flex items-center gap-2"><input v-model="form.isArchived" type="checkbox" /> В архиве</label>
          </div>
        </div>
        <footer class="ui-modal-footer">
          <button class="ui-button" type="button" @click="dialogVisible = false">Отмена</button>
          <button class="ui-button ui-button-primary" type="button" :disabled="saving" @click="save">
            {{ saving ? 'Сохраняем...' : 'Сохранить' }}
          </button>
        </footer>
      </section>
    </div>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { Archive, Pencil, Pin, Plus, Search, Trash2, X } from 'lucide-vue-next'
import { notesApi } from '@/api/notes'
import { clientsApi } from '@/api/clients'
import { projectsApi } from '@/api/projects'
import { confirmAction, notify } from '@/utils/notify'

const props = defineProps({
  title: { type: String, default: 'Заметки' },
  fixedClientId: { type: String, default: '' },
  fixedProjectId: { type: String, default: '' },
  showFilters: { type: Boolean, default: true },
})

const notes = ref([])
const clients = ref([])
const projects = ref([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const editingId = ref(null)
const filters = reactive({ q: '', clientId: '', projectId: '', isPinned: '', isArchived: 'false' })

const empty = () => ({
  title: '',
  content: '',
  clientId: props.fixedClientId || '',
  projectId: props.fixedProjectId || '',
  isPinned: false,
  isArchived: false,
})
const form = ref(empty())

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU') : '—'

const params = () => ({
  q: filters.q || undefined,
  clientId: props.fixedClientId || filters.clientId || undefined,
  projectId: props.fixedProjectId || filters.projectId || undefined,
  isPinned: filters.isPinned || undefined,
  isArchived: filters.isArchived || undefined,
})

const load = async () => {
  loading.value = true
  try {
    notes.value = (await notesApi.getAll(params())).data.data
  } finally {
    loading.value = false
  }
}

const loadLookups = async () => {
  const [clientsResult, projectsResult] = await Promise.allSettled([
    clientsApi.getAll({ status: 'ACTIVE' }),
    projectsApi.getAll({ status: 'ACTIVE' }),
  ])
  if (clientsResult.status === 'fulfilled') clients.value = clientsResult.value.data.data
  if (projectsResult.status === 'fulfilled') projects.value = projectsResult.value.data.data
}

const openCreate = () => { editingId.value = null; form.value = empty(); dialogVisible.value = true }
const openEdit = (note) => {
  editingId.value = note.id
  form.value = {
    title: note.title,
    content: note.content || '',
    clientId: note.clientId || props.fixedClientId || '',
    projectId: note.projectId || props.fixedProjectId || '',
    isPinned: note.isPinned,
    isArchived: note.isArchived,
  }
  dialogVisible.value = true
}

const save = async () => {
  if (!form.value.title.trim()) return notify.error('Укажите название заметки')
  saving.value = true
  try {
    const payload = {
      ...form.value,
      clientId: form.value.clientId || null,
      projectId: form.value.projectId || null,
    }
    if (editingId.value) {
      await notesApi.update(editingId.value, payload)
      notify.success('Заметка обновлена')
    } else {
      await notesApi.create(payload)
      notify.success('Заметка добавлена')
    }
    dialogVisible.value = false
    load()
  } catch (err) {
    notify.error(err.response?.data?.error || 'Ошибка')
  } finally {
    saving.value = false
  }
}

const togglePin = async (note) => {
  try {
    note.isPinned ? await notesApi.unpin(note.id) : await notesApi.pin(note.id)
    load()
  } catch (err) { notify.error(err.response?.data?.error || 'Ошибка') }
}

const toggleArchive = async (note) => {
  try {
    note.isArchived ? await notesApi.unarchive(note.id) : await notesApi.archive(note.id)
    load()
  } catch (err) { notify.error(err.response?.data?.error || 'Ошибка') }
}

const remove = async (id) => {
  if (!await confirmAction('Удалить заметку?')) return
  try {
    await notesApi.remove(id)
    notify.success('Заметка удалена')
    load()
  } catch (err) { notify.error(err.response?.data?.error || 'Ошибка') }
}

watch(() => [props.fixedClientId, props.fixedProjectId], load)

onMounted(async () => {
  await Promise.all([load(), loadLookups()])
})
</script>
