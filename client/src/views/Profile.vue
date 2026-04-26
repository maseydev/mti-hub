<template>
  <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
    <section class="ui-card">
      <div class="ui-card-header">Данные профиля</div>
      <form class="ui-card-body space-y-4" @submit.prevent="saveProfile">
        <div class="grid gap-4 sm:grid-cols-2">
          <label>
            <span class="ui-label">Имя *</span>
            <input v-model.trim="profile.name" class="ui-input" required />
          </label>
          <label>
            <span class="ui-label">Email *</span>
            <input v-model.trim="profile.email" class="ui-input" type="email" required />
          </label>
          <label>
            <span class="ui-label">Должность</span>
            <input v-model.trim="profile.position" class="ui-input" placeholder="Разработчик, менеджер..." />
          </label>
          <label>
            <span class="ui-label">Telegram</span>
            <input v-model.trim="profile.telegram" class="ui-input" placeholder="@username" />
          </label>
          <label>
            <span class="ui-label">Локаль</span>
            <input v-model.trim="profile.locale" class="ui-input" placeholder="ru" />
          </label>
          <label>
            <span class="ui-label">Валюта</span>
            <input v-model.trim="profile.currency" class="ui-input uppercase" maxlength="8" placeholder="RUB" />
          </label>
        </div>

        <div class="rounded-lg border border-slate-800 bg-slate-950/45 p-4 text-sm text-slate-400">
          <div class="flex flex-wrap gap-x-8 gap-y-2">
            <span>Роль: <b class="font-semibold text-slate-200">{{ roleLabel }}</b></span>
            <span>Аккаунт: <b class="font-semibold text-slate-200">{{ activeLabel }}</b></span>
          </div>
        </div>

        <div class="flex justify-end">
          <button class="ui-button ui-button-primary" type="submit" :disabled="savingProfile">
            {{ savingProfile ? 'Сохраняем...' : 'Сохранить профиль' }}
          </button>
        </div>
      </form>
    </section>

    <section class="ui-card self-start">
      <div class="ui-card-header">Смена пароля</div>
      <form class="ui-card-body space-y-4" @submit.prevent="savePassword">
        <label>
          <span class="ui-label">Текущий пароль *</span>
          <input v-model="passwordForm.currentPassword" class="ui-input" type="password" autocomplete="current-password" required />
        </label>
        <label>
          <span class="ui-label">Новый пароль *</span>
          <input v-model="passwordForm.newPassword" class="ui-input" type="password" autocomplete="new-password" required />
        </label>
        <label>
          <span class="ui-label">Повторите новый пароль *</span>
          <input v-model="passwordForm.repeatPassword" class="ui-input" type="password" autocomplete="new-password" required />
        </label>

        <button class="ui-button ui-button-primary w-full" type="submit" :disabled="savingPassword">
          {{ savingPassword ? 'Меняем...' : 'Сменить пароль' }}
        </button>
      </form>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { notify } from '@/utils/notify'

const auth = useAuthStore()

const profile = reactive({
  name: '',
  email: '',
  position: '',
  telegram: '',
  locale: 'ru',
  currency: 'RUB',
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  repeatPassword: '',
})

const savingProfile = ref(false)
const savingPassword = ref(false)

const ROLE_LABELS = {
  OWNER: 'Владелец',
  ADMIN: 'Администратор',
  MANAGER: 'Менеджер',
  MEMBER: 'Участник',
  VIEWER: 'Наблюдатель',
}

const roleLabel = computed(() => ROLE_LABELS[auth.user?.role] || auth.user?.role || '—')
const activeLabel = computed(() => auth.user?.isActive ? 'Активен' : 'Отключен')

const fillProfile = () => {
  const user = auth.user
  if (!user) return
  profile.name = user.name || ''
  profile.email = user.email || ''
  profile.position = user.position || ''
  profile.telegram = user.telegram || ''
  profile.locale = user.locale || 'ru'
  profile.currency = user.currency || 'RUB'
}

const saveProfile = async () => {
  savingProfile.value = true
  try {
    await auth.updateProfile({
      name: profile.name,
      email: profile.email,
      position: profile.position || null,
      telegram: profile.telegram || null,
      locale: profile.locale || 'ru',
      currency: profile.currency || 'RUB',
    })
    fillProfile()
    notify.success('Профиль обновлен')
  } catch (err) {
    notify.error(err.response?.data?.error || 'Ошибка')
  } finally {
    savingProfile.value = false
  }
}

const savePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.repeatPassword) {
    notify.error('Новые пароли не совпадают')
    return
  }

  savingPassword.value = true
  try {
    await auth.changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    })
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.repeatPassword = ''
    notify.success('Пароль изменен')
  } catch (err) {
    notify.error(err.response?.data?.error || 'Ошибка')
  } finally {
    savingPassword.value = false
  }
}

onMounted(async () => {
  if (!auth.user) await auth.fetchMe()
  fillProfile()
})
</script>
