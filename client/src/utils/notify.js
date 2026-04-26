export const notify = {
  success(message) {
    window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'success', message } }))
  },
  error(message) {
    window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'error', message } }))
  },
}

export const confirmAction = async (message) => window.confirm(message)
