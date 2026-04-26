<template>
  <el-tag :type="tagType" size="small" disable-transitions>{{ label }}</el-tag>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ status: String, domain: { type: String, default: 'billing' } })

const maps = {
  billing: {
    PLANNED: { type: 'info', label: 'Запланировано' },
    DUE: { type: 'warning', label: 'К оплате' },
    OVERDUE: { type: 'danger', label: 'Просрочено' },
    PAID: { type: 'success', label: 'Оплачено' },
    CANCELLED: { type: '', label: 'Отменено' },
  },
  client: {
    ACTIVE: { type: 'success', label: 'Активен' },
    PAUSED: { type: 'warning', label: 'Приостановлен' },
    ARCHIVED: { type: 'info', label: 'Архив' },
  },
  project: {
    ACTIVE: { type: 'success', label: 'Активен' },
    PAUSED: { type: 'warning', label: 'Приостановлен' },
    FINISHED: { type: 'info', label: 'Завершён' },
    ARCHIVED: { type: '', label: 'Архив' },
  },
  service: {
    ACTIVE: { type: 'success', label: 'Активна' },
    PAUSED: { type: 'warning', label: 'Пауза' },
    CANCELLED: { type: 'danger', label: 'Отменена' },
    ARCHIVED: { type: '', label: 'Архив' },
  },
  transaction: {
    INCOME: { type: 'success', label: 'Доход' },
    EXPENSE: { type: 'danger', label: 'Расход' },
  },
}

const tagType = computed(() => maps[props.domain]?.[props.status]?.type ?? 'info')
const label = computed(() => maps[props.domain]?.[props.status]?.label ?? props.status)
</script>
