import { allLessons } from '../content/loader'
import { INTERVIEW_LEVELS, LEARN_LEVELS, type Lesson, type Tech, type Term } from '../content/types'
import { isDue, type State } from './store'

export interface LevelProgress {
  id: string
  label: string
  done: number
  total: number
}

export const lessonKey = (l: Lesson) => `${l.techId}/${l.id}`
export const questionKey = (techId: string, qId: string) => `${techId}/${qId}`
export const termKey = (techId: string, t: Term) => `${techId}/${t.terme}`

export function learnProgress(tech: Tech, s: State): LevelProgress[] {
  return LEARN_LEVELS.map(({ id, label }) => {
    const lessons = tech.chapters.filter((c) => c.niveau === id).flatMap((c) => c.lessons)
    return { id, label, total: lessons.length, done: lessons.filter((l) => s.lessons[lessonKey(l)]?.validated).length }
  })
}

export function interviewProgress(tech: Tech, s: State): LevelProgress[] {
  return INTERVIEW_LEVELS.map(({ id, label }) => {
    const qs = tech.interview.filter((q) => q.niveau === id)
    return {
      id,
      label,
      total: qs.length,
      done: qs.filter((q) => s.interview[questionKey(tech.id, q.id)] === 'maitrise').length,
    }
  })
}

export function percent(levels: LevelProgress[]) {
  const total = levels.reduce((n, l) => n + l.total, 0)
  const done = levels.reduce((n, l) => n + l.done, 0)
  return total ? Math.round((done / total) * 100) : 0
}

/** Première leçon non validée, dans l'ordre du parcours. */
export function nextLesson(tech: Tech, s: State) {
  return allLessons(tech).find((l) => !s.lessons[lessonKey(l)]?.validated)
}

export interface GlossaryEntry {
  key: string
  term: Term
  tech: Tech
  lesson: Lesson
}

export function glossary(techs: Tech[]): GlossaryEntry[] {
  return techs.flatMap((tech) =>
    allLessons(tech).flatMap((lesson) =>
      lesson.termes.map((term) => ({ key: termKey(tech.id, term), term, tech, lesson })),
    ),
  )
}

/** Termes à réviser : ceux des leçons déjà ouvertes, arrivés à échéance. */
export function dueTerms(techs: Tech[], s: State) {
  return glossary(techs).filter((e) => s.visited[lessonKey(e.lesson)] && isDue(s.cards[e.key]))
}
