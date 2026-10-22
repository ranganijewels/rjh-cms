'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { navSections, type NavItem } from '@/lib/nav'

interface CommandContextValue {
  isOpen: boolean
  open: () => void
  close: () => void
}

const CommandContext = createContext<CommandContextValue | null>(null)

export function useCommandPalette(): CommandContextValue {
  const ctx = useContext(CommandContext)
  if (!ctx) throw new Error('useCommandPalette must be used inside <CommandPaletteProvider>')
  return ctx
}

/** Icon button that opens the palette; usable anywhere inside the provider. */
export function CommandTrigger({ className = '' }: { className?: string }) {
  const { open } = useCommandPalette()
  return (
    <button
      type="button"
      onClick={open}
      aria-label="Search pages (Command K)"
      className={className}
    >
      <Search className="w-4 h-4" />
    </button>
  )
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  // Global ⌘K / Ctrl+K toggle — listening here means the shortcut works on
  // every screen without wiring each page up.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <CommandContext.Provider value={{ isOpen, open, close }}>
      {children}
      {isOpen && <Palette />}
    </CommandContext.Provider>
  )
}

// Flattened once so filtering stays cheap: every nav item carries its group
// label so results can show where a match lives.
type Result = NavItem & { section: string }

function Palette() {
  const router = useRouter()
  const { close } = useCommandPalette()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const all: Result[] = useMemo(
    () => navSections.flatMap((s) => s.items.map((i) => ({ ...i, section: s.label }))),
    [],
  )

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return all.slice(0, 8)
    return all
      .filter(
        (i) =>
          i.label.toLowerCase().includes(q) ||
          i.href.toLowerCase().includes(q) ||
          i.section.toLowerCase().includes(q) ||
          (i.keywords || []).some((k) => k.includes(q)),
      )
      .slice(0, 8)
  }, [all, query])

  // Reset the cursor whenever the result set changes; keep it in view so
  // keyboard users can see what Enter would open.
  useEffect(() => {
    setActive(0)
  }, [query])
  useEffect(() => {
    const el = document.getElementById(`command-option-${active}`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [active])

  // Focus the input and lock background scroll while the palette is open.
  useEffect(() => {
    inputRef.current?.focus()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  function choose(item: NavItem) {
    close()
    router.push(item.href)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (results.length ? (a + 1) % results.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (results.length ? (a - 1 + results.length) % results.length : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = results[active]
      if (item) choose(item)
    }
  }

  const activeResult = results[active]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search pages"
      className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]"
    >
      <button
        type="button"
        aria-label="Close search"
        onClick={close}
        className="absolute inset-0 h-full w-full cursor-default bg-slate-900/50"
      />
      <div className="card relative w-full max-w-xl overflow-hidden shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-200 px-4">
          <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            role="combobox"
            aria-expanded="true"
            aria-controls="command-list"
            aria-activedescendant={
              activeResult ? `command-option-${active}` : undefined
            }
            aria-label="Search pages and actions"
            placeholder="Jump to a page…"
            className="w-full bg-transparent py-4 text-sm outline-none placeholder:text-slate-400"
          />
          <kbd className="hidden shrink-0 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans text-[10px] text-slate-500 sm:block">
            ESC
          </kbd>
        </div>

        <ul
          id="command-list"
          role="listbox"
          aria-label="Search results"
          className="max-h-72 overflow-y-auto p-2"
        >
          {results.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-slate-500">
              No pages match “{query}”
            </li>
          )}
          {results.map((item, i) => {
            const Icon = item.icon
            const isActive = i === active
            return (
              <li
                key={item.href}
                id={`command-option-${i}`}
                role="option"
                aria-selected={isActive}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(item)}
                className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  isActive ? 'bg-brand-navy text-white' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${isActive ? 'text-brand-gold' : 'text-slate-400'}`}
                  aria-hidden="true"
                />
                <span className="flex-1 truncate">{item.label}</span>
                <span
                  className={`shrink-0 text-xs ${isActive ? 'text-white/60' : 'text-slate-400'}`}
                >
                  {item.section}
                </span>
              </li>
            )
          })}
        </ul>

        <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2 text-[11px] text-slate-500">
          ↑↓ navigate · ↵ open · esc close
        </div>
      </div>
    </div>
  )
}
