/**
 * simulatorStore.js
 *
 * Fixed version:
 * - No infinite loop (stable snapshot)
 * - UI updates correctly (new snapshot only on change)
 */

// ── State ────────────────────────────────────────────────────────────────────
const state = {
  requests:  [],
  running:   false,
  speed:     { label: 'Normal', ms: 300, desc: '~3.3 req/s' },
  count:     0,
  timerId:   null,
  listeners: new Set(),

  // ✅ ADD THESE
  totalSent: 0,
  totalAccepted: 0,
  totalBlocked: 0,
}

// ── Snapshot (IMPORTANT) ─────────────────────────────────────────────────────
let snapshot = {
  requests: state.requests,
  running:  state.running,
  speed:    state.speed,
  count:    state.count,
  totalSent: state.totalSent,
  totalAccepted: state.totalAccepted,
  totalBlocked: state.totalBlocked,
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function updateSnapshot() {
  snapshot = {
    requests: state.requests,
    running:  state.running,
    speed:    state.speed,
    count:    state.count,
    totalSent: state.totalSent,
    totalAccepted: state.totalAccepted,
    totalBlocked: state.totalBlocked,
  }
}

// ── Pub/sub ──────────────────────────────────────────────────────────────────
export function subscribe(fn) {
  state.listeners.add(fn)
  return () => state.listeners.delete(fn)
}

function notify() {
  updateSnapshot()                 // ✅ create new reference only when state changes
  state.listeners.forEach(fn => fn())
}

// ── Getters ──────────────────────────────────────────────────────────────────
export function getSnapshot() {
  return snapshot                 // ✅ stable reference for React
}

// ── Actions ──────────────────────────────────────────────────────────────────
export function addRequest(result) {
  state.count += 1

  // ✅ ADD THESE
  state.totalSent += 1
  if (result.allowed) state.totalAccepted += 1
  else state.totalBlocked += 1

  const ts = new Date().toLocaleTimeString('en-GB', { hour12: false })

  state.requests = [
    { ...result, ts, id: state.count },
    ...state.requests.slice(0, 49),
  ]

  notify()
}

export function setRunning(val) {
  if (state.running === val) return   // ✅ prevent unnecessary updates
  state.running = val
  notify()
}

export function setSpeed(s) {
  if (state.speed === s) return       // ✅ prevent unnecessary updates
  state.speed = s
  notify()
}

export function setTimerId(id) {
  state.timerId = id
}

export function getTimerId() {
  return state.timerId
}

export function clearRequests() {
  state.requests = []
  state.count = 0

  // ✅ RESET COUNTERS
  state.totalSent = 0
  state.totalAccepted = 0
  state.totalBlocked = 0

  notify()
}