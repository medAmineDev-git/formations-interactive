import { useState } from 'react'
import { highlightCode, renderInline, renderMarkdown } from '../lib/markdown'
import { shuffledIndices } from '../lib/shuffle'
import { toggleFavorite, useStore } from '../lib/store'
import type { LevelProgress } from '../lib/progress'
import { percent } from '../lib/progress'

export function Markdown({ source, className = '' }: { source: string; className?: string }) {
  return <div className={`prose ${className}`} dangerouslySetInnerHTML={{ __html: renderMarkdown(source) }} />
}

export function Inline({ source }: { source: string }) {
  return <span dangerouslySetInnerHTML={{ __html: renderInline(source) }} />
}

export function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="code">
      <code className="hljs" dangerouslySetInnerHTML={{ __html: highlightCode(code.trimEnd()) }} />
    </pre>
  )
}

interface ChoicesProps {
  choices: string[]
  answer: number
  selected: number | null
  revealed: boolean
  onSelect: (index: number) => void
}

/**
 * Choix d'un QCM, affichés dans un ordre aléatoire (tiré au montage) pour qu'on
 * ne mémorise pas la position de la bonne réponse. Les index restent ceux du contenu.
 */
export function Choices({ choices, answer, selected, revealed, onSelect }: ChoicesProps) {
  const [order] = useState(() => shuffledIndices(choices.length))
  return (
    <div className="choices">
      {order.map((i, position) => {
        let state = ''
        if (revealed && i === answer) state = 'choice--correct'
        else if (revealed && i === selected) state = 'choice--wrong'
        else if (!revealed && i === selected) state = 'choice--selected'
        return (
          <button key={i} className={`choice ${state}`} disabled={revealed} onClick={() => onSelect(i)}>
            <span className="choice__letter">{String.fromCharCode(65 + position)}</span>
            <Inline source={choices[i]} />
          </button>
        )
      })}
    </div>
  )
}

export function ProgressBar({ levels, compact = false }: { levels: LevelProgress[]; compact?: boolean }) {
  return (
    <div className={`progress ${compact ? 'progress--compact' : ''}`}>
      {!compact && (
        <div className="progress__head">
          <span>Progression</span>
          <strong>{percent(levels)} %</strong>
        </div>
      )}
      <div className="progress__track">
        {levels.map((l) => (
          <div key={l.id} className={`progress__seg ${l.total === 0 ? 'progress__seg--empty' : ''}`}>
            <div className="progress__fill" style={{ width: l.total ? `${(l.done / l.total) * 100}%` : 0 }} />
          </div>
        ))}
      </div>
      {!compact && (
        <div className="progress__labels">
          {levels.map((l) => (
            <span key={l.id}>
              {l.label} <em>{l.total ? `${l.done}/${l.total}` : 'bientôt'}</em>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function FavoriteButton({ fav, label = false }: { fav: string; label?: boolean }) {
  const { favorites } = useStore()
  const on = favorites.includes(fav)
  return (
    <button
      className={`fav ${on ? 'fav--on' : ''}`}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleFavorite(fav)
      }}
      title={on ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      aria-pressed={on}
    >
      {on ? '★' : '☆'}
      {label && <span>{on ? 'En favori' : 'Favori'}</span>}
    </button>
  )
}
