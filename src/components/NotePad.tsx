import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { setNote, useStore } from '../lib/store'

const OPEN_KEY = 'formations:notepad-ouvert'

/**
 * Bloc-notes affiché à droite de la leçon. Le texte est enregistré dans le
 * navigateur (localStorage) peu après la frappe ; « Notes » regroupe tout par formation.
 */
export function NotePad({ noteKey, techId }: { noteKey: string; techId: string }) {
  const { notes } = useStore()
  const saved = notes[noteKey] ?? ''
  const [open, setOpen] = useState(() => localStorage.getItem(OPEN_KEY) !== 'non')
  const [texte, setTexte] = useState(saved)
  const [enregistre, setEnregistre] = useState(false)
  const première = useRef(true)
  const zone = useRef<HTMLTextAreaElement>(null)

  /** Curseur à la fin et vue calée en bas : on écrit à la suite sans faire défiler à la main. */
  const allerÀLaFin = (focus = true) => {
    const el = zone.current
    if (!el) return
    if (focus) el.focus()
    el.selectionStart = el.selectionEnd = el.value.length
    el.scrollTop = el.scrollHeight
  }

  /** Nouvelle entrée : une ligne vide à la suite, curseur prêt. */
  const ajouterEntrée = () => {
    setTexte((t) => (t.trimEnd() ? `${t.trimEnd()}

` : t))
    requestAnimationFrame(() => allerÀLaFin())
  }

  // Changement de leçon : on repart de la note enregistrée.
  useEffect(() => {
    setTexte(saved)
    première.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteKey])

  // À l'ouverture (et à chaque leçon), on montre la fin de la note : la suite s'écrit là.
  useEffect(() => {
    if (open) requestAnimationFrame(() => allerÀLaFin(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, noteKey])

  // Enregistrement différé : on n'écrit pas à chaque touche.
  useEffect(() => {
    if (première.current) {
      première.current = false
      return
    }
    const id = setTimeout(() => {
      setNote(noteKey, texte)
      setEnregistre(true)
    }, 500)
    return () => clearTimeout(id)
  }, [texte, noteKey])

  useEffect(() => {
    if (!enregistre) return
    const id = setTimeout(() => setEnregistre(false), 1500)
    return () => clearTimeout(id)
  }, [enregistre])

  const basculer = () => {
    setOpen((o) => {
      localStorage.setItem(OPEN_KEY, o ? 'non' : 'oui')
      return !o
    })
  }

  if (!open) {
    return (
      <button className="notepad-tab" onClick={basculer} title="Ouvrir le bloc-notes">
        📝 <span>Note{saved.trim() ? ' •' : ''}</span>
      </button>
    )
  }

  return (
    <aside className="notepad" aria-label="Bloc-notes de la leçon">
      <div className="notepad__head">
        <strong>📝 Ma note</strong>
        <span className="notepad__actions">
          {texte.trim() && (
            <button className="btn btn--small btn--ghost" onClick={ajouterEntrée} title="Écrire à la suite (Ctrl + Entrée)">
              ✚ Ajouter
            </button>
          )}
          <button className="notepad__close" onClick={basculer} title="Masquer le bloc-notes">
            ✕
          </button>
        </span>
      </div>
      <textarea
        className="notepad__area"
        ref={zone}
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            ajouterEntrée()
          }
        }}
        placeholder="Ce que je retiens, les pièges, les questions à creuser… (Markdown accepté)"
        spellCheck={false}
      />
      <div className="notepad__foot">
        <span className="muted small">{enregistre ? '✓ Enregistrée' : `${texte.trim().length} caractères`}</span>
        <Link to={`/t/${techId}/notes`} className="small">
          Toutes mes notes →
        </Link>
      </div>
    </aside>
  )
}
