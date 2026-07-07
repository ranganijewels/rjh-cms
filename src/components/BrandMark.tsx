type BrandMarkProps = {
  size?: number
  rounded?: string
  className?: string
}

/**
 * Shared brand gradient mark ("RJ" monogram) used in the Sidebar and Login page.
 * Uses the brand-500 -> brand-700 Tailwind tokens so the gradient stays in sync
 * with tailwind.config.ts instead of being duplicated as a hardcoded hex string.
 */
export default function BrandMark({ size = 36, rounded = 'rounded-lg', className = '' }: BrandMarkProps) {
  return (
    <div
      className={`flex items-center justify-center text-white font-bold bg-gradient-to-br from-brand-500 to-brand-700 ${rounded} ${className}`}
      style={{ width: size, height: size }}
    >
      RJ
    </div>
  )
}
