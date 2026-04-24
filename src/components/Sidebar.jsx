import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Database, Zap, ChevronRight, X, Activity } from 'lucide-react'

/**
 * Sidebar.jsx
 *
 * Collapsible right-side panel on the Home page.
 * Two entries:
 *   • Redis Console  → navigates to /redis-console
 *   • Rate Limit Sim → navigates to /rate-limit-sim
 *
 * Place at: src/components/Sidebar.jsx
 */

const ITEMS = [
  {
    icon: Database,
    label: 'Redis Console',
    desc: 'Inspect live key state',
    path: '/redis-console',
    accent: '#c8f135',
  },
  {
    icon: Zap,
    label: 'Rate Limit Sim',
    desc: 'Trigger 429s visually',
    path: '/rate-limit-sim',
    accent: '#f87171',
  },
]

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <>
      {/* Toggle tab — always visible on right edge */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Open dev tools sidebar"
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-40
          flex flex-col items-center gap-2 px-1.5 py-4
          border-l border-t border-b border-ink-600 bg-ink-800
          hover:border-acid hover:text-acid transition-all duration-200
          ${open ? 'border-acid text-acid' : 'text-ink-400'}`}
        style={{ writingMode: 'vertical-lr' }}
      >
        <Activity size={13} />
        <span className="font-mono text-[10px] tracking-widest uppercase" style={{ writingMode: 'vertical-lr' }}>
          Dev Tools
        </span>
        <ChevronRight
          size={12}
          className={`transition-transform duration-300 ${open ? 'rotate-0' : 'rotate-180'}`}
          style={{ writingMode: 'horizontal-tb' }}
        />
      </button>

      {/* Sidebar drawer */}
      <div
        className={`fixed right-0 top-14 bottom-0 z-30 w-64
          bg-ink-800/95 backdrop-blur-sm border-l border-ink-600
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-700">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-acid pulse-dot" />
            <p className="font-mono text-xs tracking-widest text-ink-300 uppercase">Dev Tools</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-ink-500 hover:text-ink-200 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Items */}
        <div className="p-4 flex flex-col gap-3">
          {ITEMS.map(({ icon: Icon, label, desc, path, accent }) => (
            <button
              key={path}
              onClick={() => { navigate(path); setOpen(false) }}
              className="group w-full text-left card p-4 hover:border-ink-400
                         transition-all duration-200 relative overflow-hidden"
            >
              {/* Accent stripe */}
              <div
                className="absolute left-0 top-0 bottom-0 w-0.5 opacity-60 group-hover:opacity-100 transition-opacity"
                style={{ background: accent }}
              />

              <div className="flex items-start gap-3 pl-3">
                <div
                  className="mt-0.5 p-1.5 rounded"
                  style={{ background: `${accent}18` }}
                >
                  <Icon size={13} style={{ color: accent }} />
                </div>
                <div>
                  <p className="font-mono text-xs text-ink-100 mb-0.5 tracking-wide">{label}</p>
                  <p className="font-body text-xs text-ink-500">{desc}</p>
                </div>
                <ChevronRight
                  size={12}
                  className="ml-auto mt-1 text-ink-600 group-hover:text-ink-300
                             group-hover:translate-x-0.5 transition-all"
                />
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 px-5 py-4 border-t border-ink-700">
          <p className="font-mono text-[10px] text-ink-600 leading-relaxed">
            Spring Boot · Redis · Token Bucket<br />
            Rate limit: 10 req / 60s per IP
          </p>
        </div>
      </div>

      {/* Backdrop on mobile */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-ink-900/60 backdrop-blur-[1px] md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  )
}