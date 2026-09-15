import { useState } from 'react'
import type { QuizQuestion } from '../content/types'
import { passingScore } from '../lib/store'
import { Choices, CodeBlock, Inline, Markdown } from './ui'

interface Props {
  questions: QuizQuestion[]
  onFinish: (score: number) => void
  onNext?: () => void
  nextLabel?: string
}

export function Quiz({ questions, onFinish, onNext, nextLabel }: Props) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const restart = () => {
    setIndex(0)
    setSelected(null)
    setChecked(false)
    setScore(0)
    setFinished(false)
  }

  if (finished) {
    const passed = score >= passingScore(questions.length)
    return (
      <div className={`quiz-result ${passed ? 'quiz-result--ok' : 'quiz-result--ko'}`}>
        <div className="quiz-result__score">
          {score} / {questions.length}
        </div>
        <p>{passed ? '🎉 Leçon validée !' : `Il faut ${passingScore(questions.length)} bonnes réponses pour valider. Relisez la leçon et réessayez.`}</p>
        <div className="row">
          <button className="btn btn--ghost" onClick={restart}>
            Recommencer le quiz
          </button>
          {passed && onNext && (
            <button className="btn" onClick={onNext}>
              {nextLabel ?? 'Suivant'} →
            </button>
          )}
        </div>
      </div>
    )
  }

  const q = questions[index]
  const isLast = index === questions.length - 1

  const check = () => {
    setChecked(true)
    if (selected === q.reponse) setScore((s) => s + 1)
  }

  const next = () => {
    if (isLast) {
      setFinished(true)
      onFinish(score)
      return
    }
    setIndex(index + 1)
    setSelected(null)
    setChecked(false)
  }

  return (
    <div className="quiz">
      <div className="quiz__meta">
        Question {index + 1} / {questions.length}
        <div className="dots">
          {questions.map((_, i) => (
            <span key={i} className={`dot ${i < index ? 'dot--done' : ''} ${i === index ? 'dot--current' : ''}`} />
          ))}
        </div>
      </div>
      <h3 className="quiz__question">
        <Inline source={q.question} />
      </h3>
      {q.code && <CodeBlock code={q.code} />}

      <Choices
        key={index}
        choices={q.choix}
        answer={q.reponse}
        selected={selected}
        revealed={checked}
        onSelect={setSelected}
      />

      {checked && (
        <div className={`feedback ${selected === q.reponse ? 'feedback--ok' : 'feedback--ko'}`}>
          <strong className="feedback__title">{selected === q.reponse ? '✓ Bonne réponse' : '✗ Mauvaise réponse'}</strong>
          <Markdown source={q.explication} />
        </div>
      )}

      <div className="row row--end">
        {!checked ? (
          <button className="btn" disabled={selected === null} onClick={check}>
            Valider
          </button>
        ) : (
          <button className="btn" onClick={next}>
            {isLast ? 'Voir le résultat' : 'Question suivante →'}
          </button>
        )}
      </div>
    </div>
  )
}
