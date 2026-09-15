import { parse } from 'yaml'
import type { Chapter, InterviewQuestion, Lesson, Tech } from './types'

// Tout le contenu vit dans /content/<techno>/ :
//   tech.yaml             → nom, couleur, liste ordonnée des chapitres
//   lecons/**/*.md        → une leçon par fichier (frontmatter YAML + Markdown), un dossier par chapitre
//   entretien/*.yaml      → questions d'entretien, un fichier par chapitre
// Ajouter un fichier suffit : il est détecté automatiquement au build.
// (Vite exige des options littérales dans import.meta.glob, d'où la répétition.)
const techFiles = import.meta.glob<string>('/content/*/tech.yaml', { query: '?raw', import: 'default', eager: true })
const lessonFiles = import.meta.glob<string>('/content/*/lecons/**/*.md', { query: '?raw', import: 'default', eager: true })
const interviewFiles = import.meta.glob<string>('/content/*/entretien/*.yaml', { query: '?raw', import: 'default', eager: true })

const techIdOf = (path: string) => path.split('/')[2]

function parseLesson(path: string, raw: string): Lesson {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) throw new Error(`Frontmatter manquant dans ${path}`)
  const meta = parse(match[1])
  const body = match[2]

  // Le corps est découpé en « ## Essentiel » et « ## Détail »
  const detailIndex = body.search(/^##\s+D[ée]tail\s*$/m)
  const essentielPart = detailIndex >= 0 ? body.slice(0, detailIndex) : body
  const detailPart = detailIndex >= 0 ? body.slice(detailIndex) : ''

  return {
    id: meta.id,
    techId: techIdOf(path),
    chapitre: meta.chapitre,
    ordre: meta.ordre ?? 0,
    titre: meta.titre,
    termes: meta.termes ?? [],
    quiz: meta.quiz ?? [],
    essentiel: essentielPart.replace(/^##\s+Essentiel\s*$/m, '').trim(),
    detail: detailPart.replace(/^##\s+D[ée]tail\s*$/m, '').trim(),
  }
}

function loadTechs(): Tech[] {
  const lessons = Object.entries(lessonFiles).map(([path, raw]) => parseLesson(path, raw))

  return Object.entries(techFiles).map(([path, raw]) => {
    const techId = techIdOf(path)
    const meta = parse(raw)

    const chapters: Chapter[] = (meta.chapitres ?? []).map((c: Omit<Chapter, 'lessons'>) => ({
      ...c,
      lessons: lessons
        .filter((l) => l.techId === techId && l.chapitre === c.id)
        .sort((a, b) => a.ordre - b.ordre),
    }))

    for (const l of lessons.filter((l) => l.techId === techId)) {
      if (!chapters.some((c) => c.id === l.chapitre)) {
        console.warn(`Leçon « ${l.id} » : chapitre « ${l.chapitre} » absent de tech.yaml`)
      }
    }

    const interview: InterviewQuestion[] = Object.entries(interviewFiles)
      .filter(([p]) => techIdOf(p) === techId)
      .sort(([a], [b]) => a.localeCompare(b))
      .flatMap(([, raw]) => parse(raw)?.questions ?? [])

    return {
      id: techId,
      nom: meta.nom,
      description: meta.description,
      couleur: meta.couleur ?? '#4f46e5',
      icone: meta.icone ?? '📘',
      chapters,
      interview,
    }
  })
}

export const techs: Tech[] = loadTechs()

export const getTech = (id: string | undefined) => techs.find((t) => t.id === id)

export const allLessons = (tech: Tech) => tech.chapters.flatMap((c) => c.lessons)

export const getLesson = (tech: Tech, lessonId: string | undefined) =>
  allLessons(tech).find((l) => l.id === lessonId)
