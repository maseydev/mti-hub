<template>
  <div class="fixed right-4 top-4 z-[80] flex w-full max-w-sm flex-col gap-2">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="rounded-lg border px-4 py-3 text-sm shadow-lg shadow-black/30"
      :class="toast.type === 'error'
        ? 'border-rose-500/30 bg-rose-950/90 text-rose-100'
        : 'border-teal-500/30 bg-teal-950/90 text-teal-100'"
    >
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const toasts = ref([])
let nextId = 1

const addToast = (event) => {
  const toast = { id: nextId++, type: event.detail.type, message: event.detail.message }
  toasts.value.push(toast)
  window.setTimeout(() => {
    toasts.value = toasts.value.filter((item) => item.id !== toast.id)
  }, 3200)
}

onMounted(() => window.addEventListener('app:toast', addToast))
onBeforeUnmount(() => window.removeEventListener('app:toast', addToast))
</script>
