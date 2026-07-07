'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Gem, Diamond, Award, Crown, Sparkles, Truck, RotateCcw, ShieldCheck,
  BadgeCheck, Lock, Heart, Gift, Leaf, Headphones, ScrollText, Star,
  type LucideIcon,
} from 'lucide-react'

// Curated, jewelry-relevant icon set. The stored value is the KEY (e.g. "gem"),
// which the storefront maps to the same lucide icon — so features render as real
// SVGs, not typed emoji. Keys MUST stay in sync with the storefront's map.
export const FEATURE_ICONS: Record<string, LucideIcon> = {
  gem: Gem,
  diamond: Diamond,
  award: Award,
  crown: Crown,
  sparkles: Sparkles,
  truck: Truck,
  undo: RotateCcw,
  shield: ShieldCheck,
  badge: BadgeCheck,
  lock: Lock,
  heart: Heart,
  gift: Gift,
  leaf: Leaf,
  headset: Headphones,
  certificate: ScrollText,
  star: Star,
}

// Legacy content stored emoji — map the common ones to a key so existing sections
// upgrade to SVG automatically (and the picker highlights the right icon).
export const EMOJI_ALIAS: Record<string, string> = {
  '💎': 'gem', '🏆': 'award', '🚚': 'truck', '🚛': 'truck', '↩️': 'undo',
  '🔄': 'undo', '✨': 'sparkles', '🛡️': 'shield', '🛡': 'shield', '🎁': 'gift',
  '❤️': 'heart', '👑': 'crown', '🔒': 'lock', '🌿': 'leaf', '⭐': 'star',
  '🎧': 'headset', '📜': 'certificate', '✅': 'badge',
}

export function resolveIconKey(value?: string): string {
  if (!value) return ''
  if (FEATURE_ICONS[value]) return value
  return EMOJI_ALIAS[value] || ''
}

export default function IconPicker({
  value,
  onChange,
}: {
  value?: string
  onChange: (key: string) => void
}) {
  const [open, setOpen] = useState(false)
  const activeKey = resolveIconKey(value)
  const ActiveIcon = activeKey ? FEATURE_ICONS[activeKey] : null
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    // Move focus into the popover on open.
    const firstOption = popoverRef.current?.querySelector<HTMLButtonElement>('button')
    firstOption?.focus()
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Choose an icon"
        aria-label={activeKey ? `Icon: ${activeKey}` : 'Choose an icon'}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-14 h-11 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
      >
        {ActiveIcon ? (
          <ActiveIcon className="w-5 h-5" />
        ) : value ? (
          // Unknown legacy emoji/text — show it so nothing is lost.
          <span className="text-lg leading-none">{value}</span>
        ) : (
          <Sparkles className="w-5 h-5 text-slate-300" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            ref={popoverRef}
            role="listbox"
            aria-label="Icon options"
            className="absolute z-20 mt-1 left-0 w-full max-w-[90vw] sm:w-56 md:w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-lg grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1"
          >
            {Object.entries(FEATURE_ICONS).map(([key, Icon]) => (
              <button
                key={key}
                type="button"
                title={key}
                role="option"
                aria-selected={key === activeKey}
                aria-label={key}
                aria-pressed={key === activeKey}
                onClick={() => {
                  onChange(key)
                  setOpen(false)
                }}
                className={`aspect-square flex items-center justify-center rounded-lg border transition ${
                  key === activeKey
                    ? 'border-brand-500 bg-brand-500/10 text-brand-700'
                    : 'border-transparent hover:bg-slate-100 text-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
