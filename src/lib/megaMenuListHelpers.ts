// Plain helper for editing a repeatable array of card items — deliberately
// NOT named `useX` (it holds no state itself, just closures over the caller's
// setter) so eslint's rules-of-hooks doesn't flag calling it inside a .map().
export function makeListHelpers<T>(
  items: T[],
  setItems: (next: T[]) => void,
  blank: () => T
) {
  return {
    update: (i: number, patch: Partial<T>) =>
      setItems(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it))),
    remove: (i: number) => setItems(items.filter((_, idx) => idx !== i)),
    add: () => setItems([...items, blank()]),
    move: (i: number, dir: number) => {
      const j = i + dir
      if (j < 0 || j >= items.length) return
      const next = [...items]
      ;[next[i], next[j]] = [next[j], next[i]]
      setItems(next)
    },
  }
}
