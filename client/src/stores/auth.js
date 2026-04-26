import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
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

  const updateProfile = async (data) => {
    const res = await authApi.updateMe(data)
    user.value = res.data.data
    return res.data.data
  }

  const changePassword = async (data) => {
    const res = await authApi.changePassword(data)
    return res.data.data
  }

  const isAdmin = computed(() => ['ADMIN', 'OWNER'].includes(user.value?.role))
  const isManager = computed(() => user.value?.role === 'MANAGER')
  const isMember = computed(() => user.value?.role === 'MEMBER')
  const isAdminOrManager = computed(() => ['ADMIN', 'OWNER', 'MANAGER'].includes(user.value?.role))

  return { token, user, login, logout, fetchMe, updateProfile, changePassword, isAdmin, isManager, isMember, isAdminOrManager }
})
