import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react'
import {
  Database, Zap, RefreshCw, Play, Square, RotateCcw,
  Clock, Shield, Activity, ChevronRight,
} from 'lucide-react'
import {
  getRateLimitConfig, getRateStatus, resetRateLimit, simulateRequest,
} from '../api/client'
import * as store from '../store/simulatorStore'

// ─────────────────────────────────────────────────────────────────────────────
// Tiny shared helpers
// ─────────────────────────────────────────────────────────────────────────────

function GlowBar({ value, max, color = '#c8f135' }) {
  const pct = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0))
  return (
    <div className="relative h-2.5 w-full bg-ink-700 overflow-hidden">
      <div
        className="absolute left-0 top-0 h-full transition-all duration-500"
        style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}55, ${color})`,
          boxShadow: `0 0 10px ${color}55`,
        }}
      />
      {max > 1 && Array.from({ length: max - 1 }).map((_, i) => (
        <div key={i} className="absolute top-0 bottom-0 w-px bg-ink-900/50"
             style={{ left: `${((i + 1) / max) * 100}%` }} />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LEFT PANEL — Redis Console
// ─────────────────────────────────────────────────────────────────────────────

function RefillCountdown({ ttlSeconds, windowSeconds, onExpire }) {
  const [cd, setCd] = useState(ttlSeconds)

  useEffect(() => { setCd(ttlSeconds) }, [ttlSeconds])
  useEffect(() => {
    if (cd <= 0) { onExpire?.(); return }
    const t = setTimeout(() => setCd(v => v - 1), 1000)
    return () => clearTimeout(t)
  }, [cd, onExpire])

  const pct   = Math.max(0, Math.min(100, windowSeconds > 0 ? (cd / windowSeconds) * 100 : 0))
  const isLow = cd <= 10

  return (
    <div>
      <p className="label mb-2">Refill Countdown</p>
      <div className="flex items-baseline gap-2 mb-2">
        <span
          className="tabular-nums leading-none"
          style={{
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: '3rem',
            color: isLow ? '#c8f135' : '#6e6e6e',
          }}
        >{cd}</span>
        <span className="font-mono text-xs text-ink-500">s / {windowSeconds}s</span>
      </div>
      <div className="relative h-1.5 w-full bg-ink-700 overflow-hidden mb-1">
        <div
          className="absolute left-0 top-0 h-full transition-all duration-1000"
          style={{
            width: `${pct}%`,
            background: isLow ? '#c8f135' : '#2a2a2a',
            boxShadow: isLow ? '0 0 6px #c8f13566' : 'none',
          }}
        />
      </div>
      <p className="font-mono text-[10px] text-ink-600">
        {isLow ? '⚡ tokens refill soon' : `${cd}s until full refill`}
      </p>
    </div>
  )
}

function RedisPanel({ config }) {
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [resetting, setResetting] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  const cap     = config?.capacity      ?? '—'
  const window_ = config?.windowSeconds ?? '—'
  const refill  = config?.refillRate    ?? '—'

  const fetchStatus = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getRateStatus()
      setData(res)
      setLastUpdated(new Date())
      setError('')
    } catch {
      setError('Backend unreachable')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStatus() }, [fetchStatus])
  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(fetchStatus, 2000)
    return () => clearInterval(id)
  }, [autoRefresh, fetchStatus])

  const handleReset = async () => {
    setResetting(true)
    try { await resetRateLimit(); await fetchStatus() }
    catch { setError('Reset failed') }
    finally { setResetting(false) }
  }

  const tokens   = data?.tokensRemaining ?? (typeof cap === 'number' ? cap : 0)
  const used     = data?.tokensUsed      ?? 0
  const ttl      = data?.ttlSeconds      ?? (typeof window_ === 'number' ? window_ : 60)
  const exceeded = data?.limitExceeded   ?? false
  const redisKey = data?.redisKey        ?? `rate:<ip>`

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Database size={12} className="text-acid" />
          <p className="label">Redis Console</p>
          <div className="flex items-center gap-1.5 ml-auto">
            <button onClick={() => setAutoRefresh(v => !v)}
              className={`font-mono text-[10px] px-2 py-0.5 border transition-colors
                ${autoRefresh ? 'border-acid/50 text-acid' : 'border-ink-600 text-ink-500'}`}>
              {autoRefresh ? '● LIVE' : '○ OFF'}
            </button>
            <button onClick={fetchStatus} disabled={loading}
              className="text-ink-500 hover:text-ink-200 transition-colors p-0.5">
              <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
        {lastUpdated && (
          <p className="font-mono text-[10px] text-ink-600">
            {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Config from backend */}
      <div className="border border-acid/20 bg-acid/5 p-3">
        <div className="flex items-center gap-1.5 mb-3">
          <Shield size={10} className="text-acid" />
          <p className="font-mono text-[10px] text-acid tracking-widest">RATE LIMIT CONFIG</p>
          <span className="font-mono text-[9px] text-ink-700 ml-auto">application.yml</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: 'Capacity',    value: cap,     unit: 'tkn' },
            { label: 'Window',      value: window_, unit: 's'   },
            { label: 'Refill',      value: refill,  unit: '/min' },
          ].map(({ label, value, unit }) => (
            <div key={label}>
              <p className="font-mono text-[9px] text-ink-600 mb-0.5">{label}</p>
              <p style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.6rem' }}
                 className="text-acid leading-none">
                {value}<span className="text-ink-500 text-xs ml-0.5">{unit}</span>
              </p>
            </div>
          ))}
        </div>
        <p className="font-mono text-[9px] text-ink-700 mt-2 pt-2 border-t border-ink-700/40">
          strategy: fixed-window token bucket · key: <span className="text-acid/70">{redisKey}</span>
        </p>
      </div>

      {error && (
        <p className="font-mono text-[10px] text-red-400 border border-red-500/20 px-3 py-2">
          ✕ {error}
        </p>
      )}

      {/* Status badge */}
      <div className={`inline-flex items-center gap-2 px-2.5 py-1 border font-mono text-[10px] tracking-widest w-fit
        ${exceeded ? 'border-red-500/40 text-red-400 bg-red-500/10' : 'border-acid/40 text-acid bg-acid/10'}`}>
        <span className={`w-1 h-1 rounded-full ${exceeded ? 'bg-red-400' : 'bg-acid pulse-dot'}`} />
        {exceeded ? 'RATE LIMITED' : 'BUCKET ACTIVE'}
      </div>

      {/* Token count */}
      <div className="card p-4">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="label mb-1">Tokens</p>
            <p className="tabular-nums leading-none"
               style={{
                 fontFamily: 'Bebas Neue, sans-serif',
                 fontSize: '3.5rem',
                 color: exceeded ? '#f87171' : '#c8f135',
               }}>
              {tokens}
              <span className="text-ink-600 text-xl"> / {typeof cap === 'number' ? cap : '?'}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="label mb-1">Used</p>
            <p style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem' }}
               className="text-ink-400 leading-none">{used}</p>
          </div>
        </div>
        <GlowBar value={tokens} max={typeof cap === 'number' ? cap : 10}
                 color={exceeded ? '#f87171' : '#c8f135'} />
      </div>

      {/* Countdown */}
      {data && (
        <div className="card p-4">
          <RefillCountdown
            ttlSeconds={ttl}
            windowSeconds={typeof window_ === 'number' ? window_ : 60}
            onExpire={fetchStatus}
          />
        </div>
      )}

      {/* Key details */}
      {data && (
        <div className="card p-3 text-[11px]">
          {[
            ['KEY',    data.redisKey, 'acid'],
            ['IP',     data.ip,       null],
            ['TTL',    `${data.ttlSeconds}s`, null],
            ['STATUS', data.limitExceeded ? '⛔ BLOCKED' : '✅ OK', null],
          ].map(([k, v, hi]) => (
            <div key={k} className="flex justify-between py-1.5 border-b border-ink-700/60 last:border-0">
              <span className="font-mono text-ink-600">{k}</span>
              <span className={`font-mono break-all text-right max-w-[60%] ${hi === 'acid' ? 'text-acid' : 'text-ink-200'}`}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {/* Reset */}
      <button onClick={handleReset} disabled={resetting}
        className="mt-auto font-mono text-xs px-4 py-2 border border-red-500/30 text-red-400
                   hover:border-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40 w-full">
        {resetting ? 'Resetting...' : '↺ Reset Bucket'}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// RIGHT PANEL — Rate Limit Simulator (persistent state via store)
// ─────────────────────────────────────────────────────────────────────────────

const SPEEDS = [
  { label: 'Slow',   ms: 600, desc: '~1.7/s'  },
  { label: 'Normal', ms: 300, desc: '~3.3/s'  },
  { label: 'Fast',   ms: 120, desc: '~8/s'    },
  { label: 'Burst',  ms: 40,  desc: '~25/s'   },
]

function RequestRow({ req }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 border-b border-ink-800 last:border-0
      font-mono text-[11px] ${req.allowed ? 'bg-acid/4' : 'bg-red-500/6'}`}>
      <span className={`shrink-0 w-10 text-center py-0.5 text-[10px] border
        ${req.allowed
          ? 'border-acid/30 text-acid bg-acid/10'
          : 'border-red-500/30 text-red-400 bg-red-500/10'}`}>
        {req.httpStatus}
      </span>
      <span className={`flex-1 truncate ${req.allowed ? 'text-ink-300' : 'text-red-300'}`}>
        {req.message ?? (req.allowed ? 'Accepted' : 'Rate limited')}
      </span>
      <span className="text-ink-600 shrink-0">
        {req.tokensRemaining != null ? `${req.tokensRemaining}t` : '—'}
      </span>
      <span className="text-ink-700 shrink-0 tabular-nums">{req.ts}</span>
    </div>
  )
}

function SimulatorPanel({ config }) {
  // Subscribe to the global store — survives route changes
const simState = useSyncExternalStore(store.subscribe, store.getSnapshot)

const {
  requests,
  running,
  speed,
  totalSent,
  totalAccepted,
  totalBlocked
} = simState
  const [resetting, setResetting]    = useState(false)

  const cap      = config?.capacity ?? 10

  const fire = useCallback(async () => {
    const result = await simulateRequest()
    store.addRequest(result)
  }, [])

  // On mount: if store says running, re-attach the interval
  // (the interval handle is lost on unmount but the running flag stays)
  useEffect(() => {
    if (running && !store.getTimerId()) {
      const id = setInterval(fire, speed.ms)
      store.setTimerId(id)
    }
    return () => {
      // Don't clear on unmount — keep firing while navigating away
    }
  }, []) // intentionally empty — only runs on mount

  const start = () => {
    if (running) return
    store.setRunning(true)
    fire()
    const id = setInterval(fire, speed.ms)
    store.setTimerId(id)
  }

  const stop = () => {
    clearInterval(store.getTimerId())
    store.setTimerId(null)
    store.setRunning(false)
  }

  const changeSpeed = (s) => {
    store.setSpeed(s)
    if (running) {
      clearInterval(store.getTimerId())
      const id = setInterval(fire, s.ms)
      store.setTimerId(id)
    }
  }

  const handleReset = async () => {
    stop()
    setResetting(true)
    try { await resetRateLimit(); store.clearRequests() }
    finally { setResetting(false) }
  }

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Zap size={12} className="text-red-400" />
          <p className="label">Rate Limit Simulator</p>
          {running && (
            <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] text-acid">
              <span className="w-1 h-1 rounded-full bg-acid pulse-dot" />
              FIRING
            </span>
          )}
        </div>
        <p className="font-mono text-[10px] text-ink-600">
          state persists across navigation
        </p>
      </div>

      {/* Speed */}
      <div>
        <p className="label mb-2">Speed</p>
        <div className="grid grid-cols-2 gap-1.5">
          {SPEEDS.map(s => (
            <button key={s.label} onClick={() => changeSpeed(s)}
              className={`font-mono text-[10px] px-2 py-1.5 border transition-colors text-left
                ${speed.label === s.label
                  ? 'border-acid text-acid bg-acid/10'
                  : 'border-ink-700 text-ink-500 hover:border-ink-500'}`}>
              <span className="text-ink-200">{s.label}</span>
              <span className="ml-1.5 text-ink-600">{s.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {!running ? (
          <button onClick={start}
            className="btn-primary flex items-center gap-2 flex-1 justify-center text-xs py-2.5">
            <Play size={12} /> Start
          </button>
        ) : (
          <button onClick={stop}
            className="flex-1 font-mono text-xs py-2.5 border border-red-500/50 text-red-400
                       bg-red-500/10 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2">
            <Square size={11} /> Stop
          </button>
        )}
        <button onClick={handleReset} disabled={resetting}
          className="btn-ghost flex items-center gap-1.5 text-xs px-3 disabled:opacity-40">
          <RotateCcw size={11} className={resetting ? 'animate-spin' : ''} />
          Reset
        </button>
      </div>

      {/* Stats */}
      {requests.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Sent',     val: totalSent,      color: 'text-ink-100' },
            { label: 'Accepted', val: totalAccepted,  color: 'text-acid'    },
            { label: '429s',     val: totalBlocked,   color: 'text-red-400' },
          ].map(({ label, val, color }) => (
            <div key={label} className="card p-2.5 text-center">
              <p className="label mb-1">{label}</p>
              <p style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem' }}
                 className={`${color} leading-none`}>{val}</p>
            </div>
          ))}
        </div>
      )}

      {/* Token drain bar */}
      {requests.length > 0 && (() => {
        const lastReq = requests[0]
        const remaining = lastReq?.tokensRemaining ?? cap
        return (
          <div className="card p-3">
            <div className="flex justify-between mb-1.5">
              <p className="font-mono text-[10px] text-ink-500">LIVE TOKEN BUCKET</p>
              <p className="font-mono text-[10px] text-ink-500">
                {remaining} / {cap}
              </p>
            </div>
            <GlowBar value={remaining} max={cap}
                     color={remaining <= 0 ? '#f87171' : '#c8f135'} />
          </div>
        )
      })()}

      {/* Request log */}
      <div className="card overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="px-3 py-2 border-b border-ink-700 flex items-center justify-between shrink-0">
          <p className="label">Request Log</p>
          <span className="font-mono text-[10px] text-ink-600">
            {requests.length > 0 ? `last ${Math.min(requests.length, 50)}` : 'waiting...'}
          </span>
        </div>
        <div className="overflow-y-auto flex-1">
          {requests.length === 0 && !running && (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <Zap size={16} className="text-ink-700" />
              <p className="font-mono text-[10px] text-ink-600">Hit Start to fire requests</p>
            </div>
          )}
          {requests.map(r => <RequestRow key={r.id} req={r} />)}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export — two panels side by side
// ─────────────────────────────────────────────────────────────────────────────

export default function DevTools() {
  const [config, setConfig] = useState(null)

  useEffect(() => {
    getRateLimitConfig().then(cfg => { if (cfg) setConfig(cfg) })
  }, [])

  return (
    <div className="min-h-screen grid-bg pt-14">
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Page header */}
        <div className="mb-8 fade-up fade-up-1">
          <p className="label mb-2">Developer Tools</p>
          <h1
            className="text-ink-50 leading-none"
            style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(2.5rem,6vw,4rem)' }}
          >
            Redis <span className="text-acid">Console</span>
            {' '}&{' '}
            Rate Limit <span className="text-red-400">Simulator</span>
          </h1>
        </div>

        {/* Two panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* Left — Redis Console */}
          <div className="card p-5 fade-up fade-up-2">
            <RedisPanel config={config} />
          </div>

          {/* Divider (desktop only) */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-ink-700 pointer-events-none" />

          {/* Right — Simulator */}
          <div className="card p-5 fade-up fade-up-3">
            <SimulatorPanel config={config} />
          </div>

        </div>
      </div>
    </div>
  )
}