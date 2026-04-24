import { useState, useRef, useEffect } from 'react'
import { ArrowRight, Loader2, Shield } from 'lucide-react'
import ResultCard from '../components/ResultCard'
import HistoryRow from '../components/HistoryRow'
import {
  shortenUrl,
  addToHistory,
  getHistory,
  removeFromHistory,
  getRateLimitConfig
} from '../api/client'

const EXPIRY_OPTIONS = [
  { label: '1 hour', value: 1 },
  { label: '24 hours', value: 24 },
  { label: '7 days', value: 168 },
  { label: '30 days', value: 720 },
]

export default function Home() {
  const [url, setUrl] = useState('')
  const [expiry, setExpiry] = useState(24)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState(getHistory)
  const [rateConfig, setRateConfig] = useState(null)

  const inputRef = useRef(null)

  // ✅ Fetch backend config
  useEffect(() => {
    getRateLimitConfig().then(cfg => {
      if (cfg) setRateConfig(cfg)
    })
  }, [])

  const handleShorten = async (e) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const data = await shortenUrl(url.trim(), expiry)
      setResult(data)
      addToHistory(data)
      setHistory(getHistory())
      setUrl('')
    } catch (err) {
      setError(
        err.response?.data?.errors?.[0] ||
        err.response?.data?.message ||
        'Failed to shorten URL. Is the backend running?'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = (shortCode) => {
    removeFromHistory(shortCode)
    setHistory(getHistory())
  }

  return (
    <div className="min-h-screen grid-bg pt-14">
      <div className="max-w-3xl mx-auto px-6 py-20">

        {/* Hero */}
        <div className="mb-14">
          <p className="label mb-3">URL SHORTENER / v1.0</p>
          <h1 className="text-ink-50 leading-none mb-4"
              style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(4rem, 10vw, 7rem)' }}>
            Make it <span className="text-acid">short.</span>
          </h1>
          <p className="text-ink-400 text-base max-w-md">
            Paste a long URL. Get a clean short link with analytics built in.
            Powered by Spring Boot + Redis.
          </p>
        </div>

        {/* ✅ Dynamic Rate Limit Banner */}
        <div className="mb-10 border border-ink-700 bg-ink-800/40 p-4 flex items-start gap-3">
          <Shield size={14} className="text-acid mt-0.5 shrink-0" />
          <div>
            <p className="font-mono text-xs text-ink-200 mb-1">RATE LIMIT ACTIVE</p>
            <p className="text-xs text-ink-400 leading-relaxed">
              This API enforces a token-bucket:{' '}
              <span className="text-acid font-mono">
                {rateConfig
                  ? `${rateConfig.capacity} requests per ${rateConfig.windowSeconds} seconds`
                  : 'Loading...'}
              </span>
              . Tokens refill automatically after the window resets.
              Exceed it and you'll get{' '}
              <span className="text-red-400 font-mono">HTTP 429</span>.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleShorten} className="mb-10">
          <div className="flex flex-col sm:flex-row gap-0">
            <input
              ref={inputRef}
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://your-very-long-url.com"
              className="input-base flex-1"
              required
            />
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="btn-primary flex items-center justify-center gap-2 min-w-[120px]"
            >
              {loading
                ? <Loader2 size={16} className="animate-spin" />
                : <>SNIP <ArrowRight size={14} /></>}
            </button>
          </div>

          <div className="flex items-center gap-4 mt-3">
            <span className="label">Expires in</span>
            <div className="flex gap-2">
              {EXPIRY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setExpiry(opt.value)}
                  className={`font-mono text-xs px-3 py-1 border
                    ${expiry === opt.value
                      ? 'border-acid text-acid'
                      : 'border-ink-600 text-ink-400'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 mt-3">
              ✕ {error}
            </p>
          )}
        </form>

        {result && <ResultCard result={result} />}

        {history.length > 0 && (
          <div className="mt-10">
            <p className="label mb-3">Recent Links</p>
            <div className="card">
              {history.map(item => (
                <HistoryRow key={item.shortCode} item={item} onRemove={handleRemove} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}