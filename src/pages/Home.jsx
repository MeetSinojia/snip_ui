import { useState, useRef } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'
import ResultCard from '../components/ResultCard'
import HistoryRow from '../components/HistoryRow'
import { shortenUrl, addToHistory, getHistory, removeFromHistory } from '../api/client'

const EXPIRY_OPTIONS = [
  { label: '1 hour',   value: 1 },
  { label: '24 hours', value: 24 },
  { label: '7 days',   value: 168 },
  { label: '30 days',  value: 720 },
]

export default function Home() {
  const [url, setUrl]           = useState('')
  const [expiry, setExpiry]     = useState(24)
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [history, setHistory]   = useState(getHistory)
  const inputRef                = useRef(null)

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
      const msg = err.response?.data?.errors?.[0]
        || err.response?.data?.message
        || 'Failed to shorten URL. Is the backend running?'
      setError(msg)
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
        <div className="mb-14 fade-up fade-up-1">
          <p className="label mb-3">URL SHORTENER / v1.0</p>
          <h1
            className="text-ink-50 leading-none mb-4"
            style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(4rem, 10vw, 7rem)' }}
          >
            Make it <span className="text-acid">short.</span>
          </h1>
          <p className="text-ink-400 font-body text-base max-w-md">
            Paste a long URL. Get a clean short link with analytics built in.
            Powered by Spring Boot + Redis.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleShorten} className="mb-10 fade-up fade-up-2">
          <div className="flex flex-col sm:flex-row gap-0">
            <input
              ref={inputRef}
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://your-very-long-url.com/paste/it/here"
              className="input-base flex-1"
              required
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="btn-primary flex items-center justify-center gap-2 min-w-[120px]
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading
                ? <Loader2 size={16} className="animate-spin" />
                : <>SNIP <ArrowRight size={14} /></>
              }
            </button>
          </div>

          {/* Expiry selector */}
          <div className="flex items-center gap-4 mt-3">
            <span className="label">Expires in</span>
            <div className="flex gap-2">
              {EXPIRY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setExpiry(opt.value)}
                  className={`font-mono text-xs px-3 py-1 border transition-colors
                    ${expiry === opt.value
                      ? 'border-acid text-acid bg-acid/10'
                      : 'border-ink-600 text-ink-400 hover:border-ink-400'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="font-mono text-xs text-red-400 mt-3 flex items-center gap-2">
              <span className="text-red-500">✕</span> {error}
            </p>
          )}
        </form>

        {/* Result */}
        {result && (
          <div className="mb-10">
            <ResultCard result={result} />
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="fade-up fade-up-3">
            <div className="flex items-center justify-between mb-3">
              <p className="label">Recent Links</p>
              <span className="font-mono text-xs text-ink-500">{history.length} links</span>
            </div>
            <div className="card overflow-hidden">
              {history.map(item => (
                <HistoryRow
                  key={item.shortCode}
                  item={item}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {history.length === 0 && !result && (
          <div className="border border-dashed border-ink-700 p-10 text-center fade-up fade-up-4">
            <p className="font-mono text-xs text-ink-500">
              No links yet — paste a URL above to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
