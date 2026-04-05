import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Loader2, TrendingUp, Clock, Link2 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { getAnalytics } from '../api/client'
import { formatDate, formatDateTime, isExpired, extractShortCode, truncateUrl } from '../utils/helpers'

// Mock click trend data (real implementation would need a separate endpoint)
const generateTrendData = (totalClicks) => {
  const days = 7
  const data = []
  let remaining = totalClicks

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const clicks = i === 0 ? remaining : Math.floor(Math.random() * (remaining / (i + 1)) * 1.5)
    remaining = Math.max(0, remaining - clicks)
    data.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      clicks: Math.max(0, clicks),
    })
  }
  return data
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-ink-800 border border-ink-600 px-3 py-2">
      <p className="font-mono text-xs text-ink-400">{label}</p>
      <p className="font-mono text-sm text-acid">{payload[0].value} clicks</p>
    </div>
  )
}

export default function Analytics() {
  const [searchParams]            = useSearchParams()
  const [code, setCode]           = useState(searchParams.get('code') || '')
  const [inputVal, setInputVal]   = useState(searchParams.get('code') || '')
  const [data, setData]           = useState(null)
  const [trendData, setTrendData] = useState([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  // Auto-fetch if code in URL params
  useEffect(() => {
    if (code) fetchAnalytics(code)
  }, [])

  const fetchAnalytics = async (shortCode) => {
    const cleaned = extractShortCode(shortCode)
    if (!cleaned) return

    setLoading(true)
    setError('')
    setData(null)

    try {
      const result = await getAnalytics(cleaned)
      setData(result)
      setTrendData(generateTrendData(result.totalClicks))
    } catch (err) {
      setError(err.response?.status === 404
        ? `No URL found for code "${cleaned}"`
        : 'Failed to fetch analytics. Is the backend running?'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setCode(inputVal)
    fetchAnalytics(inputVal)
  }

  const expired = data ? isExpired(data.expiresAt) : false

  return (
    <div className="min-h-screen grid-bg pt-14">
      <div className="max-w-3xl mx-auto px-6 py-20">

        {/* Header */}
        <div className="mb-12 fade-up fade-up-1">
          <p className="label mb-3">Analytics Dashboard</p>
          <h1
            className="text-ink-50 leading-none mb-4"
            style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(3rem, 8vw, 5.5rem)' }}
          >
            Track your <span className="text-acid">links.</span>
          </h1>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-0 mb-10 fade-up fade-up-2">
          <input
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            placeholder="Enter short code or full short URL..."
            className="input-base flex-1"
          />
          <button
            type="submit"
            disabled={loading || !inputVal.trim()}
            className="btn-primary flex items-center gap-2 disabled:opacity-40"
          >
            {loading
              ? <Loader2 size={16} className="animate-spin" />
              : <><Search size={14} /> FETCH</>
            }
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="card border-red-900 p-5 mb-8 fade-up fade-up-1">
            <p className="font-mono text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Analytics result */}
        {data && (
          <div className="space-y-4 fade-up fade-up-1">

            {/* Status bar */}
            <div className="flex items-center justify-between py-2 px-4 bg-ink-800 border border-ink-600">
              <span className="font-mono text-xs text-ink-400">
                CODE: <span className="text-acid">{data.shortCode}</span>
              </span>
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${expired ? 'bg-red-500' : 'bg-acid'}`} />
                <span className={`font-mono text-xs ${expired ? 'text-red-400' : 'text-acid'}`}>
                  {expired ? 'EXPIRED' : 'ACTIVE'}
                </span>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-px bg-ink-700">
              <div className="bg-ink-900 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={12} className="text-acid" />
                  <p className="label">Total Clicks</p>
                </div>
                <p className="stat-val">{data.totalClicks.toLocaleString()}</p>
              </div>

              <div className="bg-ink-900 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={12} className="text-acid" />
                  <p className="label">Created</p>
                </div>
                <p className="font-mono text-sm text-ink-100 mt-1">{formatDate(data.createdAt)}</p>
                <p className="font-mono text-xs text-ink-500 mt-1">{formatDateTime(data.createdAt)}</p>
              </div>

              <div className="bg-ink-900 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={12} className={expired ? 'text-red-500' : 'text-acid'} />
                  <p className="label">Expires</p>
                </div>
                <p className={`font-mono text-sm mt-1 ${expired ? 'text-red-400' : 'text-ink-100'}`}>
                  {formatDate(data.expiresAt)}
                </p>
                <p className="font-mono text-xs text-ink-500 mt-1">{formatDateTime(data.expiresAt)}</p>
              </div>
            </div>

            {/* Original URL */}
            <div className="card p-5">
              <div className="flex items-start gap-3">
                <Link2 size={14} className="text-acid mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="label mb-1">Original URL</p>
                  <a
                    href={data.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm text-ink-200 break-all hover:text-acid transition-colors"
                  >
                    {data.originalUrl}
                  </a>
                </div>
              </div>
            </div>

            {/* Click trend chart */}
            {data.totalClicks > 0 && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <p className="label">Click trend — last 7 days</p>
                  <p className="font-mono text-xs text-ink-500">(estimated distribution)</p>
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={trendData}>
                    <XAxis
                      dataKey="date"
                      tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: '#6e6e6e' }}
                      axisLine={{ stroke: '#2a2a2a' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: '#6e6e6e' }}
                      axisLine={false}
                      tickLine={false}
                      width={30}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="clicks"
                      stroke="#c8f135"
                      strokeWidth={1.5}
                      dot={{ fill: '#c8f135', r: 3, strokeWidth: 0 }}
                      activeDot={{ fill: '#c8f135', r: 5, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Zero clicks state */}
            {data.totalClicks === 0 && (
              <div className="card p-8 text-center">
                <p className="font-mono text-xs text-ink-500">
                  No clicks recorded yet. Share the link to start tracking.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!data && !loading && !error && (
          <div className="border border-dashed border-ink-700 p-16 text-center fade-up fade-up-3">
            <p className="label mb-2">No data loaded</p>
            <p className="font-mono text-xs text-ink-500">
              Enter a short code above to view analytics.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
