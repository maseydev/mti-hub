<template>
  <div v-if="visible" class="ui-modal-backdrop">
    <section class="ui-modal max-w-2xl">
      <header class="ui-modal-header">
        <h2 class="ui-modal-title">{{ task ? 'Редактировать задачу' : 'Новая задача' }}</h2>
        <button class="ui-button ui-button-ghost px-2" type="button" @click="$emit('close')">
          <X class="size-4" />
        </button>
      </header>
      <div class="ui-modal-body">
        <div class="grid gap-4 sm:grid-cols-2">
          <label v-if="!fixedProjectId" class="sm:col-span-2">
            <span class="ui-label">Проект *</span>
            <select v-model="form.projectId" class="ui-select">
              <option value="">Выберите проект</option>
              <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </label>

          <label class="sm:col-span-2">
            <span class="ui-label">Название *</span>
            <input v-model="form.title" class="ui-input" />
          </label>

          <label class="sm:col-span-2">
            <span class="ui-label">Описание</span>
            <textarea v-model="form.description" class="ui-textarea" rows="3" />
          </label>

          <label>
            <span class="ui-label">Статус</span>
            <select v-model="form.status" class="ui-select">
              <option v-for="[val, lbl] in STATUS_OPTIONS" :key="val" :value="val">{{ lbl }}</option>
            </select>
          </label>

          <label>
            <span class="ui-label">Приоритет</span>
            <select v-model="form.priority" class="ui-select">
              <option v-for="[val, lbl] in PRIORITY_OPTIONS" :key="val" :value="val">{{ lbl }}</option>
            </select>
          </label>

          <label class="sm:col-span-2">
            <span class="ui-label">Исполнитель</span>
            <select v-model="form.assigneeId" class="ui-select">
              <option :value="null">Не назначен</option>
              <option v-for="m in members" :key="m.id" :value="m.id">{{ m.name }}</option>
            </select>
          </label>

          <label>
            <span class="ui-label">Плановое начало</span>
            <AppDatePicker v-model="form.plannedStart" />
          </label>

          <label>
            <span class="ui-label">Плановое завершение</span>
            <AppDatePicker v-model="form.plannedEnd" />
          </label>

          <label>
            <span class="ui-label">Дедлайн</span>
            <AppDatePicker v-model="form.dueDate" />
          </label>
        </div>
      </div>
      <footer class="ui-modal-footer">
        <button class="ui-button" type="button" @click="$emit('close')">Отмена</button>
        <button class="ui-button ui-button-primary" type="button" :disabled="saving" @click="save">
          {{ saving ? 'Сохраняем...' : 'Сохранить' }}
        </button>
      </footer>
    </section>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { tasksApi } from '@/api/tasks'
import { notify } from '@/utils/notify'
import AppDatePicker from '@/components/AppDatePicker.vue'

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

const props = defineProps({
  visible: { type: Boolean, default: false },
  task: { type: Object, default: null },
  fixedProjectId: { type: String, default: null },
  projects: { type: Array, default: () => [] },
  members: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'saved'])

const saving = ref(false)

const toDateInput = (d) => d ? new Date(d).toISOString().slice(0, 10) : ''

const empty = () => ({
  projectId: props.fixedProjectId || '',
  title: '',
  description: '',
  status: 'TODO',
  priority: 'MEDIUM',
  assigneeId: null,
  plannedStart: '',
  plannedEnd: '',
  dueDate: '',
})

const form = ref(empty())

watch(
  () => [props.visible, props.task],
  () => {
    if (!props.visible) return
    if (props.task) {
      form.value = {
        projectId: props.task.projectId || props.fixedProjectId || '',
        title: props.task.title || '',
        description: props.task.description || '',
        status: props.task.status || 'TODO',
        priority: props.task.priority || 'MEDIUM',
        assigneeId: props.task.assigneeId || null,
        plannedStart: toDateInput(props.task.plannedStart),
        plannedEnd: toDateInput(props.task.plannedEnd),
        dueDate: toDateInput(props.task.dueDate),
      }
    } else {
      form.value = empty()
    }
  },
  { immediate: true }
)

const save = async () => {
  const projectId = props.fixedProjectId || form.value.projectId
  if (!projectId) return notify.error('Выберите проект')
  if (!form.value.title.trim()) return notify.error('Укажите название задачи')

  saving.value = true
  try {
    const payload = { ...form.value, projectId }
    let result
    if (props.task) {
      result = await tasksApi.update(props.task.id, payload)
    } else {
      result = await tasksApi.create(payload)
    }
    notify.success(props.task ? 'Задача обновлена' : 'Задача добавлена')
    emit('saved', result.data.data)
    emit('close')
  } catch (err) {
    notify.error(err.response?.data?.error || 'Ошибка')
  } finally {
    saving.value = false
  }
}
</script>
