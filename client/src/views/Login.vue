<template>
  <AuthLayout>
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="submit">
      <el-form-item label="Email" prop="email">
        <el-input v-model="form.email" type="email" placeholder="admin@studio.ru" />
      </el-form-item>
      <el-form-item label="Пароль" prop="password">
        <el-input v-model="form.password" type="password" show-password placeholder="••••••" />
      </el-form-item>
      <el-button type="primary" native-type="submit" :loading="loading" style="width:100%;margin-top:8px">
        Войти
      </el-button>
    </el-form>
  </AuthLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import AuthLayout from '@/layouts/AuthLayout.vue'

const auth = useAuthStore()
const router = useRouter()
const formRef = ref()
const loading = ref(false)
const form = ref({ email: '', password: '' })

const rules = {
  email: [{ required: true, message: 'Введите email', trigger: 'blur' }],
  password: [{ required: true, message: 'Введите пароль', trigger: 'blur' }],
}

const submit = async () => {
  await formRef.value.validate()
  loading.value = true
  try {
    await auth.login(form.value.email, form.value.password)
    router.push('/dashboard')
  } catch (err) {
    ElMessage.error(err.response?.data?.error || 'Ошибка входа')
  } finally {
    loading.value = false
  }
}
</script>
