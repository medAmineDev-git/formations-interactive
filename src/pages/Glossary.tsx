import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { techs } from '../content/loader'
import { Markdown } from '../components/ui'
import { dueTerms, glossary, type GlossaryEntry } from '../lib/progress'
import { reviewCard, useStore } from '../lib/store'

export function Glossary() {
  const [tab, setTab] = useState<'reviser' | 'liste'>('reviser')
  return (
    <>
      <h1 className="page-title">🧠 Glossaire</h1>
      <nav className="tabs">
        <button className={tab === 'reviser' ? 'active' : ''} onClick={() => setTab('reviser')}>
          Réviser
        </button>
        <button className={tab === 'liste' ? 'active' : ''} onClick={() => setTab('liste')}>
          Tous les termes
        </button>
      </nav>
      {tab === 'reviser' ? <Review /> : <TermList />}
    </>
  )
}

function Review() {
  const state = useStore()
  // File de révision figée au démarrage ; un terme raté repasse en fin de file
  const [queue, setQueue] = useState<GlossaryEntry[]>(() => dueTerms(techs, state))
  const [revealed, setRevealed] = useState(false)
  const [reviewed, setReviewed] = useState(0)

  if (queue.length === 0) {
    const visitedAny = Object.keys(state.visited).length > 0
    return (
      <div className="empty-state">
        {reviewed > 0 ? (
          <p>🎉 Révision terminée : {reviewed} carte(s) revue(s). Les termes reviendront au bon moment.</p>
        ) : visitedAny ? (
          <p>Rien à réviser aujourd'hui. Revenez demain !</p>
        ) : (
          <p>Ouvrez une leçon : ses termes seront ajoutés automatiquement à vos révisions.</p>
        )}
      </div>
    )
  }

  const [current, ...rest] = queue
  const answer = (known: boolean) => {
    reviewCard(current.key, known)
    setReviewed((n) => n + 1)
    setRevealed(false)
    setQueue(known ? rest : [...rest, current])
  }

  return (
    <div className="flashcard-wrap">
      <p className="muted center">{queue.length} carte(s) restante(s)</p>
      <div className="flashcard" style={{ '--accent': current.tech.couleur } as CSSProperties}>
        <div className="flashcard__tech">
          {current.tech.icone} {current.tech.nom} · {current.lesson.titre}
        </div>
        <div className="flashcard__term">{current.term.terme}</div>
        {revealed ? (
          <>
            <Markdown source={current.term.definition} className="flashcard__def" />
            <div className="self-eval">
              <button className="btn btn--ok" onClick={() => answer(true)}>
                ✓ Je savais
              </button>
              <button className="btn btn--review" onClick={() => answer(false)}>
                ↻ À revoir
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="muted">Pouvez-vous expliquer ce terme ?</p>
            <button className="btn" onClick={() => setRevealed(true)}>
              Afficher la définition
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function TermList() {
  const [search, setSearch] = useState('')
  const needle = search.trim().toLowerCase()
  const entries = glossary(techs)
    .filter((e) => !needle || e.term.terme.toLowerCase().includes(needle) || e.term.definition.toLowerCase().includes(needle))
    .sort((a, b) => a.term.terme.localeCompare(b.term.terme, 'fr'))

  return (
    <>
      <input className="search" placeholder="Rechercher un terme…" value={search} onChange={(e) => setSearch(e.target.value)} />
      {entries.length === 0 && <p className="empty">Aucun terme trouvé.</p>}
      <dl className="terms terms--list">
        {entries.map((e) => (
          <div key={e.key} className="terms__item">
            <dt>
              {e.term.terme}
              <Link to={`/t/${e.tech.id}/lecon/${e.lesson.id}`} className="terms__source">
                {e.tech.icone} {e.lesson.titre}
              </Link>
            </dt>
            <dd>
              <Markdown source={e.term.definition} />
            </dd>
          </div>
        ))}
      </dl>
    </>
  )
}
