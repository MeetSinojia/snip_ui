import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar    from './components/Navbar'
import Home      from './pages/Home'
import Analytics from './pages/Analytics'
import DevTools  from './pages/DevTools'
import NotFound  from './pages/NotFound'

/**
 * App.jsx — UPDATED
 *
 * Changes vs original:
 *   • Imports DevTools (combined Redis Console + Rate Limit Simulator page)
 *   • Route /devtools added
 *   • No sidebar — navigation is in Navbar and Home page buttons
 *
 * Replace at: src/App.jsx
 */
export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"          element={<Home />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/devtools"  element={<DevTools />} />
        <Route path="*"          element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}