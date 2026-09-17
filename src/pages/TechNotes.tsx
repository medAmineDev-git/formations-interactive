import { Link } from 'react-router-dom'
import type { Tech } from '../content/types'
import { Markdown } from '../components/ui'
import { downloadNotes, notesToMarkdown, techNotes } from '../lib/notes'
import { useStore } from '../lib/store'

export function NotesTab({ tech }: { tech: Tech }) {
  const state = useStore()
  const notes = techNotes(tech, state)

  if (notes.length === 0) {
    return (
      <p className="empty">
        Aucune note pour cette formation. Ouvrez une leçon et écrivez dans le bloc-notes 📝 à droite : tout se retrouve ici.
      </p>
    )
  }

  const copier = () => navigator.clipboard?.writeText(notesToMarkdown(tech, notes))
  let chapitre = ''

  return (
    <>
      <div className="row row--between">
        <span className="muted small">
          {notes.length} note(s) · enregistrées dans ce navigateur
        </span>
        <span className="row" style={{ marginTop: 0 }}>
          <button className="btn btn--small btn--ghost" onClick={copier}>
            Copier
          </button>
          <button className="btn btn--small" onClick={() => downloadNotes(tech, notes)}>
            ⬇ Exporter {tech.id}-notes.md
          </button>
        </span>
      </div>

      {notes.map((n) => {
        const nouveauChapitre = n.chapitre !== chapitre
        if (nouveauChapitre) chapitre = n.chapitre
        return (
          <section key={n.key}>
            {nouveauChapitre && <h2 className="level__title" style={{ marginTop: 28 }}>{n.chapitre}</h2>}
            <article className="card card--note">
              <div className="row row--between" style={{ marginTop: 0 }}>
                <h3 style={{ margin: 0 }}>{n.lesson.titre}</h3>
                <Link to={`/t/${tech.id}/lecon/${n.lesson.id}`} className="small">
                  Ouvrir la leçon →
                </Link>
              </div>
              <Markdown source={n.texte} />
            </article>
          </section>
        )
      })}
    </>
  )
}
