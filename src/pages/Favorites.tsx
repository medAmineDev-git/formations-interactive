import { Link } from 'react-router-dom'
import { getLesson, getTech } from '../content/loader'
import { FavoriteButton, Inline } from '../components/ui'
import { useStore } from '../lib/store'

// Un favori est stocké sous la forme "lecon:<techId>/<id>" ou "question:<techId>/<id>"
function resolve(fav: string) {
  const [kind, path] = fav.split(':')
  const [techId, id] = path.split('/')
  const tech = getTech(techId)
  if (!tech) return null
  if (kind === 'lecon') {
    const lesson = getLesson(tech, id)
    return lesson && { fav, kind, tech, title: lesson.titre, to: `/t/${tech.id}/lecon/${lesson.id}` }
  }
  const q = tech.interview.find((q) => q.id === id)
  return q && { fav, kind, tech, title: q.question, to: `/t/${tech.id}/entretien/session/tout?q=${q.id}` }
}

export function Favorites() {
  const { favorites } = useStore()
  const items = favorites.map(resolve).filter((x) => !!x)
  const lessons = items.filter((i) => i.kind === 'lecon')
  const questions = items.filter((i) => i.kind === 'question')

  return (
    <>
      <h1 className="page-title">★ Favoris</h1>
      {items.length === 0 && (
        <p className="empty">Aucun favori pour l'instant. Cliquez sur ☆ à côté d'une leçon ou d'une question pour la retrouver ici.</p>
      )}
      {[
        { title: 'Leçons', list: lessons },
        { title: "Questions d'entretien", list: questions },
      ]
        .filter((g) => g.list.length > 0)
        .map((g) => (
          <section key={g.title} className="level">
            <h2 className="level__title">{g.title}</h2>
            <ul className="lesson-list">
              {g.list.map((i) => (
                <li key={i.fav}>
                  <Link to={i.to} className="lesson-row">
                    <span className="status">{i.tech.icone}</span>
                    <span className="lesson-row__title">
                      <Inline source={i.title} />
                    </span>
                    <span className="muted small">{i.tech.nom}</span>
                    <FavoriteButton fav={i.fav} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
    </>
  )
}
