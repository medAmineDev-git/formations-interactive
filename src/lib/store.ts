import { useSyncExternalStore } from 'react'

// Toute la progression est gardée dans le navigateur (localStorage).
// Clés : leçon → "<techId>/<lessonId>", question → "<techId>/<questionId>",
//        terme → "<techId>/<terme>", favori → "lecon:<clé>" ou "question:<clé>".

export interface LessonProgress {
  best: number
  total: number
  validated: boolean
}

export type InterviewStatus = 'maitrise' | 'a-revoir'

export interface Card {
  box: number
  due: number
}

export interface State {
  lessons: Record<string, LessonProgress>
  visited: Record<string, number>
  favorites: string[]
  interview: Record<string, InterviewStatus>
  cards: Record<string, Card>
  notes: Record<string, string>
}

const STORAGE_KEY = 'formations:v1'
const EMPTY: State = { lessons: {}, visited: {}, favorites: [], interview: {}, cards: {}, notes: {} }

function load(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY
  } catch {
    return EMPTY
  }
}

let state: State = load()
const listeners = new Set<() => void>()

export function update(fn: (s: State) => State) {
  state = fn(state)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // stockage indisponible (navigation privée…) : la session continue en mémoire
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useStore = () => useSyncExternalStore(subscribe, () => state)

/** Une leçon est validée à partir de 2/3 de bonnes réponses. */
export const passingScore = (total: number) => Math.ceil((total * 2) / 3)

export function recordQuiz(key: string, score: number, total: number) {
  update((s) => {
    const prev = s.lessons[key]
    const best = Math.max(score, prev?.best ?? 0)
    return {
      ...s,
      lessons: {
        ...s.lessons,
        [key]: { best, total, validated: prev?.validated || score >= passingScore(total) },
      },
    }
  })
}

export function markVisited(key: string) {
  if (state.visited[key]) return
  update((s) => ({ ...s, visited: { ...s.visited, [key]: Date.now() } }))
}

export function toggleFavorite(fav: string) {
  update((s) => ({
    ...s,
    favorites: s.favorites.includes(fav) ? s.favorites.filter((f) => f !== fav) : [...s.favorites, fav],
  }))
}

/** Note personnelle attachée à une leçon (clé « <techId>/<lessonId> »). */
export function setNote(key: string, texte: string) {
  update((s) => {
    const notes = { ...s.notes }
    if (texte.trim()) notes[key] = texte
    else delete notes[key]
    return { ...s, notes }
  })
}

export function setInterviewStatus(key: string, status: InterviewStatus) {
  update((s) => ({ ...s, interview: { ...s.interview, [key]: status } }))
}

// Répétition espacée (boîtes de Leitner) : chaque bonne réponse
// repousse la prochaine révision, une erreur remet le terme à zéro.
const INTERVALS_DAYS = [0, 1, 3, 7, 14, 30]
const DAY = 24 * 60 * 60 * 1000

export function reviewCard(key: string, known: boolean) {
  update((s) => {
    const box = known ? Math.min((s.cards[key]?.box ?? 0) + 1, INTERVALS_DAYS.length - 1) : 0
    return { ...s, cards: { ...s.cards, [key]: { box, due: Date.now() + INTERVALS_DAYS[box] * DAY } } }
  })
}

export const isDue = (card: Card | undefined) => !card || card.due <= Date.now()

export function resetProgress() {
  update(() => EMPTY)
}
