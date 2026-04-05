import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// ── URL endpoints ────────────────────────────────────────────────────────────

export const shortenUrl = (originalUrl, expiryHours = 24) =>
  api.post('/shorten', { originalUrl, expiryHours }).then(r => r.data)

export const getAnalytics = (shortCode) =>
  api.get(`/analytics/${shortCode}`).then(r => r.data)

export const deactivateUrl = (shortCode) =>
  api.delete(`/urls/${shortCode}`)

// ── Local history (no backend needed) ───────────────────────────────────────

const HISTORY_KEY = 'snip_history'
const MAX_HISTORY  = 8

export const getHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
  } catch {
    return []
  }
}

export const addToHistory = (entry) => {
  const history = getHistory()
  const updated = [entry, ...history.filter(h => h.shortCode !== entry.shortCode)]
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated.slice(0, MAX_HISTORY)))
}

export const removeFromHistory = (shortCode) => {
  const updated = getHistory().filter(h => h.shortCode !== shortCode)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
}
