import { Check, Copy, ExternalLink, Trash2 } from 'lucide-react'
import { useClipboard } from '../hooks/useClipboard'
import { formatDateTime, truncateUrl } from '../utils/helpers'

export default function ResultCard({ result, onRemove }) {
  const { copied, copy } = useClipboard()

  return (
    <div className="card fade-up fade-up-1 p-6 relative overflow-hidden">
      {/* Acid left border accent */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-acid" />

      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p className="label mb-1">Short URL</p>
          <p
            className="text-acid font-mono text-2xl tracking-tight leading-none"
            style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem' }}
          >
            {result.shortUrl}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 mt-1">
          <button
            onClick={() => copy(result.shortUrl)}
            className="btn-ghost flex items-center gap-2"
            title="Copy short URL"
          >
            {copied ? <Check size={14} className="text-acid" /> : <Copy size={14} />}
            <span className="font-mono text-xs">{copied ? 'COPIED' : 'COPY'}</span>
          </button>

          <a
            href={result.shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost flex items-center gap-2"
            title="Open"
          >
            <ExternalLink size={14} />
          </a>

          {onRemove && (
            <button
              onClick={onRemove}
              className="btn-ghost flex items-center gap-2 hover:border-red-700 hover:text-red-500"
              title="Remove"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Original URL */}
      <div className="mb-4">
        <p className="label mb-1">Original URL</p>
        <p className="font-mono text-sm text-ink-300 break-all">
          {truncateUrl(result.originalUrl, 80)}
        </p>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-6 pt-4 border-t border-ink-700">
        <div>
          <p className="label mb-0.5">Code</p>
          <p className="font-mono text-xs text-ink-200">{result.shortCode}</p>
        </div>
        <div>
          <p className="label mb-0.5">Created</p>
          <p className="font-mono text-xs text-ink-200">{formatDateTime(result.createdAt)}</p>
        </div>
        <div>
          <p className="label mb-0.5">Expires</p>
          <p className="font-mono text-xs text-ink-200">{formatDateTime(result.expiresAt)}</p>
        </div>
      </div>
    </div>
  )
}
