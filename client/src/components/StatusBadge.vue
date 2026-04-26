<template>
  <span
    class="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold"
    :class="badgeClass"
  >
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ status: String, domain: { type: String, default: 'billing' } })

const maps = {
  billing: {
    PLANNED: { tone: 'slate', label: 'Запланировано' },
    DUE: { tone: 'amber', label: 'К оплате' },
    OVERDUE: { tone: 'red', label: 'Просрочено' },
    PAID: { tone: 'emerald', label: 'Оплачено' },
    CANCELLED: { tone: 'slate', label: 'Отменено' },
  },
  client: {
    ACTIVE: { tone: 'emerald', label: 'Активен' },
    PAUSED: { tone: 'amber', label: 'Приостановлен' },
    ARCHIVED: { tone: 'slate', label: 'Архив' },
  },
  project: {
    ACTIVE: { tone: 'emerald', label: 'Активен' },
    PAUSED: { tone: 'amber', label: 'Приостановлен' },
    FINISHED: { tone: 'sky', label: 'Завершён' },
    ARCHIVED: { tone: 'slate', label: 'Архив' },
  },
  service: {
    ACTIVE: { tone: 'emerald', label: 'Активна' },
    PAUSED: { tone: 'amber', label: 'Пауза' },
    CANCELLED: { tone: 'red', label: 'Отменена' },
    ARCHIVED: { tone: 'slate', label: 'Архив' },
  },
  transaction: {
    INCOME: { tone: 'teal', label: 'Доход' },
    EXPENSE: { tone: 'rose', label: 'Расход' },
  },
  task: {
    TODO: { tone: 'slate', label: 'К выполнению' },
    IN_PROGRESS: { tone: 'sky', label: 'В работе' },
    DONE: { tone: 'emerald', label: 'Готово' },
    CANCELLED: { tone: 'red', label: 'Отменено' },
  },
  priority: {
    LOW: { tone: 'slate', label: 'Низкий' },
    MEDIUM: { tone: 'amber', label: 'Средний' },
    HIGH: { tone: 'red', label: 'Высокий' },
  },
}

const classes = {
  emerald: 'bg-teal-400/10 text-teal-300 ring-1 ring-teal-400/20',
  teal: 'bg-teal-400/10 text-teal-300 ring-1 ring-teal-400/20',
  amber: 'bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/20',
  red: 'bg-rose-400/10 text-rose-300 ring-1 ring-rose-400/20',
  rose: 'bg-rose-400/10 text-rose-300 ring-1 ring-rose-400/20',
  sky: 'bg-blue-400/10 text-blue-300 ring-1 ring-blue-400/20',
  slate: 'bg-slate-400/10 text-slate-300 ring-1 ring-slate-400/20',
}

const meta = computed(() => maps[props.domain]?.[props.status] ?? { tone: 'slate', label: props.status || '—' })
const label = computed(() => meta.value.label)
const badgeClass = computed(() => classes[meta.value.tone])
</script>
