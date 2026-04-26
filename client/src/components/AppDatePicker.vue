<template>
  <div ref="rootRef" class="relative">
    <div class="relative">
      <button
        class="ui-input flex h-10 items-center gap-2 pr-9 text-left"
        type="button"
        @click="toggle"
      >
        <Calendar class="size-4 flex-none text-slate-500" />
        <span :class="displayValue ? 'text-slate-100' : 'text-slate-500'">
          {{ displayValue || placeholder }}
        </span>
      </button>
      <button
        v-if="clearable && modelValue"
        class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-200"
        type="button"
        @click.stop="selectDate('')"
      >
        <X class="size-4" />
      </button>
    </div>

    <div
      v-if="open"
      class="absolute left-0 top-full z-[70] mt-2 w-72 rounded-lg border border-slate-700 bg-slate-950 p-3 shadow-2xl shadow-black/50"
    >
      <div class="mb-3 flex items-center justify-between">
        <button class="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100" type="button" @click="shiftMonth(-1)">
          <ChevronLeft class="size-4" />
        </button>
        <div class="text-sm font-semibold text-slate-100">{{ monthTitle }}</div>
        <button class="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100" type="button" @click="shiftMonth(1)">
          <ChevronRight class="size-4" />
        </button>
      </div>

      <div class="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500">
        <div v-for="day in weekDays" :key="day" class="py-1">{{ day }}</div>
      </div>

      <div class="mt-1 grid grid-cols-7 gap-1">
        <button
          v-for="day in calendarDays"
          :key="day.key"
          class="grid h-9 place-items-center rounded-md text-sm transition"
          :class="dayClasses(day)"
          type="button"
          @click="selectDate(day.value)"
        >
          {{ day.label }}
        </button>
      </div>

      <div class="mt-3 flex items-center justify-between border-t border-slate-800 pt-3">
        <button class="text-xs font-semibold text-blue-300 hover:text-blue-200" type="button" @click="selectDate(todayString)">
          Сегодня
        </button>
        <button class="text-xs font-semibold text-slate-500 hover:text-slate-300" type="button" @click="open = false">
          Закрыть
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'дд.мм.гггг' },
  clearable: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue', 'change'])

const rootRef = ref(null)
const open = ref(false)
const viewDate = ref(new Date())
const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const monthNames = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь']

const pad = (value) => String(value).padStart(2, '0')

const toDateString = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const parseDate = (value) => {
  if (!value) return null
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

const todayString = toDateString(new Date())
const selectedDate = computed(() => parseDate(props.modelValue))
const displayValue = computed(() => {
  const date = selectedDate.value
  return date ? `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}` : ''
})
const monthTitle = computed(() => `${monthNames[viewDate.value.getMonth()]} ${viewDate.value.getFullYear()}`)

const calendarDays = computed(() => {
  const year = viewDate.value.getFullYear()
  const month = viewDate.value.getMonth()
  const first = new Date(year, month, 1)
  const startOffset = (first.getDay() + 6) % 7
  const start = new Date(year, month, 1 - startOffset)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const value = toDateString(date)
    return {
      key: value,
      label: date.getDate(),
      value,
      currentMonth: date.getMonth() === month,
      selected: value === props.modelValue,
      today: value === todayString,
    }
  })
})

const syncViewDate = () => {
  viewDate.value = selectedDate.value || new Date()
}

watch(() => props.modelValue, syncViewDate, { immediate: true })

const toggle = () => {
  syncViewDate()
  open.value = !open.value
}

const shiftMonth = (direction) => {
  const next = new Date(viewDate.value)
  next.setMonth(next.getMonth() + direction)
  viewDate.value = next
}

const selectDate = (value) => {
  emit('update:modelValue', value)
  emit('change', value)
  open.value = false
}

const dayClasses = (day) => {
  if (day.selected) return 'bg-blue-400 font-bold text-slate-950'
  if (day.today) return 'bg-slate-800 text-blue-300 ring-1 ring-blue-400/30'
  if (!day.currentMonth) return 'text-slate-700 hover:bg-slate-900 hover:text-slate-500'
  return 'text-slate-300 hover:bg-slate-800 hover:text-white'
}

const handleOutside = (event) => {
  if (!rootRef.value?.contains(event.target)) open.value = false
}

onMounted(() => document.addEventListener('pointerdown', handleOutside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', handleOutside))
</script>
