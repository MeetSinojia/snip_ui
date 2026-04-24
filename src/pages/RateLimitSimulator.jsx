import { useState, useRef, useCallback } from 'react'
import { Zap, RotateCcw, Play, Square } from 'lucide-react'
import { simulateRequest, resetRateLimit } from '../api/client'

/**
 * RateLimitSimulator.jsx
 *
 * Fires rapid requests at /api/debug/simulate-request and visualises
 * each one as a live request log — green = allowed, red = 429 blocked.
 *
 * Place at: src/pages/RateLimitSimulator.jsx
 */

const SPEEDS = [
  { label: 'Slow',   ms: 600, desc: '~1.7 req/s' },
  { label: 'Normal', ms: 300, desc: '~3.3 req/s' },
  { label: 'Fast',   ms: 120, desc: '~8 req/s'   },
  { label: 'Burst',  ms: 40,  desc: '~25 req/s'  },
]

function RequestRow({ req, index }) {
  const allowed = req.allowed
  return (
    <div
      className={`flex items-center gap-3 px-4 py-2 border-b border-ink-800 last:border-0
        font-mono text-xs transition-all duration-200
        ${allowed ? 'bg-acid/5' : 'bg-red-500/8'}`}
      style={{ animationDelay: `${index * 10}ms` }}
    >
      {/* Status pill */}
      <span
        className={`shrink-0 w-12 text-center py-0.5 border font-mono text-[10px] tracking-widest
          ${allowed
            ? 'border-acid/40 text-acid bg-acid/10'
            : 'border-red-500/40 text-red-400 bg-red-500/10'
          }`}
      >
        {req.httpStatus}
      </span>

      {/* Message */}
      <span className={`flex-1 ${allowed ? 'text-ink-300' : 'text-red-300'}`}>
        {req.message ?? (allowed ? 'Request accepted' : 'Rate limit exceeded')}
      </span>

      {/* Tokens left */}
      <span className="text-ink-500 shrink-0">
        {req.tokensRemaining != null ? `${req.tokensRemaining} tkn` : '—'}
      </span>

      {/* Timestamp */}
      <span className="text-ink-600 shrink-0 tabular-nums w-20 text-right">
        {req.ts}
      </span>
    </div>
  )
}

export default function RateLimitSimulator() {
  const [requests, setRequests]   = useState([])
  const [running, setRunning]     = useState(false)
  const [speed, setSpeed]         = useState(SPEEDS[1])
  const [resetting, setResetting] = useState(false)
  const timerRef                  = useRef(null)
  const countRef                  = useRef(0)

  const allowed429 = requests.filter(r => r.allowed).length
  const blocked    = requests.filter(r => !r.allowed).length

  const fire = useCallback(async () => {
    const result = await simulateRequest()
    const ts = new Date().toLocaleTimeString('en-GB', { hour12: false })
    countRef.current += 1
    setRequests(prev => [
      { ...result, ts, id: countRef.current },
      ...prev.slice(0, 49), // keep last 50
    ])
  }, [])

  const start = () => {
    if (running) return
    setRunning(true)
    fire() // immediate first shot
    timerRef.current = setInterval(fire, speed.ms)
  }

  const stop = () => {
    clearInterval(timerRef.current)
    setRunning(false)
  }

  const handleReset = async () => {
    stop()
    setResetting(true)
    try {
      await resetRateLimit()
      setRequests([])
      countRef.current = 0
    } finally {
      setResetting(false)
    }
  }

  // Update interval speed on-the-fly
  const changeSpeed = (s) => {
    setSpeed(s)
    if (running) {
      clearInterval(timerRef.current)
      timerRef.current = setInterval(fire, s.ms)
    }
  }

  return (
    <div className="min-h-screen grid-bg pt-14">
      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="mb-10 fade-up fade-up-1">
          <div className="flex items-center gap-3 mb-3">
            <Zap size={14} className="text-acid" />
            <p className="label">RATE LIMIT SIMULATOR</p>
          </div>
          <h1
            className="text-ink-50 leading-none mb-4"
            style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(3rem,8vw,5.5rem)' }}
          >
            Trigger the{' '}
            <span className="text-red-400">429</span>
          </h1>
          <p className="text-ink-400 font-body text-sm max-w-md">
            Fire rapid requests at the backend and watch the token bucket drain in real time.
            Each request hits the real Spring Boot + Redis rate limiter.
          </p>
        </div>

        {/* Speed selector */}
        <div className="mb-6 fade-up fade-up-2">
          <p className="label mb-3">Request Speed</p>
          <div className="flex gap-2">
            {SPEEDS.map(s => (
              <button
                key={s.label}
                onClick={() => changeSpeed(s)}
                className={`font-mono text-xs px-4 py-2 border transition-colors
                  ${speed.label === s.label
                    ? 'border-acid text-acid bg-acid/10'
                    : 'border-ink-600 text-ink-400 hover:border-ink-400'
                  }`}
              >
                {s.label}
                <span className="ml-1.5 text-ink-500">{s.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mb-8 fade-up fade-up-2">
          {!running ? (
            <button
              onClick={start}
              className="btn-primary flex items-center gap-2"
            >
              <Play size={14} />
              Start Simulation
            </button>
          ) : (
            <button
              onClick={stop}
              className="font-mono text-xs px-5 py-3 border border-red-500/60 text-red-400
                         bg-red-500/10 hover:bg-red-500/20 transition-colors flex items-center gap-2"
            >
              <Square size={12} />
              Stop
            </button>
          )}

          <button
            onClick={handleReset}
            disabled={resetting}
            className="btn-ghost flex items-center gap-2 text-xs disabled:opacity-40"
          >
            <RotateCcw size={12} className={resetting ? 'animate-spin' : ''} />
            {resetting ? 'Resetting...' : 'Reset & Clear'}
          </button>
        </div>

        {/* Stats row */}
        {requests.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6 fade-up fade-up-2">
            <div className="card p-4 text-center">
              <p className="label mb-1">Total Sent</p>
              <p style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.8rem' }}
                 className="text-ink-50 leading-none">
                {requests.length}
              </p>
            </div>
            <div className="card p-4 text-center">
              <p className="label mb-1">Accepted</p>
              <p style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.8rem' }}
                 className="text-acid leading-none">
                {allowed429}
              </p>
            </div>
            <div className="card p-4 text-center">
              <p className="label mb-1">Blocked 429</p>
              <p style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.8rem' }}
                 className="text-red-400 leading-none">
                {blocked}
              </p>
            </div>
          </div>
        )}

        {/* Running indicator */}
        {running && (
          <div className="flex items-center gap-2 mb-4 font-mono text-xs text-acid">
            <span className="w-1.5 h-1.5 rounded-full bg-acid pulse-dot" />
            Firing at {speed.desc} — watch the tokens drain...
          </div>
        )}

        {/* Request log */}
        {requests.length > 0 && (
          <div className="card overflow-hidden fade-up fade-up-3">
            <div className="px-4 py-2 border-b border-ink-700 flex items-center justify-between">
              <p className="label">Request Log</p>
              <span className="font-mono text-xs text-ink-500">
                newest first · showing last {Math.min(requests.length, 50)}
              </span>
            </div>
            <div className="max-h-[480px] overflow-y-auto">
              {requests.map((r, i) => (
                <RequestRow key={r.id} req={r} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {requests.length === 0 && !running && (
          <div className="border border-dashed border-ink-700 p-16 text-center fade-up fade-up-4">
            <Zap size={20} className="text-ink-600 mx-auto mb-3" />
            <p className="font-mono text-xs text-ink-500">
              Hit <span className="text-acid">Start Simulation</span> to fire requests and trigger rate limiting.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}