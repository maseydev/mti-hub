<template>
  <div>
    <div class="mb-4 flex justify-end">
      <button class="ui-button ui-button-primary" type="button" @click="openCreate"><Plus class="size-4" /> Добавить кошелёк</button>
    </div>

    <div class="ui-table-wrap">
      <div class="ui-table-scroll">
        <table class="ui-table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Тип</th>
              <th>Валюта</th>
              <th>Нач. баланс</th>
              <th>Текущий баланс</th>
              <th>Активен</th>
              <th class="text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in accounts" :key="row.id">
              <td class="font-medium text-slate-100">{{ row.name }}</td>
              <td>{{ typeLabel(row.type) }}</td>
              <td>{{ row.currency }}</td>
              <td>{{ fmt(row.openingBalance) }}</td>
              <td class="ui-number" :class="row.balance >= 0 ? 'font-semibold metric-positive' : 'font-semibold metric-negative'">{{ fmt(row.balance) }}</td>
              <td><span class="inline-flex rounded-full px-2 py-1 text-xs font-semibold ring-1" :class="row.isActive ? 'bg-teal-400/10 text-teal-300 ring-teal-400/20' : 'bg-slate-400/10 text-slate-300 ring-slate-400/20'">{{ row.isActive ? 'Да' : 'Нет' }}</span></td>
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
      <div v-if="!accounts.length && !loading" class="ui-empty m-5">Кошельки не найдены</div>
    </div>

    <div v-if="dialogVisible" class="ui-modal-backdrop" @click.self="dialogVisible = false">
      <section class="ui-modal max-w-lg">
        <header class="ui-modal-header">
          <h2 class="ui-modal-title">{{ editingId ? 'Редактировать кошелёк' : 'Новый кошелёк' }}</h2>
          <button class="ui-button ui-button-ghost px-2" type="button" @click="dialogVisible = false"><X class="size-4" /></button>
        </header>
        <div class="ui-modal-body grid gap-4 sm:grid-cols-2">
          <label class="sm:col-span-2"><span class="ui-label">Название *</span><input v-model="form.name" class="ui-input" /></label>
          <label>
            <span class="ui-label">Тип *</span>
            <select v-model="form.type" class="ui-select">
              <option v-for="[v,l] in TYPE_OPTIONS" :key="v" :value="v">{{ l }}</option>
            </select>
          </label>
          <label><span class="ui-label">Валюта</span><input v-model="form.currency" class="ui-input" maxlength="3" /></label>
          <label><span class="ui-label">Начальный баланс</span><input v-model.number="form.openingBalance" class="ui-input" step="0.01" type="number" /></label>
          <label class="flex items-end gap-2 pb-2 text-sm text-slate-300"><input v-model="form.isActive" type="checkbox" /> Активен</label>
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
import { onMounted, ref } from 'vue'
import { Pencil, Plus, Trash2, X } from 'lucide-vue-next'
import { accountsApi } from '@/api/accounts'
import { confirmAction, notify } from '@/utils/notify'

const TYPE_OPTIONS = [['CASH','Наличные'],['BANK','Банк'],['CARD','Карта'],['CRYPTO','Крипто'],['OTHER','Прочее']]
const TYPE_MAP = Object.fromEntries(TYPE_OPTIONS)
const typeLabel = (t) => TYPE_MAP[t] || t

const accounts = ref([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const editingId = ref(null)

const empty = () => ({ name: '', type: 'BANK', currency: 'RUB', openingBalance: 0, isActive: true })
const form = ref(empty())
const fmt = (v) => Number(v || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₽'

const load = async () => {
  loading.value = true
  try { accounts.value = (await accountsApi.getAll()).data.data }
  finally { loading.value = false }
}

const openCreate = () => { editingId.value = null; form.value = empty(); dialogVisible.value = true }
const openEdit = (row) => { editingId.value = row.id; form.value = { ...empty(), ...row }; dialogVisible.value = true }

const save = async () => {
  if (!form.value.name.trim()) return notify.error('Укажите название кошелька')
  saving.value = true
  try {
    editingId.value ? await accountsApi.update(editingId.value, form.value) : await accountsApi.create(form.value)
    notify.success(editingId.value ? 'Кошелёк обновлён' : 'Кошелёк добавлен')
    dialogVisible.value = false
    load()
  } catch (err) { notify.error(err.response?.data?.error || 'Ошибка') }
  finally { saving.value = false }
}

const remove = async (id) => {
  if (!await confirmAction('Удалить кошелёк?')) return
  try { await accountsApi.remove(id); notify.success('Удалено'); load() }
  catch (err) { notify.error(err.response?.data?.error || 'Ошибка') }
}

onMounted(load)
</script>
