// Vérifie la cohérence de tout le contenu (content/<techno>/...).
// Usage : npm run verifier            (toutes les technos)
//         npm run verifier -- spring-boot
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { parse } from 'yaml'

const ROOT = join(import.meta.dirname, '..', 'content')
const LEARN_LEVELS = ['debutant', 'intermediaire', 'avance']
const INTERVIEW_LEVELS = ['junior', 'confirme', 'senior']

const errors = []
const warnings = []
const err = (file, msg) => errors.push(`${relative(ROOT, file)} : ${msg}`)
const warn = (file, msg) => warnings.push(`${relative(ROOT, file)} : ${msg}`)

const walk = (dir, ext) =>
  existsSync(dir)
    ? readdirSync(dir).flatMap((name) => {
        const p = join(dir, name)
        return statSync(p).isDirectory() ? walk(p, ext) : p.endsWith(ext) ? [p] : []
      })
    : []

const nonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0

function checkQuiz(file, label, q) {
  if (!nonEmptyString(q.question)) err(file, `${label} : « question » manquante`)
  if (!Array.isArray(q.choix) || q.choix.length < 2) err(file, `${label} : il faut au moins 2 « choix »`)
  else {
    if (!Number.isInteger(q.reponse) || q.reponse < 0 || q.reponse >= q.choix.length)
      err(file, `${label} : « reponse » doit être un index entre 0 et ${q.choix.length - 1} (reçu ${q.reponse})`)
    if (new Set(q.choix.map(String)).size !== q.choix.length) err(file, `${label} : choix en double`)
    q.choix.forEach((c, i) => !nonEmptyString(String(c ?? '')) && err(file, `${label} : choix ${i} vide`))
  }
  if (!nonEmptyString(q.explication)) err(file, `${label} : « explication » manquante`)
}

function checkTech(techId) {
  const dir = join(ROOT, techId)
  const techFile = join(dir, 'tech.yaml')
  let tech
  try {
    tech = parse(readFileSync(techFile, 'utf8'))
  } catch (e) {
    return err(techFile, `YAML invalide — ${e.message}`)
  }
  if (!nonEmptyString(tech?.nom)) err(techFile, '« nom » manquant')

  const chapters = new Map()
  for (const c of tech?.chapitres ?? []) {
    if (chapters.has(c.id)) err(techFile, `chapitre « ${c.id} » en double`)
    if (!LEARN_LEVELS.includes(c.niveau)) err(techFile, `chapitre « ${c.id} » : niveau « ${c.niveau} » invalide (${LEARN_LEVELS.join(', ')})`)
    if (!nonEmptyString(c.titre)) err(techFile, `chapitre « ${c.id} » : « titre » manquant`)
    chapters.set(c.id, { ...c, lessons: 0 })
  }

  // ---------- Leçons ----------
  const lessonIds = new Map()
  const orders = new Map()
  for (const file of walk(join(dir, 'lecons'), '.md')) {
    const raw = readFileSync(file, 'utf8')
    const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
    if (!m) {
      err(file, 'frontmatter « --- » manquant')
      continue
    }
    let meta
    try {
      meta = parse(m[1])
    } catch (e) {
      err(file, `YAML du frontmatter invalide — ${e.message.split('\n')[0]}`)
      continue
    }
    const body = m[2]

    if (!nonEmptyString(meta.id)) err(file, '« id » manquant')
    else if (lessonIds.has(meta.id)) err(file, `id « ${meta.id} » déjà utilisé par ${relative(ROOT, lessonIds.get(meta.id))}`)
    else lessonIds.set(meta.id, file)

    if (!chapters.has(meta.chapitre)) err(file, `chapitre « ${meta.chapitre} » absent de tech.yaml`)
    else chapters.get(meta.chapitre).lessons++

    if (!Number.isInteger(meta.ordre)) err(file, '« ordre » doit être un entier')
    else {
      const key = `${meta.chapitre}#${meta.ordre}`
      if (orders.has(key)) err(file, `ordre ${meta.ordre} déjà utilisé dans le chapitre « ${meta.chapitre} »`)
      orders.set(key, file)
    }
    if (!nonEmptyString(meta.titre)) err(file, '« titre » manquant')

    const termes = meta.termes ?? []
    if (!Array.isArray(termes)) err(file, '« termes » doit être une liste')
    else {
      if (termes.length < 3) warn(file, `seulement ${termes.length} terme(s)`)
      termes.forEach((t, i) => {
        if (!nonEmptyString(t?.terme)) err(file, `terme ${i + 1} : « terme » manquant`)
        if (!nonEmptyString(t?.definition)) err(file, `terme ${i + 1} : « definition » manquante`)
      })
    }

    const quiz = meta.quiz ?? []
    if (!Array.isArray(quiz) || quiz.length === 0) err(file, 'aucune question de « quiz »')
    else {
      if (quiz.length !== 3) warn(file, `${quiz.length} questions de quiz (le guide en prévoit 3)`)
      quiz.forEach((q, i) => checkQuiz(file, `quiz ${i + 1}`, q))
    }

    if (!/^##\s+Essentiel\s*$/m.test(body)) err(file, 'section « ## Essentiel » manquante')
    if (!/^##\s+D[ée]tail\s*$/m.test(body)) err(file, 'section « ## Détail » manquante')
    const fences = (body.match(/^```/gm) ?? []).length
    if (fences % 2 !== 0) err(file, 'bloc de code ``` non fermé')
  }

  for (const c of chapters.values()) if (c.lessons === 0) warn(techFile, `chapitre « ${c.id} » sans leçon`)

  // ---------- Entretien ----------
  const questionIds = new Map()
  for (const file of walk(join(dir, 'entretien'), '.yaml')) {
    let data
    try {
      data = parse(readFileSync(file, 'utf8'))
    } catch (e) {
      err(file, `YAML invalide — ${e.message.split('\n')[0]}`)
      continue
    }
    const questions = data?.questions
    if (!Array.isArray(questions)) {
      err(file, 'clé « questions » manquante')
      continue
    }
    questions.forEach((q, i) => {
      const label = `question ${q?.id ?? i + 1}`
      if (!nonEmptyString(q.id)) err(file, `question ${i + 1} : « id » manquant`)
      else if (questionIds.has(q.id)) err(file, `id « ${q.id} » déjà utilisé par ${relative(ROOT, questionIds.get(q.id))}`)
      else questionIds.set(q.id, file)
      if (!INTERVIEW_LEVELS.includes(q.niveau)) err(file, `${label} : niveau « ${q.niveau} » invalide (${INTERVIEW_LEVELS.join(', ')})`)
      if (!nonEmptyString(q.theme)) err(file, `${label} : « theme » manquant`)
      if (!nonEmptyString(q.question)) err(file, `${label} : « question » manquante`)
      if (q.type === 'qcm') checkQuiz(file, label, q)
      else if (q.type === 'ouverte') {
        if (!nonEmptyString(q.reponse)) err(file, `${label} : « reponse » (texte) manquante`)
      } else err(file, `${label} : type « ${q.type} » invalide (qcm ou ouverte)`)
      if (!q.lecon) warn(file, `${label} : pas de leçon liée`)
      else if (!lessonIds.has(q.lecon)) err(file, `${label} : leçon « ${q.lecon} » introuvable`)
    })
  }

  const count = (lvl) => [...chapters.values()].filter((c) => c.niveau === lvl).reduce((n, c) => n + c.lessons, 0)
  console.log(
    `${techId} : ${lessonIds.size} leçons (${LEARN_LEVELS.map((l) => `${l} ${count(l)}`).join(', ')}), ${questionIds.size} questions d'entretien`,
  )
}

const only = process.argv[2]
const techIds = readdirSync(ROOT).filter((d) => existsSync(join(ROOT, d, 'tech.yaml')) && (!only || d === only))
techIds.forEach(checkTech)

warnings.forEach((w) => console.log(`  ⚠ ${w}`))
errors.forEach((e) => console.log(`  ✗ ${e}`))
if (errors.length) {
  console.log(`\n${errors.length} erreur(s).`)
  process.exit(1)
}
console.log('✓ Contenu valide.')
