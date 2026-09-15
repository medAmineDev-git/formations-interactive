export type LearnLevel = 'debutant' | 'intermediaire' | 'avance'
export type InterviewLevel = 'junior' | 'confirme' | 'senior'

export const LEARN_LEVELS: { id: LearnLevel; label: string }[] = [
  { id: 'debutant', label: 'Débutant' },
  { id: 'intermediaire', label: 'Intermédiaire' },
  { id: 'avance', label: 'Avancé' },
]

export const INTERVIEW_LEVELS: { id: InterviewLevel; label: string }[] = [
  { id: 'junior', label: 'Junior' },
  { id: 'confirme', label: 'Confirmé' },
  { id: 'senior', label: 'Senior' },
]

export interface Term {
  terme: string
  definition: string
}

export interface QuizQuestion {
  question: string
  code?: string
  choix: string[]
  reponse: number
  explication: string
}

export interface Lesson {
  id: string
  techId: string
  chapitre: string
  ordre: number
  titre: string
  termes: Term[]
  quiz: QuizQuestion[]
  /** Markdown de la partie « Essentiel » */
  essentiel: string
  /** Markdown de la partie « Détail » (sans les termes, rendus à part) */
  detail: string
}

export interface Chapter {
  id: string
  titre: string
  niveau: LearnLevel
  description?: string
  lessons: Lesson[]
}

export interface InterviewQuestion {
  id: string
  niveau: InterviewLevel
  theme: string
  type: 'qcm' | 'ouverte'
  question: string
  code?: string
  /** QCM uniquement */
  choix?: string[]
  /** QCM : index de la bonne réponse. Ouverte : réponse attendue en Markdown. */
  reponse: number | string
  explication?: string
  /** id de la leçon liée (bouton « Voir la leçon ») */
  lecon?: string
}

export interface Tech {
  id: string
  nom: string
  description: string
  couleur: string
  icone: string
  chapters: Chapter[]
  interview: InterviewQuestion[]
}
