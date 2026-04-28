<template>
  <input
    v-bind="$attrs"
    :value="displayValue"
    class="ui-input"
    inputmode="decimal"
    type="text"
    @blur="syncFromModel"
    @input="handleInput"
  />
</template>

<script setup>
import { ref, watch } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [Number, String], default: 0 },
  allowNegative: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const displayValue = ref('')

const splitAmount = (value) => {
  let normalized = String(value ?? '')
    .replace(/\s+/g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '')

  if (!props.allowNegative) normalized = normalized.replace(/-/g, '')
  normalized = normalized.replace(/(?!^)-/g, '')

  const [integer = '', ...fractionParts] = normalized.split('.')
  const fraction = fractionParts.join('')
  return {
    sign: integer.startsWith('-') ? '-' : '',
    integer: integer.replace('-', ''),
    fraction,
    hasDecimal: normalized.includes('.'),
  }
}

const formatInput = (value) => {
  const { sign, integer, fraction, hasDecimal } = splitAmount(value)
  const grouped = integer.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  const safeInteger = grouped || (hasDecimal ? '0' : '')
  return `${sign}${safeInteger}${hasDecimal ? `.${fraction}` : ''}`
}

const parseAmount = (value) => {
  const { sign, integer, fraction, hasDecimal } = splitAmount(value)
  const raw = `${sign}${integer || '0'}${hasDecimal ? `.${fraction}` : ''}`
  const next = Number(raw)
  return Number.isFinite(next) ? next : 0
}

const syncFromModel = () => {
  displayValue.value = formatInput(props.modelValue)
}

const handleInput = (event) => {
  displayValue.value = formatInput(event.target.value)
  emit('update:modelValue', parseAmount(displayValue.value))
}

watch(() => props.modelValue, syncFromModel, { immediate: true })
</script>
