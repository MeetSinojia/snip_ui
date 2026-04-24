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

// ── Debug / Redis Console endpoints ─────────────────────────────────────────

/**
 * GET /api/debug/config
 * Returns rate-limit config values from application.yml:
 *   { capacity, refillRate, windowSeconds, source }
 * Never throws — returns null on error so UI can show fallback.
 */
export const getRateLimitConfig = () =>
  api.get('/debug/config').then(r => r.data).catch(() => null)

/** Returns current token-bucket snapshot for the caller's IP */
export const getRateStatus = () =>
  api.get('/debug/rate-status').then(r => r.data)

/**
 * Fires one synthetic request through the real rate-limit check.
 * Resolves even on 429 so callers don't need a catch for the simulator.
 */
export const simulateRequest = () =>
  api.post('/debug/simulate-request').then(r => r.data)
    .catch(err => err.response?.data ?? { allowed: false, httpStatus: 429 })

/** Clears the caller's token bucket */
export const resetRateLimit = () =>
  api.delete('/debug/reset-rate-limit').then(r => r.data)

// ── Local history ────────────────────────────────────────────────────────────

const HISTORY_KEY = 'snip_history'
const MAX_HISTORY  = 8

export const getHistory = () => {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') }
  catch { return [] }
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