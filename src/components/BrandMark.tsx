type BrandMarkProps = {
  size?: number
  width?: number
  variant?: 'wordmark' | 'wordmark-inverted' | 'monogram'
  rounded?: string
  className?: string
}

/**
 * Brand marks used in the Sidebar and Login page.
 *
 * - "wordmark" is the Rangani Jewelry House logo (public/brand/rangani-wordmark.svg),
 *   a wide 636x219 SVG. The intrinsic width/height are always set so the browser
 *   reserves the right box before the image loads (no layout shift).
 * - "wordmark-inverted" is the same wordmark with white fills, for dark panels.
 * - "monogram" is the gradient "RJ" square, kept for the collapsed sidebar rail
 *   (the wide wordmark is illegible at 64px) and for the favicon.
 */
export default function BrandMark({
  size = 36,
  width = 132,
  variant = 'monogram',
  rounded = 'rounded-lg',
  className = '',
}: BrandMarkProps) {
  if (variant === 'wordmark' || variant === 'wordmark-inverted') {
    const inverted = variant === 'wordmark-inverted'
    return (
      <img
        src={inverted ? '/brand/rangani-wordmark-white.svg' : '/brand/rangani-wordmark.svg'}
        alt="Rangani Jewelry House"
        width={636}
        height={219}
        className={`h-auto w-auto ${className}`}
        style={{ width }}
      />
    )
  }

  return (
    <div
      className={`flex items-center justify-center text-white font-bold bg-gradient-to-br from-brand-500 to-brand-700 ${rounded} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      RJ
    </div>
  )
}
