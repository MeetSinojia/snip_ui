import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen grid-bg pt-14 flex items-center justify-center">
      <div className="text-center px-6">

        {/* Giant 404 */}
        <p
          className="leading-none text-ink-800 select-none mb-2"
          style={{
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: 'clamp(8rem, 30vw, 18rem)',
            WebkitTextStroke: '1px #2a2a2a',
          }}
        >
          404
        </p>

        <div className="-mt-8 relative z-10">
          <p
            className="text-acid mb-3 leading-none"
            style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.5rem' }}
          >
            Link not found.
          </p>
          <p className="font-mono text-xs text-ink-400 mb-8 max-w-sm mx-auto">
            This short code doesn't exist or the link has expired.
            Check the code and try again.
          </p>
          <Link to="/" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft size={14} /> Back to Shortener
          </Link>
        </div>

      </div>
    </div>
  )
}
