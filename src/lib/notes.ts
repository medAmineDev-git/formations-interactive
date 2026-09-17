import { allLessons } from '../content/loader'
import type { Lesson, Tech } from '../content/types'
import { lessonKey } from './progress'
import type { State } from './store'

export interface TechNote {
  key: string
  lesson: Lesson
  chapitre: string
  texte: string
}

/** Notes d'une formation, dans l'ordre du parcours. */
export function techNotes(tech: Tech, s: State): TechNote[] {
  return allLessons(tech)
    .map((lesson) => ({
      key: lessonKey(lesson),
      lesson,
      chapitre: tech.chapters.find((c) => c.id === lesson.chapitre)?.titre ?? '',
      texte: s.notes[lessonKey(lesson)] ?? '',
    }))
    .filter((n) => n.texte.trim())
}

export const countNotes = (tech: Tech, s: State) => techNotes(tech, s).length

/** Toutes les notes d'une formation en un seul Markdown, prêt à être relu ou archivé. */
export function notesToMarkdown(tech: Tech, notes: TechNote[]): string {
  const date = new Date().toLocaleDateString('fr-FR')
  const lignes = [`# Notes — ${tech.nom}`, '', `_Exporté le ${date} · ${notes.length} note(s)_`, '']
  let chapitre = ''
  for (const n of notes) {
    if (n.chapitre !== chapitre) {
      chapitre = n.chapitre
      lignes.push(`## ${chapitre}`, '')
    }
    lignes.push(`### ${n.lesson.titre}`, '', n.texte.trim(), '')
  }
  return lignes.join('\n')
}

/** Télécharge le Markdown sous « <techno>-notes.md » (pas de serveur : tout se passe côté navigateur). */
export function downloadNotes(tech: Tech, notes: TechNote[]) {
  const blob = new Blob([notesToMarkdown(tech, notes)], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${tech.id}-notes.md`
  a.click()
  URL.revokeObjectURL(url)
}
