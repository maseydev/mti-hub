<template>
  <div>
    <div class="ui-toolbar">
      <div class="ui-toolbar-left">
        <select v-model="filters.status" class="ui-select w-44" @change="load">
          <option value="NOT_ARCHIVED">Без архива</option>
          <option value="">Все статусы</option>
          <option value="ACTIVE">Активен</option>
          <option value="PAUSED">Приостановлен</option>
          <option value="ARCHIVED">Архив</option>
        </select>
        <input v-model="filters.search" class="ui-input w-64" placeholder="Поиск..." @input="load" />
      </div>
      <button class="ui-button ui-button-primary" type="button" @click="openCreate">
        <Plus class="size-4" /> Добавить клиента
      </button>
    </div>

    <div class="ui-table-wrap">
      <div class="ui-table-scroll">
        <table class="ui-table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Контакт</th>
              <th>Email</th>
              <th>Телефон</th>
              <th>Проекты</th>
              <th>Статус</th>
              <th class="text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in clients" :key="row.id">
              <td><router-link :to="`/clients/${row.id}`" class="font-medium">{{ row.name }}</router-link></td>
              <td>{{ row.contactName || '—' }}</td>
              <td>{{ row.email || '—' }}</td>
              <td>{{ row.phone || '—' }}</td>
              <td>{{ row._count?.projects ?? 0 }}</td>
              <td><StatusBadge :status="row.status" domain="client" /></td>
              <td>
                <div class="flex justify-end gap-1">
                  <button class="ui-button ui-button-ghost px-2" type="button" title="Редактировать" @click="openEdit(row)">
                    <Pencil class="size-4" />
                  </button>
                  <button class="ui-button ui-button-danger px-2" type="button" title="Архивировать" @click="remove(row.id)">
                    <Trash2 class="size-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="!clients.length && !loading" class="ui-empty m-5">Клиенты не найдены</div>
    </div>

    <div v-if="dialogVisible" class="ui-modal-backdrop" @click.self="dialogVisible = false">
      <section class="ui-modal">
        <header class="ui-modal-header">
          <h2 class="ui-modal-title">{{ editingId ? 'Редактировать клиента' : 'Новый клиент' }}</h2>
          <button class="ui-button ui-button-ghost px-2" type="button" @click="dialogVisible = false">
            <X class="size-4" />
          </button>
        </header>
        <div class="ui-modal-body">
          <div class="grid gap-4 sm:grid-cols-2">
            <label><span class="ui-label">Название *</span><input v-model="form.name" class="ui-input" required /></label>
            <label><span class="ui-label">Контактное лицо</span><input v-model="form.contactName" class="ui-input" /></label>
            <label><span class="ui-label">Email</span><input v-model="form.email" class="ui-input" type="email" /></label>
            <label><span class="ui-label">Телефон</span><input v-model="form.phone" class="ui-input" /></label>
            <label><span class="ui-label">Telegram</span><input v-model="form.telegram" class="ui-input" placeholder="@username" /></label>
            <label><span class="ui-label">Компания</span><input v-model="form.companyName" class="ui-input" /></label>
            <label><span class="ui-label">ИНН</span><input v-model="form.taxId" class="ui-input" /></label>
            <label>
              <span class="ui-label">Статус</span>
              <select v-model="form.status" class="ui-select">
                <option value="ACTIVE">Активен</option>
                <option value="PAUSED">Приостановлен</option>
                <option value="ARCHIVED">Архив</option>
              </select>
            </label>
            <label class="sm:col-span-2"><span class="ui-label">Заметки</span><textarea v-model="form.notes" class="ui-textarea" /></label>
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
import { onMounted, reactive, ref } from 'vue'
import { Pencil, Plus, Trash2, X } from 'lucide-vue-next'
import { clientsApi } from '@/api/clients'
import StatusBadge from '@/components/StatusBadge.vue'
import { confirmAction, notify } from '@/utils/notify'

const clients = ref([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const editingId = ref(null)
const filters = reactive({ status: 'NOT_ARCHIVED', search: '' })

const emptyForm = () => ({ name: '', contactName: '', email: '', phone: '', telegram: '', companyName: '', taxId: '', notes: '', status: 'ACTIVE' })
const form = ref(emptyForm())

const load = async () => {
  loading.value = true
  try {
    const res = await clientsApi.getAll({ status: filters.status || undefined, search: filters.search || undefined })
    clients.value = res.data.data
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  editingId.value = null
  form.value = emptyForm()
  dialogVisible.value = true
}

const openEdit = (row) => {
  editingId.value = row.id
  form.value = { ...emptyForm(), ...row }
  dialogVisible.value = true
}

const save = async () => {
  if (!form.value.name.trim()) return notify.error('Укажите название клиента')
  saving.value = true
  try {
    if (editingId.value) {
      await clientsApi.update(editingId.value, form.value)
      notify.success('Клиент обновлён')
    } else {
      await clientsApi.create(form.value)
      notify.success('Клиент добавлен')
    }
    dialogVisible.value = false
    load()
  } catch (err) {
    notify.error(err.response?.data?.error || 'Ошибка')
  } finally {
    saving.value = false
  }
}

const remove = async (id) => {
  if (!await confirmAction('Архивировать клиента?')) return
  await clientsApi.remove(id)
  notify.success('Клиент архивирован')
  load()
}

onMounted(load)
</script>
