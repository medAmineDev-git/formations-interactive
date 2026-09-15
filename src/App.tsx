import { useEffect } from 'react'
import { HashRouter, Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { techs } from './content/loader'
import { dueTerms } from './lib/progress'
import { useStore } from './lib/store'
import { Home } from './pages/Home'
import { TechPage } from './pages/TechPage'
import { LessonPage } from './pages/LessonPage'
import { InterviewSession } from './pages/InterviewSession'
import { Favorites } from './pages/Favorites'
import { Glossary } from './pages/Glossary'

function ScrollToTop() {
  const { pathname, search } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname, search])
  return null
}

function Header() {
  const state = useStore()
  const due = dueTerms(techs, state).length
  return (
    <header className="topbar">
      <div className="topbar__inner">
        <Link to="/" className="brand">
          <span className="brand__logo">🎓</span> Formations
        </Link>
        <nav className="topnav">
          <NavLink to="/favoris">★ Favoris</NavLink>
          <NavLink to="/glossaire">
            Glossaire {due > 0 && <span className="badge">{due}</span>}
          </NavLink>
        </nav>
      </div>
    </header>
  )
}

export default function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/t/:techId" element={<TechPage />} />
          <Route path="/t/:techId/:tab" element={<TechPage />} />
          <Route path="/t/:techId/lecon/:lessonId" element={<LessonPage />} />
          <Route path="/t/:techId/entretien/session/:mode" element={<InterviewSession />} />
          <Route path="/favoris" element={<Favorites />} />
          <Route path="/glossaire" element={<Glossary />} />
          <Route path="*" element={<p className="empty">Page introuvable. <Link to="/">Retour à l'accueil</Link></p>} />
        </Routes>
      </main>
    </HashRouter>
  )
}
