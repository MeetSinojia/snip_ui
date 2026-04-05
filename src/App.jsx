import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar    from './components/Navbar'
import Home      from './pages/Home'
import Analytics from './pages/Analytics'
import NotFound  from './pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"          element={<Home />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="*"          element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
