<template>
  <div>
    <div class="ui-toolbar">
      <div class="ui-toolbar-left">
        <select v-model="filters.isActive" class="ui-select w-44" @change="applyFilter">
          <option value="">Все участники</option>
          <option value="true">Активные</option>
          <option value="false">Деактивированные</option>
        </select>
      </div>
      <button class="ui-button ui-button-primary" type="button" @click="openCreate">
        <Plus class="size-4" /> Добавить участника
      </button>
    </div>

    <div class="ui-table-wrap">
      <div class="ui-table-scroll">
        <table class="ui-table">
          <thead>
            <tr>
              <th>Имя</th>
              <th>Email</th>
              <th>Роль</th>
              <th>Должность</th>
              <th>Telegram</th>
              <th>Активен</th>
              <th class="text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filtered" :key="row.id" :class="!row.isActive ? 'opacity-50' : ''">
              <td class="font-medium text-slate-100">{{ row.name }}</td>
              <td>{{ row.email }}</td>
              <td>
                <span class="inline-flex rounded-full px-2 py-1 text-xs font-semibold ring-1" :class="roleClass(row.role)">
                  {{ roleLabel(row.role) }}
                </span>
              </td>
              <td>{{ row.position || '—' }}</td>
              <td>{{ row.telegram || '—' }}</td>
              <td>
                <span class="inline-flex rounded-full px-2 py-1 text-xs font-semibold ring-1" :class="row.isActive ? 'bg-teal-400/10 text-teal-300 ring-teal-400/20' : 'bg-slate-400/10 text-slate-400 ring-slate-400/20'">
                  {{ row.isActive ? 'Да' : 'Нет' }}
                </span>
              </td>
              <td>
                <div class="flex justify-end gap-1">
                  <button class="ui-button ui-button-ghost px-2" type="button" title="Редактировать" @click="openEdit(row)">
                    <Pencil class="size-4" />
                  </button>
                  <button v-if="row.isActive" class="ui-button ui-button-danger px-2" type="button" title="Деактивировать" @click="deactivate(row.id)">
                    <UserX class="size-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="!filtered.length && !loading" class="ui-empty m-5">Участники не найдены</div>
    </div>

    <div v-if="dialogVisible" class="ui-modal-backdrop" @click.self="dialogVisible = false">
      <section class="ui-modal max-w-xl">
        <header class="ui-modal-header">
          <h2 class="ui-modal-title">{{ editingId ? 'Редактировать участника' : 'Новый участник' }}</h2>
          <button class="ui-button ui-button-ghost px-2" type="button" @click="dialogVisible = false">
            <X class="size-4" />
          </button>
        </header>
        <div class="ui-modal-body">
          <div class="grid gap-4 sm:grid-cols-2">
            <label><span class="ui-label">Имя *</span><input v-model="form.name" class="ui-input" /></label>
            <label><span class="ui-label">Email *</span><input v-model="form.email" class="ui-input" type="email" /></label>
            <label v-if="!editingId" class="sm:col-span-2">
              <span class="ui-label">Пароль *</span>
              <input v-model="form.password" class="ui-input" type="password" autocomplete="new-password" />
            </label>
            <label>
              <span class="ui-label">Роль *</span>
              <select v-model="form.role" class="ui-select">
                <option v-for="[val, lbl] in ROLE_OPTIONS" :key="val" :value="val">{{ lbl }}</option>
              </select>
            </label>
            <label><span class="ui-label">Должность</span><input v-model="form.position" class="ui-input" placeholder="Разработчик, менеджер..." /></label>
            <label><span class="ui-label">Telegram</span><input v-model="form.telegram" class="ui-input" placeholder="@username" /></label>
            <label class="flex items-end gap-2 pb-2 text-sm text-slate-300">
              <input v-model="form.isActive" type="checkbox" /> Активен
            </label>
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
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { Pencil, Plus, UserX, X } from 'lucide-vue-next'
import { teamApi } from '@/api/team'
import { confirmAction, notify } from '@/utils/notify'

const ROLE_OPTIONS = [
  ['OWNER', 'Владелец'],
  ['ADMIN', 'Администратор'],
  ['MANAGER', 'Менеджер'],
  ['MEMBER', 'Участник'],
  ['VIEWER', 'Наблюдатель'],
]
const ROLE_MAP = Object.fromEntries(ROLE_OPTIONS)
const roleLabel = (r) => ROLE_MAP[r] || r

const ROLE_CLASSES = {
  OWNER: 'bg-sky-400/10 text-sky-300 ring-sky-400/20',
  ADMIN: 'bg-violet-400/10 text-violet-300 ring-violet-400/20',
  MANAGER: 'bg-amber-400/10 text-amber-300 ring-amber-400/20',
  MEMBER: 'bg-teal-400/10 text-teal-300 ring-teal-400/20',
  VIEWER: 'bg-slate-400/10 text-slate-400 ring-slate-400/20',
}
const roleClass = (r) => ROLE_CLASSES[r] || ROLE_CLASSES.VIEWER

const members = ref([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const editingId = ref(null)
const filters = reactive({ isActive: 'true' })

const filtered = computed(() => {
  if (filters.isActive === '') return members.value
  const active = filters.isActive === 'true'
  return members.value.filter((m) => m.isActive === active)
})

const empty = () => ({ name: '', email: '', password: '', role: 'MEMBER', position: '', telegram: '', isActive: true })
const form = ref(empty())

const load = async () => {
  loading.value = true
  try {
    const res = await teamApi.getAll()
    members.value = res.data.data
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  editingId.value = null
  form.value = empty()
  dialogVisible.value = true
}

const openEdit = (row) => {
  editingId.value = row.id
  form.value = { ...empty(), ...row, password: '' }
  dialogVisible.value = true
}

const save = async () => {
  if (!form.value.name.trim()) return notify.error('Укажите имя')
  if (!form.value.email.trim()) return notify.error('Укажите email')
  if (!editingId.value && !form.value.password) return notify.error('Укажите пароль')
  saving.value = true
  try {
    if (editingId.value) {
      const { password, ...data } = form.value
      await teamApi.update(editingId.value, data)
      notify.success('Участник обновлён')
    } else {
      await teamApi.create(form.value)
      notify.success('Участник добавлен')
    }
    dialogVisible.value = false
    load()
  } catch (err) {
    notify.error(err.response?.data?.error || 'Ошибка')
  } finally {
    saving.value = false
  }
}

const deactivate = async (id) => {
  if (!await confirmAction('Деактивировать участника? Он не сможет войти в систему.')) return
  try {
    await teamApi.deactivate(id)
    notify.success('Участник деактивирован')
    load()
  } catch (err) {
    notify.error(err.response?.data?.error || 'Ошибка')
  }
}

onMounted(load)
</script>
