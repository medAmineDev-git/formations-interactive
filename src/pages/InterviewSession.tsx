import { useState, type CSSProperties } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'

import { getLesson, getTech } from '../content/loader'
import { INTERVIEW_LEVELS, type InterviewQuestion, type Tech } from '../content/types'
import { LessonContent } from '../components/LessonContent'
import { Choices, CodeBlock, FavoriteButton, Inline, Markdown, ProgressBar } from '../components/ui'
import { shuffle } from '../lib/shuffle'
import { interviewProgress, questionKey } from '../lib/progress'
import { setInterviewStatus, useStore, type InterviewStatus, type State } from '../lib/store'

const MODE_LABELS: Record<string, string> = {
  tout: 'Entraînement',
  blanc: 'Entretien blanc',
  revoir: 'Questions à revoir',
  junior: 'Niveau Junior',
  confirme: 'Niveau Confirmé',
  senior: 'Niveau Senior',
}

function buildSession(tech: Tech, mode: string, s: State): InterviewQuestion[] {
  const status = (q: InterviewQuestion) => s.interview[questionKey(tech.id, q.id)]
  switch (mode) {
    case 'blanc':
      return shuffle(tech.interview).slice(0, 10)
    case 'revoir':
      return tech.interview.filter((q) => status(q) === 'a-revoir')
    case 'junior':
    case 'confirme':
    case 'senior':
      return tech.interview.filter((q) => q.niveau === mode)
    default:
      return tech.interview
  }
}

export function InterviewSession() {
  const { techId, mode = 'tout' } = useParams()
  const [params] = useSearchParams()
  // Nouvelle session (état remis à zéro) dès que le mode ou la question de départ change
  return <Session key={`${techId}/${mode}/${params.get('q')}`} techId={techId} mode={mode} startId={params.get('q')} />
}

function Session({ techId, mode, startId }: { techId?: string; mode: string; startId: string | null }) {
  const state = useStore()
  const tech = getTech(techId)

  // La liste est figée au démarrage : une question marquée « maîtrisée »
  // pendant la session « À revoir » ne disparaît pas sous nos yeux.
  const [questions] = useState(() => (tech ? buildSession(tech, mode, state) : []))
  const [index, setIndex] = useState(() => {
    const start = questions.findIndex((q) => q.id === startId)
    if (start >= 0) return start
    if (mode === 'blanc') return 0
    const firstTodo = questions.findIndex((q) => state.interview[questionKey(techId!, q.id)] !== 'maitrise')
    return Math.max(firstTodo, 0)
  })
  const [results, setResults] = useState<Record<string, boolean>>({})
  const [done, setDone] = useState(false)

  if (!tech) return <Navigate to="/" replace />
  const back = `/t/${tech.id}/entretien`

  if (questions.length === 0) {
    return (
      <div className="empty-state">
        <p>Aucune question dans cette sélection. 🎉</p>
        <Link to={back} className="btn">
          Retour à l'entretien
        </Link>
      </div>
    )
  }

  if (done) {
    const answered = Object.values(results)
    const ok = answered.filter(Boolean).length
    const wrong = answered.length - ok
    const skipped = questions.length - answered.length
    return (
      <div style={{ '--accent': tech.couleur } as CSSProperties}>
        <div className="quiz-result quiz-result--ok">
          <p className="muted">{MODE_LABELS[mode]} terminé</p>
          <div className="quiz-result__score">
            {ok} / {questions.length}
          </div>
          <p>
            {ok === questions.length && 'Parfait, vous êtes prêt !'}
            {wrong > 0 && `${wrong} question(s) ajoutée(s) à « À revoir ». `}
            {skipped > 0 && `${skipped} question(s) passée(s) sans réponse.`}
          </p>
          <div className="row">
            <Link to={back} className="btn btn--ghost">
              Retour à l'entretien
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const q = questions[index]
  const record = (known: boolean) => {
    setResults((r) => ({ ...r, [q.id]: known }))
    setInterviewStatus(questionKey(tech.id, q.id), (known ? 'maitrise' : 'a-revoir') satisfies InterviewStatus)
  }
  const goNext = () => (index === questions.length - 1 ? setDone(true) : setIndex(index + 1))

  return (
    <div style={{ '--accent': tech.couleur } as CSSProperties}>
      <ProgressBar levels={interviewProgress(tech, state)} />

      <div className="breadcrumb">
        <Link to="/">Accueil</Link> / <Link to={back}>{tech.nom} · Entretien</Link> / {MODE_LABELS[mode] ?? mode}
      </div>

      <QuestionCard
        key={q.id}
        tech={tech}
        question={q}
        position={`${index + 1} / ${questions.length}`}
        onAnswer={record}
        result={results[q.id]}
      />

      <nav className="row row--between">
        <button className="btn btn--ghost" disabled={index === 0} onClick={() => setIndex(index - 1)}>
          ← Précédente
        </button>
        <button className="btn" onClick={goNext}>
          {index === questions.length - 1 ? 'Terminer' : 'Question suivante →'}
        </button>
      </nav>
    </div>
  )
}

interface CardProps {
  tech: Tech
  question: InterviewQuestion
  position: string
  /** Réponse déjà donnée dans cette session (undefined = pas encore) */
  result?: boolean
  onAnswer: (known: boolean) => void
}

function QuestionCard({ tech, question: q, position, result, onAnswer }: CardProps) {
  const [revealed, setRevealed] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [lessonOpen, setLessonOpen] = useState(false)
  const lesson = q.lecon ? getLesson(tech, q.lecon) : undefined
  const level = INTERVIEW_LEVELS.find((l) => l.id === q.niveau)?.label

  const checkQcm = () => {
    setRevealed(true)
    onAnswer(selected === q.reponse)
  }

  return (
    <article className="card question-card">
      <div className="question-card__meta">
        <span className="pill">{level}</span>
        <span className="muted">{q.theme}</span>
        <span className="muted question-card__pos">{position}</span>
        <FavoriteButton fav={`question:${questionKey(tech.id, q.id)}`} />
      </div>

      <h2 className="question-card__q">
        <Inline source={q.question} />
      </h2>
      {q.code && <CodeBlock code={q.code} />}

      {q.type === 'qcm' && q.choix ? (
        <>
          <Choices
            choices={q.choix}
            answer={q.reponse as number}
            selected={selected}
            revealed={revealed}
            onSelect={setSelected}
          />
          {!revealed ? (
            <div className="row row--end">
              <button className="btn" disabled={selected === null} onClick={checkQcm}>
                Valider
              </button>
            </div>
          ) : (
            <div className={`feedback ${selected === q.reponse ? 'feedback--ok' : 'feedback--ko'}`}>
              <strong className="feedback__title">
                {selected === q.reponse ? '✓ Bonne réponse' : '✗ Mauvaise réponse — ajoutée à « À revoir »'}
              </strong>
              {q.explication && <Markdown source={q.explication} />}
            </div>
          )}
        </>
      ) : (
        <>
          {!revealed ? (
            <div className="think">
              <p className="muted">Formulez votre réponse à voix haute, comme en entretien, puis comparez.</p>
              <button className="btn" onClick={() => setRevealed(true)}>
                Afficher la réponse
              </button>
            </div>
          ) : (
            <>
              <div className="answer">
                <div className="answer__label">Réponse attendue</div>
                <Markdown source={String(q.reponse)} />
                {q.explication && <Markdown source={q.explication} className="muted" />}
              </div>
              <div className="self-eval">
                {result === undefined ? (
                  <>
                    <span className="muted">Vous le saviez ?</span>
                    <button className="btn btn--ok" onClick={() => onAnswer(true)}>
                      ✓ Je savais
                    </button>
                    <button className="btn btn--review" onClick={() => onAnswer(false)}>
                      ↻ À revoir
                    </button>
                  </>
                ) : result ? (
                  <span className="self-eval__done self-eval__done--ok">✓ Marquée comme maîtrisée</span>
                ) : (
                  <span className="self-eval__done self-eval__done--review">↻ Ajoutée à « À revoir »</span>
                )}
              </div>
            </>
          )}
        </>
      )}

      {lesson && (
        <div className="linked-lesson">
          <button className={`detail-toggle ${lessonOpen ? 'detail-toggle--open' : ''}`} onClick={() => setLessonOpen(!lessonOpen)}>
            <span className="detail-toggle__chevron">▸</span>
            {lessonOpen ? 'Masquer la leçon' : 'Voir la leçon'}
            <small>{lesson.titre}</small>
          </button>
          {lessonOpen && (
            <div className="linked-lesson__body">
              <LessonContent lesson={lesson} />
              <Link to={`/t/${tech.id}/lecon/${lesson.id}`} className="small">
                Ouvrir la leçon complète (avec le quiz) →
              </Link>
            </div>
          )}
        </div>
      )}
    </article>
  )
}
