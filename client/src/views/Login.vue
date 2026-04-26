<template>
  <AuthLayout>
    <form class="space-y-5" @submit.prevent="submit">
      <div>
        <label class="ui-label" for="email">Email</label>
        <input id="email" v-model="form.email" class="ui-input" type="email" placeholder="admin@studio.ru" required />
      </div>
      <div>
        <label class="ui-label" for="password">Пароль</label>
        <input id="password" v-model="form.password" class="ui-input" type="password" placeholder="••••••" required />
      </div>
      <button class="ui-button ui-button-primary w-full" type="submit" :disabled="loading">
        {{ loading ? 'Входим...' : 'Войти' }}
      </button>
    </form>
  </AuthLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { notify } from '@/utils/notify'

const auth = useAuthStore()
const router = useRouter()
const loading = ref(false)
const form = ref({ email: '', password: '' })

const submit = async () => {
  loading.value = true
  try {
    await auth.login(form.value.email, form.value.password)
    router.push('/dashboard')
  } catch (err) {
    notify.error(err.response?.data?.error || 'Ошибка входа')
  } finally {
    loading.value = false
  }
}
</script>
