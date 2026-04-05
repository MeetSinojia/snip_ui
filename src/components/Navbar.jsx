import { Link, useLocation } from 'react-router-dom'

const navLinks = [
  { path: '/',          label: 'Shorten' },
  { path: '/analytics', label: 'Analytics' },
]

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-ink-700 bg-ink-900/90 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <span
            className="text-3xl leading-none text-acid"
            style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}
          >
            SNIP
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-acid pulse-dot" />
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {navLinks.map(({ path, label }) => {
            const active = pathname === path
            return (
              <Link
                key={path}
                to={path}
                className={`font-mono text-xs tracking-widest uppercase px-4 py-2 transition-colors duration-150
                  ${active
                    ? 'text-acid border-b border-acid'
                    : 'text-ink-400 hover:text-ink-100'
                  }`}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-acid" />
          <span className="font-mono text-xs text-ink-400">API LIVE</span>
        </div>
      </div>
    </header>
  )
}
