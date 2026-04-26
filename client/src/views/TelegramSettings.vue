<template>
  <section class="ui-card max-w-2xl">
    <div class="ui-card-header">Настройки Telegram-напоминаний</div>
    <div class="ui-card-body space-y-6">
      <div class="rounded-lg border border-blue-400/20 bg-blue-400/10 p-4 text-sm leading-6 text-blue-100">
        Токен бота задаётся через переменную окружения <code class="rounded bg-slate-950 px-1.5 py-0.5">TELEGRAM_BOT_TOKEN</code> в .env.
        Здесь настраивается только chat_id и расписание.
      </div>

      <label class="flex items-center gap-3 text-sm text-slate-300">
        <input v-model="form.isEnabled" type="checkbox" />
        Включить напоминания
      </label>

      <label class="block">
        <span class="ui-label">Chat ID</span>
        <input v-model="form.chatId" class="ui-input max-w-xs" placeholder="-100123456789" />
        <span class="mt-2 block text-xs leading-5 text-slate-500">
          Узнать chat_id: отправьте боту <code>/start</code>, затем откройте
          <code>https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</code>
        </span>
      </label>

      <div>
        <div class="ui-label">За сколько дней до оплаты отправлять напоминание</div>
        <div class="grid gap-2 sm:grid-cols-2">
          <label v-for="option in dayOptions" :key="option.value" class="flex items-center gap-2 text-sm text-slate-300">
            <input v-model="form.reminderDaysBefore" :value="option.value" type="checkbox" />
            {{ option.label }}
          </label>
        </div>
      </div>

      <label class="flex items-center gap-3 text-sm text-slate-300">
        <input v-model="form.overdueReminderEnabled" type="checkbox" />
        Напоминания о просрочках
      </label>

      <div class="flex flex-wrap gap-3">
        <button class="ui-button ui-button-primary" type="button" :disabled="saving" @click="save">
          {{ saving ? 'Сохраняем...' : 'Сохранить настройки' }}
        </button>
        <button class="ui-button" type="button" :disabled="testing" @click="test">
          {{ testing ? 'Отправляем...' : 'Тест Telegram' }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { telegramApi } from '@/api/telegram'
import { notify } from '@/utils/notify'

const loading = ref(false)
const saving = ref(false)
const testing = ref(false)
const form = ref({ isEnabled: false, chatId: '', reminderDaysBefore: [7, 3, 1, 0], overdueReminderEnabled: true })
const dayOptions = [
  { value: 0, label: 'В день оплаты' },
  { value: 1, label: 'За 1 день' },
  { value: 3, label: 'За 3 дня' },
  { value: 7, label: 'За 7 дней' },
]

onMounted(async () => {
  loading.value = true
  try {
    const res = await telegramApi.getSettings()
    const s = res.data.data
    form.value = {
      isEnabled: s.isEnabled,
      chatId: s.chatId || '',
      reminderDaysBefore: Array.isArray(s.reminderDaysBefore) ? s.reminderDaysBefore : [7, 3, 1, 0],
      overdueReminderEnabled: s.overdueReminderEnabled,
    }
  } finally { loading.value = false }
})

const save = async () => {
  saving.value = true
  try {
    await telegramApi.updateSettings({ ...form.value, chatId: form.value.chatId || null })
    notify.success('Настройки сохранены')
  } catch (err) { notify.error(err.response?.data?.error || 'Ошибка') }
  finally { saving.value = false }
}

const test = async () => {
  testing.value = true
  try {
    await telegramApi.test()
    notify.success('Тестовое сообщение отправлено')
  } catch (err) { notify.error(err.response?.data?.error || 'Ошибка отправки') }
  finally { testing.value = false }
}
</script>
