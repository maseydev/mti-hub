<template>
  <div class="space-y-6 max-w-2xl">

    <!-- Personal settings (all roles) -->
    <section class="ui-card">
      <div class="ui-card-header">Мои уведомления Telegram</div>
      <div class="ui-card-body space-y-5">
        <label class="block">
          <span class="ui-label">Мой Telegram Chat ID</span>
          <input v-model="myForm.telegramChatId" class="ui-input max-w-xs" placeholder="-100123456789" />
          <span class="mt-2 block text-xs leading-5 text-slate-500">
            Отправьте <code>/start</code> боту задач, затем откройте
            <code>https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</code>
          </span>
        </label>

        <label class="flex items-center gap-3 text-sm text-slate-300">
          <input v-model="myForm.taskNotificationsEnabled" type="checkbox" />
          Уведомления о задачах
        </label>

        <label v-if="auth.isAdmin" class="flex items-center gap-3 text-sm text-slate-300">
          <input v-model="myForm.financeNotificationsEnabled" type="checkbox" />
          Финансовые уведомления
        </label>

        <div class="flex flex-wrap gap-3">
          <button class="ui-button ui-button-primary" type="button" :disabled="savingMe" @click="saveMySettings">
            {{ savingMe ? 'Сохраняем...' : 'Сохранить' }}
          </button>
          <button class="ui-button" type="button" :disabled="testingTask" @click="testTask">
            {{ testingTask ? 'Отправляем...' : 'Тест уведомления о задаче' }}
          </button>
        </div>
      </div>
    </section>

    <!-- Bot management (admin only) -->
    <template v-if="auth.isAdmin">
      <section class="ui-card">
        <div class="ui-card-header">Бот задач (TASK)</div>
        <div class="ui-card-body space-y-4">
          <label class="block">
            <span class="ui-label">Токен бота</span>
            <input v-model="taskBot.botToken" class="ui-input" placeholder="123456789:AAB..." type="password" autocomplete="off" />
          </label>
          <label class="block">
            <span class="ui-label">Username бота</span>
            <input v-model="taskBot.botUsername" class="ui-input max-w-xs" placeholder="@my_task_bot" />
          </label>
          <label class="flex items-center gap-3 text-sm text-slate-300">
            <input v-model="taskBot.isEnabled" type="checkbox" />
            Бот активен
          </label>
          <div class="flex flex-wrap gap-3">
            <button class="ui-button ui-button-primary" type="button" :disabled="savingTask" @click="saveBot('TASK')">
              {{ savingTask ? 'Сохраняем...' : 'Сохранить' }}
            </button>
            <button class="ui-button" type="button" :disabled="testingBotTask" @click="testBotType('TASK')">
              {{ testingBotTask ? 'Отправляем...' : 'Тест' }}
            </button>
          </div>
          <p v-if="testBotChatId" class="text-xs text-slate-400">Chat ID для теста: <code>{{ testBotChatId }}</code></p>
        </div>
      </section>

      <section class="ui-card">
        <div class="ui-card-header">Бот финансов (FINANCE)</div>
        <div class="ui-card-body space-y-4">
          <label class="block">
            <span class="ui-label">Токен бота</span>
            <input v-model="financeBot.botToken" class="ui-input" placeholder="123456789:AAB..." type="password" autocomplete="off" />
          </label>
          <label class="block">
            <span class="ui-label">Username бота</span>
            <input v-model="financeBot.botUsername" class="ui-input max-w-xs" placeholder="@my_finance_bot" />
          </label>
          <label class="flex items-center gap-3 text-sm text-slate-300">
            <input v-model="financeBot.isEnabled" type="checkbox" />
            Бот активен
          </label>
          <div class="flex flex-wrap gap-3">
            <button class="ui-button ui-button-primary" type="button" :disabled="savingFinance" @click="saveBot('FINANCE')">
              {{ savingFinance ? 'Сохраняем...' : 'Сохранить' }}
            </button>
            <button class="ui-button" type="button" :disabled="testingBotFinance" @click="testBotType('FINANCE')">
              {{ testingBotFinance ? 'Отправляем...' : 'Тест' }}
            </button>
          </div>
        </div>
      </section>

      <section class="ui-card">
        <div class="ui-card-header">Расписание финансовых напоминаний</div>
        <div class="ui-card-body space-y-5">
          <label class="flex items-center gap-3 text-sm text-slate-300">
            <input v-model="reminderForm.isEnabled" type="checkbox" />
            Включить напоминания
          </label>
          <div>
            <div class="ui-label">За сколько дней до оплаты отправлять напоминание</div>
            <div class="grid gap-2 sm:grid-cols-2">
              <label v-for="option in dayOptions" :key="option.value" class="flex items-center gap-2 text-sm text-slate-300">
                <input v-model="reminderForm.reminderDaysBefore" :value="option.value" type="checkbox" />
                {{ option.label }}
              </label>
            </div>
          </div>
          <label class="flex items-center gap-3 text-sm text-slate-300">
            <input v-model="reminderForm.overdueReminderEnabled" type="checkbox" />
            Напоминания о просрочках
          </label>
          <button class="ui-button ui-button-primary" type="button" :disabled="savingReminders" @click="saveReminders">
            {{ savingReminders ? 'Сохраняем...' : 'Сохранить расписание' }}
          </button>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { telegramApi } from '@/api/telegram'
import { useAuthStore } from '@/stores/auth'
import { notify } from '@/utils/notify'

const auth = useAuthStore()

const savingMe = ref(false)
const testingTask = ref(false)
const savingTask = ref(false)
const savingFinance = ref(false)
const testingBotTask = ref(false)
const testingBotFinance = ref(false)
const savingReminders = ref(false)

const myForm = ref({ telegramChatId: '', taskNotificationsEnabled: true, financeNotificationsEnabled: false })
const taskBot = ref({ botToken: '', botUsername: '', isEnabled: false })
const financeBot = ref({ botToken: '', botUsername: '', isEnabled: false })
const reminderForm = ref({ isEnabled: false, reminderDaysBefore: [7, 3, 1, 0], overdueReminderEnabled: true })
const testBotChatId = ref('')

const dayOptions = [
  { value: 0, label: 'В день оплаты' },
  { value: 1, label: 'За 1 день' },
  { value: 3, label: 'За 3 дня' },
  { value: 7, label: 'За 7 дней' },
]

onMounted(async () => {
  const myRes = await telegramApi.getMySettings()
  const my = myRes.data.data
  myForm.value = {
    telegramChatId: my.telegramChatId || '',
    taskNotificationsEnabled: my.taskNotificationsEnabled,
    financeNotificationsEnabled: my.financeNotificationsEnabled,
  }

  if (auth.isAdmin) {
    const [botsRes, settingsRes] = await Promise.allSettled([telegramApi.getBots(), telegramApi.getSettings()])
    if (botsRes.status === 'fulfilled') {
      const bots = botsRes.value.data.data
      const tb = bots.find((b) => b.type === 'TASK')
      const fb = bots.find((b) => b.type === 'FINANCE')
      if (tb) taskBot.value = { botToken: '', botUsername: tb.botUsername || '', isEnabled: tb.isEnabled }
      if (fb) financeBot.value = { botToken: '', botUsername: fb.botUsername || '', isEnabled: fb.isEnabled }
    }
    if (settingsRes.status === 'fulfilled') {
      const s = settingsRes.value.data.data
      reminderForm.value = {
        isEnabled: s.isEnabled,
        reminderDaysBefore: Array.isArray(s.reminderDaysBefore) ? s.reminderDaysBefore : [7, 3, 1, 0],
        overdueReminderEnabled: s.overdueReminderEnabled,
      }
    }
  }
})

const buildMySettingsPayload = () => ({
  ...myForm.value,
  telegramChatId: myForm.value.telegramChatId?.trim() || null,
})

const persistMySettings = async () => {
  const res = await telegramApi.updateMySettings(buildMySettingsPayload())
  const updated = res.data.data
  myForm.value = {
    telegramChatId: updated.telegramChatId || '',
    taskNotificationsEnabled: updated.taskNotificationsEnabled,
    financeNotificationsEnabled: updated.financeNotificationsEnabled,
  }
  return updated
}

const saveMySettings = async () => {
  savingMe.value = true
  try {
    await persistMySettings()
    notify.success('Настройки сохранены')
  } catch (err) { notify.error(err.response?.data?.error || 'Ошибка') }
  finally { savingMe.value = false }
}

const testTask = async () => {
  testingTask.value = true
  try {
    await telegramApi.testMyTask()
    notify.success('Тестовое сообщение отправлено')
  } catch (err) { notify.error(err.response?.data?.error || 'Ошибка отправки') }
  finally { testingTask.value = false }
}

const saveBot = async (type) => {
  const isTask = type === 'TASK'
  if (isTask) savingTask.value = true; else savingFinance.value = true
  try {
    const form = isTask ? taskBot.value : financeBot.value
    const payload = { botUsername: form.botUsername || null, isEnabled: form.isEnabled }
    if (form.botToken) payload.botToken = form.botToken
    await telegramApi.updateBot(type, payload)
    notify.success('Бот обновлён')
    if (isTask) taskBot.value.botToken = ''; else financeBot.value.botToken = ''
  } catch (err) { notify.error(err.response?.data?.error || 'Ошибка') }
  finally { if (isTask) savingTask.value = false; else savingFinance.value = false }
}

const testBotType = async (type) => {
  const chatId = myForm.value.telegramChatId?.trim()
  if (!chatId) return notify.error('Укажите ваш Chat ID в разделе «Мои уведомления» для теста')
  const isTask = type === 'TASK'
  if (isTask) testingBotTask.value = true; else testingBotFinance.value = true
  try {
    await persistMySettings()
    await telegramApi.testBot(type, chatId)
    notify.success('Тестовое сообщение отправлено')
  } catch (err) { notify.error(err.response?.data?.error || 'Ошибка отправки') }
  finally { if (isTask) testingBotTask.value = false; else testingBotFinance.value = false }
}

const saveReminders = async () => {
  savingReminders.value = true
  try {
    await telegramApi.updateSettings(reminderForm.value)
    notify.success('Расписание сохранено')
  } catch (err) { notify.error(err.response?.data?.error || 'Ошибка') }
  finally { savingReminders.value = false }
}
</script>
