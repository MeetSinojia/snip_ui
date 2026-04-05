export const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const isExpired = (expiresAt) => {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

export const truncateUrl = (url, maxLen = 48) => {
  if (!url || url.length <= maxLen) return url
  return url.slice(0, maxLen) + '…'
}

export const extractShortCode = (input) => {
  if (!input) return ''
  // Accept both full short URLs and bare codes
  try {
    const url = new URL(input)
    return url.pathname.replace('/', '').trim()
  } catch {
    return input.trim()
  }
}
