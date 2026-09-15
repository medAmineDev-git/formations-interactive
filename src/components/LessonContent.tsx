import { useState } from 'react'
import type { Lesson } from '../content/types'
import { Markdown } from './ui'

/** Partie « Essentiel » + bouton « Explication détaillée » (termes, exemples, pièges…). */
export function LessonContent({ lesson, startOpen = false }: { lesson: Lesson; startOpen?: boolean }) {
  const [open, setOpen] = useState(startOpen)
  const hasDetail = lesson.detail || lesson.termes.length > 0

  return (
    <div className="lesson-content">
      <section className="card">
        <h2 className="section-title">L'essentiel</h2>
        <Markdown source={lesson.essentiel} />
      </section>

      {hasDetail && (
        <>
          <button className={`detail-toggle ${open ? 'detail-toggle--open' : ''}`} onClick={() => setOpen(!open)}>
            <span className="detail-toggle__chevron">▸</span>
            {open ? 'Masquer l’explication détaillée' : 'Explication détaillée'}
            {!open && <small>Termes · Exemples · Pièges · À retenir</small>}
          </button>

          {open && (
            <section className="card card--detail">
              {lesson.termes.length > 0 && (
                <>
                  <h3>Les termes expliqués</h3>
                  <dl className="terms">
                    {lesson.termes.map((t) => (
                      <div key={t.terme} className="terms__item">
                        <dt>{t.terme}</dt>
                        <dd>
                          <Markdown source={t.definition} />
                        </dd>
                      </div>
                    ))}
                  </dl>
                </>
              )}
              <Markdown source={lesson.detail} />
            </section>
          )}
        </>
      )}
    </div>
  )
}
