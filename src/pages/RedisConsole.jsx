import { useState, useEffect, useCallback, useRef } from 'react'
import { Activity, Database, RefreshCw, Zap, Clock, Shield } from 'lucide-react'
import { getRateStatus, resetRateLimit } from '../api/client'

// ── Rate limit constants — mirrors application.yml ────────────────────────
// app.rate-limit.capacity: 10
// app.rate-limit.window-seconds: 60
const RATE_LIMIT = {
  capacity: 10,
  windowSeconds: 60,
}

function GlowBar({ value, max, color = '#c8f135' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="relative h-3 w-full bg-ink-700 overflow-hidden">
      <div
        className="absolute left-0 top-0 h-full transition-all duration-700 ease-out"
        style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}66, ${color})`,
          boxShadow: `0 0 12px ${color}66`,
        }}
      />
      {Array.from({ length: max - 1 }).map((_, i) => (
        <div
          key={i}
          className="absolute top-0 bottom-0 w-px bg-ink-900/60"
          style={{ left: `${((i + 1) / max) * 100}%` }}
        />
      ))}
    </div>
  )
}

function KeyRow({ label, value, mono = true, highlight }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-ink-700 last:border-0">
      <span className="font-mono text-xs text-ink-500 tracking-wider">{label}</span>
      <span className={`
        ${mono ? 'font-mono' : 'font-body'} text-xs text-right max-w-[55%] break-all
        ${highlight === 'acid' ? 'text-acid' : highlight === 'red' ? 'text-red-400' : 'text-ink-100'}
      `}>
        {value}
      </span>
    </div>
  )
}

function RefillCountdown({ ttlSeconds, windowSeconds, onExpire }) {
  const [countdown, setCountdown] = useState(ttlSeconds)

  useEffect(() => {
    setCountdown(ttlSeconds)
  }, [ttlSeconds])

  useEffect(() => {
    if (countdown <= 0) { onExpire?.(); return }
    const id = setTimeout(() => setCountdown(v => v - 1), 1000)
    return () => clearTimeout(id)
  }, [countdown, onExpire])

  const pct = Math.max(0, Math.min(100, (countdown / windowSeconds) * 100))
  const isLow = countdown <= 10

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={12} className="text-acid" />
        <p className="label">Token Refill Countdown</p>
      </div>

      <div className="flex items-end justify-between mb-4">
        <div>
          <p
            className="leading-none tabular-nums"
            style={{
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: '3.8rem',
              color: isLow ? '#c8f135' : '#6e6e6e',
            }}
          >
            {countdown}
            <span className="text-ink-500 text-xl ml-1">s</span>
          </p>
          <p className="font-mono text-xs text-ink-500 mt-1">
            {isLow
              ? '⚡ Refilling soon — tokens reset in moments'
              : `All ${windowSeconds - countdown}s elapsed · ${countdown}s until full refill`}
          </p>
        </div>
        <div className="text-right">
          <p className="label mb-1">Window</p>
          <p className="font-mono text-xs text-ink-200">{windowSeconds}s total</p>
        </div>
      </div>

      <div className="relative h-2 w-full bg-ink-700 overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full transition-all duration-1000"
          style={{
            width: `${pct}%`,
            background: isLow
              ? 'linear-gradient(90deg, #c8f13566, #c8f135)'
              : 'linear-gradient(90deg, #2a2a2a, #6e6e6e)',
            boxShadow: isLow ? '0 0 8px #c8f13566' : 'none',
          }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="font-mono text-[10px] text-ink-600">reset</span>
        <span className="font-mono text-[10px] text-ink-600">full refill →</span>
      </div>
    </div>
  )
}

export default function RedisConsole() {
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [resetting, setResetting] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getRateStatus()
      setData(res)
      setLastUpdated(new Date())
    } catch {
      setError('Cannot reach backend — is Spring Boot running?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(fetch, 2000)
    return () => clearInterval(id)
  }, [autoRefresh, fetch])

  const handleReset = async () => {
    setResetting(true)
    try {
      await resetRateLimit()
      await fetch()
    } catch {
      setError('Reset failed')
    } finally {
      setResetting(false)
    }
  }

  const tokensRemaining = data?.tokensRemaining ?? RATE_LIMIT.capacity
  const capacity        = data?.capacity        ?? RATE_LIMIT.capacity
  const used            = data?.tokensUsed      ?? 0
  const ttl             = data?.ttlSeconds      ?? RATE_LIMIT.windowSeconds
  const exceeded        = data?.limitExceeded   ?? false

  return (
    <div className="min-h-screen grid-bg pt-14">
      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="mb-10 fade-up fade-up-1">
          <div className="flex items-center gap-3 mb-3">
            <Database size={14} className="text-acid" />
            <p className="label">REDIS CONSOLE</p>
          </div>
          <h1
            className="text-ink-50 leading-none mb-4"
            style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(3rem,8vw,5.5rem)' }}
          >
            Live Key <span className="text-acid">Inspector</span>
          </h1>
          <p className="text-ink-400 font-body text-sm max-w-md">
            Real-time view of the Redis token-bucket. Updates every 2s.
          </p>
        </div>

        {/* Rate Limit Config */}
        <div className="mb-8 fade-up fade-up-1 border border-acid/20 bg-acid/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={12} className="text-acid" />
            <p className="label">Rate Limit Config</p>
            <span className="ml-auto font-mono text-[10px] text-ink-600">
              application.yml → app.rate-limit
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="label mb-1">Capacity</p>
              <p style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem' }}
                 className="text-acid leading-none">
                {RATE_LIMIT.capacity}
                <span className="text-ink-500 text-sm ml-1">tokens</span>
              </p>
            </div>
            <div>
              <p className="label mb-1">Window</p>
              <p style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem' }}
                 className="text-ink-50 leading-none">
                {RATE_LIMIT.windowSeconds}
                <span className="text-ink-500 text-sm ml-1">sec</span>
              </p>
            </div>
            <div>
              <p className="label mb-1">Refill Rate</p>
              <p style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem' }}
                 className="text-ink-50 leading-none">
                {RATE_LIMIT.capacity}
                <span className="text-ink-500 text-sm ml-1">/ min</span>
              </p>
            </div>
          </div>
          <p className="font-mono text-[10px] text-ink-600 mt-3 border-t border-ink-700/60 pt-3">
            strategy: fixed-window token bucket · storage: Redis · key prefix:{' '}
            <span className="text-acid">rate:</span>
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mb-8 fade-up fade-up-2">
          <button onClick={fetch} disabled={loading}
            className="btn-ghost flex items-center gap-2 text-xs">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setAutoRefresh(v => !v)}
            className={`font-mono text-xs px-4 py-2 border transition-colors
              ${autoRefresh
                ? 'border-acid text-acid bg-acid/10'
                : 'border-ink-600 text-ink-400 hover:border-ink-400'}`}
          >
            {autoRefresh ? '● LIVE' : '○ PAUSED'}
          </button>
          <button onClick={handleReset} disabled={resetting}
            className="font-mono text-xs px-4 py-2 border border-red-500/40 text-red-400
                       hover:border-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40">
            {resetting ? 'Resetting...' : 'Reset Bucket'}
          </button>
          {lastUpdated && (
            <span className="font-mono text-xs text-ink-600 ml-auto">
              {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>

        {error && (
          <div className="border border-red-500/30 bg-red-500/5 px-4 py-3 mb-6 font-mono text-xs text-red-400">
            ✕ {error}
          </div>
        )}

        {data && (
          <>
            {/* Status badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 mb-8 border font-mono text-xs tracking-widest fade-up fade-up-2
              ${exceeded
                ? 'border-red-500/50 text-red-400 bg-red-500/10'
                : 'border-acid/50 text-acid bg-acid/10'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${exceeded ? 'bg-red-400' : 'bg-acid'} ${!exceeded ? 'pulse-dot' : ''}`} />
              {exceeded ? 'RATE LIMITED — awaiting refill' : 'BUCKET ACTIVE'}
            </div>

            {/* Token bar */}
            <div className="card p-6 mb-4 fade-up fade-up-3">
              <div className="flex items-end justify-between mb-5">
                <div>
                  <p className="label mb-1">Tokens Remaining</p>
                  <p className="leading-none tabular-nums"
                     style={{
                       fontFamily: 'Bebas Neue, sans-serif',
                       fontSize: '5rem',
                       color: exceeded ? '#f87171' : '#c8f135',
                     }}>
                    {tokensRemaining}
                    <span className="text-ink-500 text-2xl"> / {capacity}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="label mb-1">Used</p>
                  <p className="text-ink-300 tabular-nums"
                     style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.8rem' }}>
                    {used}
                  </p>
                </div>
              </div>
              <GlowBar value={tokensRemaining} max={capacity}
                       color={exceeded ? '#f87171' : '#c8f135'} />
              <div className="flex justify-between mt-2">
                <span className="font-mono text-[10px] text-ink-600">0</span>
                <span className="font-mono text-[10px] text-ink-600">{capacity} (full)</span>
              </div>
            </div>

            {/* Countdown */}
            <div className="mb-4 fade-up fade-up-3">
              <RefillCountdown
                ttlSeconds={ttl}
                windowSeconds={RATE_LIMIT.windowSeconds}
                onExpire={fetch}
              />
            </div>

            {/* Key details */}
            <div className="card p-5 mb-6 fade-up fade-up-3">
              <div className="flex items-center gap-2 mb-4">
                <Activity size={12} className="text-acid" />
                <p className="label">Redis Key Details</p>
              </div>
              <KeyRow label="REDIS KEY"        value={data.redisKey} highlight="acid" />
              <KeyRow label="CLIENT IP"        value={data.ip} />
              <KeyRow label="TOKENS REMAINING" value={String(data.tokensRemaining)}
                      highlight={exceeded ? 'red' : 'acid'} />
              <KeyRow label="TOKENS USED"      value={String(data.tokensUsed)} />
              <KeyRow label="CAPACITY"         value={`${data.capacity} tokens`} />
              <KeyRow label="WINDOW"           value={`${data.windowSeconds}s`} />
              <KeyRow label="TTL (expires in)" value={`${data.ttlSeconds}s`} />
              <KeyRow label="BUCKET EXISTS"    value={String(data.bucketExists)} />
              <KeyRow label="STATUS"           value={data.limitExceeded ? '⛔  BLOCKED' : '✅  ALLOWED'} mono={false} />
            </div>

            {/* Explanation */}
            <div className="border border-dashed border-ink-700 p-6 fade-up fade-up-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={12} className="text-acid" />
                <p className="label">How Token Bucket Works</p>
              </div>
              <p className="font-body text-sm text-ink-400 leading-relaxed">
                Each IP starts with <span className="text-ink-100 font-mono">{capacity} tokens</span>.
                Every API request consumes one. At 0, requests return{' '}
                <span className="text-red-400 font-mono">HTTP 429</span> until the{' '}
                {RATE_LIMIT.windowSeconds}s window expires and the Redis key TTL resets —
                restoring all {capacity} tokens instantly.
              </p>
              <div className="mt-4 font-mono text-[10px] text-ink-600 space-y-1 border-t border-ink-700 pt-4">
                <p>capacity:       {RATE_LIMIT.capacity}   ← app.rate-limit.capacity</p>
                <p>window-seconds: {RATE_LIMIT.windowSeconds}   ← app.rate-limit.window-seconds</p>
                <p>redis key:      rate:{'<ip>'}  (TTL-based auto refill)</p>
              </div>
            </div>
          </>
        )}

        {!data && !error && (
          <div className="border border-dashed border-ink-700 p-16 text-center">
            <p className="font-mono text-xs text-ink-500 animate-pulse">Connecting to Redis...</p>
          </div>
        )}
      </div>
    </div>
  )
}