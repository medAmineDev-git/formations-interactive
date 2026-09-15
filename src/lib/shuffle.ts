export function shuffle<T>(items: T[]) {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Indices 0..n-1 dans un ordre aléatoire : sert à mélanger l'affichage des choix d'un QCM. */
export const shuffledIndices = (n: number) => shuffle([...Array(n).keys()])
