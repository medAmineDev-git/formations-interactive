import type { CSSProperties } from 'react'
import { Link, NavLink, Navigate, useParams } from 'react-router-dom'
import { getTech } from '../content/loader'
import { INTERVIEW_LEVELS, LEARN_LEVELS, type Tech } from '../content/types'
import { FavoriteButton, Inline, ProgressBar } from '../components/ui'
import { interviewProgress, learnProgress, lessonKey, nextLesson, questionKey } from '../lib/progress'
import { useStore } from '../lib/store'

export function TechPage() {
  const { techId, tab = 'apprentissage' } = useParams()
  const tech = getTech(techId)
  if (!tech) return <Navigate to="/" replace />
  if (tab !== 'apprentissage' && tab !== 'entretien') return <Navigate to={`/t/${tech.id}`} replace />

  return (
    <div style={{ '--accent': tech.couleur } as CSSProperties}>
      <div className="breadcrumb">
        <Link to="/">Accueil</Link> / {tech.nom}
      </div>
      <h1 className="page-title">
        <span>{tech.icone}</span> {tech.nom}
      </h1>

      <nav className="tabs">
        <NavLink to={`/t/${tech.id}/apprentissage`} className={() => (tab === 'apprentissage' ? 'active' : '')}>
          📚 Apprentissage
        </NavLink>
        <NavLink to={`/t/${tech.id}/entretien`} className={() => (tab === 'entretien' ? 'active' : '')}>
          🎤 Entretien
        </NavLink>
      </nav>

      {tab === 'apprentissage' ? <LearnTab tech={tech} /> : <InterviewTab tech={tech} />}
    </div>
  )
}

function LearnTab({ tech }: { tech: Tech }) {
  const state = useStore()
  const next = nextLesson(tech, state)

  return (
    <>
      <ProgressBar levels={learnProgress(tech, state)} />

      {next ? (
        <Link to={`/t/${tech.id}/lecon/${next.id}`} className="banner">
          <span>▶</span>
          <span>
            <small className="muted">Continuer le parcours</small>
            <br />
            <strong>{next.titre}</strong>
          </span>
          <span className="banner__cta">Reprendre →</span>
        </Link>
      ) : (
        <div className="banner banner--done">🎉 Toutes les leçons disponibles sont validées.</div>
      )}

      {LEARN_LEVELS.map((level) => {
        const chapters = tech.chapters.filter((c) => c.niveau === level.id)
        return (
          <section key={level.id} className="level">
            <h2 className="level__title">{level.label}</h2>
            {chapters.length === 0 && <p className="empty">Chapitres à venir.</p>}
            {chapters.map((chapter) => (
              <div key={chapter.id} className="chapter">
                <h3>{chapter.titre}</h3>
                {chapter.description && <p className="muted">{chapter.description}</p>}
                <ol className="lesson-list">
                  {chapter.lessons.map((lesson) => {
                    const p = state.lessons[lessonKey(lesson)]
                    return (
                      <li key={lesson.id}>
                        <Link to={`/t/${tech.id}/lecon/${lesson.id}`} className="lesson-row">
                          <span className={`status ${p?.validated ? 'status--ok' : state.visited[lessonKey(lesson)] ? 'status--started' : ''}`}>
                            {p?.validated ? '✓' : lesson.ordre}
                          </span>
                          <span className="lesson-row__title">{lesson.titre}</span>
                          {p && (
                            <span className="muted small">
                              Quiz {p.best}/{p.total}
                            </span>
                          )}
                          <FavoriteButton fav={`lecon:${lessonKey(lesson)}`} />
                        </Link>
                      </li>
                    )
                  })}
                </ol>
              </div>
            ))}
          </section>
        )
      })}
    </>
  )
}

function InterviewTab({ tech }: { tech: Tech }) {
  const state = useStore()
  const status = (qId: string) => state.interview[questionKey(tech.id, qId)]
  const toReview = tech.interview.filter((q) => status(q.id) === 'a-revoir').length
  const base = `/t/${tech.id}/entretien/session`

  return (
    <>
      <ProgressBar levels={interviewProgress(tech, state)} />

      <div className="actions">
        <Link to={`${base}/tout`} className="action">
          <span className="action__icon">▶</span>
          <strong>S'entraîner</strong>
          <small>Toutes les questions, dans l'ordre</small>
        </Link>
        <Link to={`${base}/blanc`} className="action">
          <span className="action__icon">⏱</span>
          <strong>Entretien blanc</strong>
          <small>10 questions au hasard, score à la fin</small>
        </Link>
        <Link to={`${base}/revoir`} className={`action ${toReview === 0 ? 'action--disabled' : ''}`}>
          <span className="action__icon">↻</span>
          <strong>À revoir ({toReview})</strong>
          <small>Uniquement ce que vous ne maîtrisez pas</small>
        </Link>
      </div>

      {INTERVIEW_LEVELS.map((level) => {
        const questions = tech.interview.filter((q) => q.niveau === level.id)
        const themes = [...new Set(questions.map((q) => q.theme))]
        return (
          <section key={level.id} className="level">
            <div className="level__head">
              <h2 className="level__title">{level.label}</h2>
              {questions.length > 0 && (
                <Link to={`${base}/${level.id}`} className="btn btn--small btn--ghost">
                  S'entraîner sur ce niveau
                </Link>
              )}
            </div>
            {questions.length === 0 && <p className="empty">Questions à venir.</p>}
            {themes.map((theme) => (
              <div key={theme} className="chapter">
                <h3>{theme}</h3>
                <ul className="lesson-list">
                  {questions
                    .filter((q) => q.theme === theme)
                    .map((q) => {
                      const s = status(q.id)
                      return (
                        <li key={q.id}>
                          <Link to={`${base}/tout?q=${q.id}`} className="lesson-row">
                            <span className={`status ${s === 'maitrise' ? 'status--ok' : s === 'a-revoir' ? 'status--review' : ''}`}>
                              {s === 'maitrise' ? '✓' : s === 'a-revoir' ? '↻' : '?'}
                            </span>
                            <span className="lesson-row__title">
                              <Inline source={q.question} />
                            </span>
                            <span className="tag">{q.type === 'qcm' ? 'QCM' : 'Oral'}</span>
                            <FavoriteButton fav={`question:${questionKey(tech.id, q.id)}`} />
                          </Link>
                        </li>
                      )
                    })}
                </ul>
              </div>
            ))}
          </section>
        )
      })}
    </>
  )
}
