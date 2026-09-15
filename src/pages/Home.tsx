import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { techs } from '../content/loader'
import { ProgressBar } from '../components/ui'
import { dueTerms, interviewProgress, learnProgress, percent } from '../lib/progress'
import { useStore } from '../lib/store'

// Technologies prévues, affichées en « bientôt » tant que leur contenu n'existe pas
const UPCOMING = [
  { nom: 'Java', icone: '☕' },
  { nom: 'Angular', icone: '🅰️' },
]

export function Home() {
  const state = useStore()
  const due = dueTerms(techs, state).length

  return (
    <>
      <section className="hero">
        <h1>Mes formations</h1>
        <p>Un parcours d'apprentissage et une préparation aux entretiens, pour chaque technologie.</p>
      </section>

      {due > 0 && (
        <Link to="/glossaire" className="banner">
          <span>🧠</span>
          <span>
            <strong>{due} terme{due > 1 ? 's' : ''} à réviser</strong> aujourd'hui
          </span>
          <span className="banner__cta">Réviser →</span>
        </Link>
      )}

      <div className="grid">
        {techs.map((tech) => {
          const learn = learnProgress(tech, state)
          const interview = interviewProgress(tech, state)
          return (
            <Link key={tech.id} to={`/t/${tech.id}`} className="tech-card" style={{ '--accent': tech.couleur } as CSSProperties}>
              <div className="tech-card__head">
                <span className="tech-card__icon">{tech.icone}</span>
                <h2>{tech.nom}</h2>
              </div>
              <p className="muted">{tech.description}</p>
              <div className="tech-card__stat">
                <span>Apprentissage</span>
                <strong>{percent(learn)} %</strong>
              </div>
              <ProgressBar levels={learn} compact />
              <div className="tech-card__stat">
                <span>Entretien</span>
                <strong>{percent(interview)} %</strong>
              </div>
              <ProgressBar levels={interview} compact />
            </Link>
          )
        })}

        {UPCOMING.map((t) => (
          <div key={t.nom} className="tech-card tech-card--soon">
            <div className="tech-card__head">
              <span className="tech-card__icon">{t.icone}</span>
              <h2>{t.nom}</h2>
            </div>
            <p className="muted">Bientôt disponible</p>
          </div>
        ))}
      </div>
    </>
  )
}
