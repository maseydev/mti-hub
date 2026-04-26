<template>
  <div style="max-width:600px">
    <el-card v-loading="loading">
      <template #header>Настройки Telegram-напоминаний</template>

      <el-alert type="info" :closable="false" style="margin-bottom:20px">
        Токен бота задаётся через переменную окружения <code>TELEGRAM_BOT_TOKEN</code> в .env.
        Здесь настраивается только chat_id и расписание.
      </el-alert>

      <el-form ref="formRef" :model="form" label-position="top" label-width="auto">
        <el-form-item label="Включить напоминания">
          <el-switch v-model="form.isEnabled" active-text="Включено" inactive-text="Отключено" />
        </el-form-item>

        <el-form-item label="Chat ID">
          <el-input v-model="form.chatId" placeholder="-100123456789" style="width:260px" />
          <div style="color:#909399;font-size:12px;margin-top:4px">
            Узнать chat_id: отправьте боту <code>/start</code>, затем откройте<br>
            <code>https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</code>
          </div>
        </el-form-item>

        <el-form-item label="За сколько дней до оплаты отправлять напоминание">
          <el-checkbox-group v-model="form.reminderDaysBefore">
            <el-checkbox :value="0" label="В день оплаты" />
            <el-checkbox :value="1" label="За 1 день" />
            <el-checkbox :value="3" label="За 3 дня" />
            <el-checkbox :value="7" label="За 7 дней" />
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="Напоминания о просрочках">
          <el-switch v-model="form.overdueReminderEnabled" />
        </el-form-item>

        <div style="display:flex;gap:12px;margin-top:8px">
          <el-button type="primary" :loading="saving" @click="save">Сохранить настройки</el-button>
          <el-button :loading="testing" @click="test">Тест Telegram</el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { telegramApi } from '@/api/telegram'

const loading = ref(false)
const saving = ref(false)
const testing = ref(false)
const formRef = ref()
const form = ref({ isEnabled: false, chatId: '', reminderDaysBefore: [7, 3, 1, 0], overdueReminderEnabled: true })

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
    ElMessage.success('Настройки сохранены')
  } catch (err) { ElMessage.error(err.response?.data?.error || 'Ошибка') }
  finally { saving.value = false }
}

const test = async () => {
  testing.value = true
  try {
    await telegramApi.test()
    ElMessage.success('Тестовое сообщение отправлено!')
  } catch (err) { ElMessage.error(err.response?.data?.error || 'Ошибка отправки') }
  finally { testing.value = false }
}
</script>
