import { useEffect, useState, type CSSProperties } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { allLessons, getLesson, getTech } from '../content/loader'
import { LEARN_LEVELS } from '../content/types'
import { LessonContent } from '../components/LessonContent'
import { NotePad } from '../components/NotePad'
import { Quiz } from '../components/Quiz'
import { FavoriteButton, ProgressBar } from '../components/ui'
import { learnProgress, lessonKey } from '../lib/progress'
import { markVisited, recordQuiz, useStore } from '../lib/store'

export function LessonPage() {
  const { techId, lessonId } = useParams()
  const navigate = useNavigate()
  const state = useStore()
  const tech = getTech(techId)
  const lesson = tech && getLesson(tech, lessonId)
  const [quizOpen, setQuizOpen] = useState(false)

  useEffect(() => {
    if (lesson) markVisited(lessonKey(lesson))
    setQuizOpen(false)
  }, [lesson])

  if (!tech || !lesson) return <Navigate to={tech ? `/t/${tech.id}` : '/'} replace />

  const lessons = allLessons(tech)
  const index = lessons.indexOf(lesson)
  const prev = lessons[index - 1]
  const next = lessons[index + 1]
  const chapter = tech.chapters.find((c) => c.id === lesson.chapitre)!
  const levelLabel = LEARN_LEVELS.find((l) => l.id === chapter.niveau)?.label
  const progress = state.lessons[lessonKey(lesson)]

  return (
    <div style={{ '--accent': tech.couleur } as CSSProperties}>
      <NotePad noteKey={lessonKey(lesson)} techId={tech.id} />
      <ProgressBar levels={learnProgress(tech, state)} />

      <div className="breadcrumb">
        <Link to="/">Accueil</Link> / <Link to={`/t/${tech.id}`}>{tech.nom}</Link> / {chapter.titre}
      </div>

      <div className="lesson-head">
        <div>
          <div className="eyebrow">
            {levelLabel} · Leçon {index + 1} / {lessons.length}
            {progress?.validated && <span className="pill pill--ok">✓ Validée</span>}
          </div>
          <h1 className="page-title">{lesson.titre}</h1>
        </div>
        <FavoriteButton fav={`lecon:${lessonKey(lesson)}`} label />
      </div>

      <LessonContent key={lesson.id} lesson={lesson} />

      {lesson.quiz.length > 0 && (
        <section className="card card--quiz">
          <h2 className="section-title">Quiz</h2>
          {quizOpen ? (
            <Quiz
              key={lesson.id}
              questions={lesson.quiz}
              onFinish={(score) => recordQuiz(lessonKey(lesson), score, lesson.quiz.length)}
              onNext={next ? () => navigate(`/t/${tech.id}/lecon/${next.id}`) : undefined}
              nextLabel="Leçon suivante"
            />
          ) : (
            <div className="quiz-intro">
              <p>
                {lesson.quiz.length} questions pour vérifier que c'est acquis.
                {progress && ` Meilleur score : ${progress.best}/${progress.total}.`}
              </p>
              <button className="btn" onClick={() => setQuizOpen(true)}>
                {progress ? 'Refaire le quiz' : 'Passer au quiz'} →
              </button>
            </div>
          )}
        </section>
      )}

      <nav className="pager">
        {prev ? (
          <Link to={`/t/${tech.id}/lecon/${prev.id}`} className="pager__link">
            <small>← Précédent</small>
            {prev.titre}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link to={`/t/${tech.id}/lecon/${next.id}`} className="pager__link pager__link--next">
            <small>Suivant →</small>
            {next.titre}
          </Link>
        )}
      </nav>
    </div>
  )
}
