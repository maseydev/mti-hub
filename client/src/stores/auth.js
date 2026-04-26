import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authApi } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(null)

  const setToken = (t) => {
    token.value = t
    localStorage.setItem('token', t)
  }

  const login = async (email, password) => {
    const res = await authApi.login({ email, password })
    setToken(res.data.data.token)
    user.value = res.data.data.user
    return res.data.data
  }

  const logout = () => {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
  }

  const fetchMe = async () => {
    try {
      const res = await authApi.me()
      user.value = res.data.data
    } catch {
      logout()
    }
  }

  return { token, user, login, logout, fetchMe }
})
