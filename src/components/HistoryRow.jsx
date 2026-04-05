import { Copy, Check, ExternalLink, BarChart2, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useClipboard } from '../hooks/useClipboard'
import { truncateUrl, isExpired, formatDate } from '../utils/helpers'

export default function HistoryRow({ item, onRemove }) {
  const { copied, copy } = useClipboard()
  const navigate          = useNavigate()
  const expired           = isExpired(item.expiresAt)

  return (
    <div className={`flex items-center gap-4 py-3 px-4 border-b border-ink-700 group
      transition-colors hover:bg-ink-700/30 ${expired ? 'opacity-50' : ''}`}>

      {/* Status dot */}
      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${expired ? 'bg-red-600' : 'bg-acid'}`} />

      {/* Code + URL */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-acid shrink-0">{item.shortCode}</span>
          <span className="text-ink-400 font-mono text-xs hidden sm:block">→</span>
          <span className="font-mono text-xs text-ink-300 truncate hidden sm:block">
            {truncateUrl(item.originalUrl, 50)}
          </span>
        </div>
        <p className="font-mono text-xs text-ink-500 mt-0.5">
          {expired ? 'Expired' : `Expires ${formatDate(item.expiresAt)}`}
        </p>
      </div>

      {/* Actions — visible on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => copy(item.shortUrl)}
          className="p-1.5 text-ink-400 hover:text-acid transition-colors"
          title="Copy"
        >
          {copied ? <Check size={13} className="text-acid" /> : <Copy size={13} />}
        </button>

        <a
          href={item.shortUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 text-ink-400 hover:text-acid transition-colors"
          title="Open"
        >
          <ExternalLink size={13} />
        </a>

        <button
          onClick={() => navigate(`/analytics?code=${item.shortCode}`)}
          className="p-1.5 text-ink-400 hover:text-acid transition-colors"
          title="Analytics"
        >
          <BarChart2 size={13} />
        </button>

        <button
          onClick={() => onRemove(item.shortCode)}
          className="p-1.5 text-ink-400 hover:text-red-500 transition-colors"
          title="Remove"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}
