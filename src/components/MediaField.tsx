'use client'

import { useId, useRef, useState } from 'react'
import { UploadCloud, Trash2 } from 'lucide-react'
import { uploadMedia, isVideoUrl, previewUrl } from '@/lib/upload'

/**
 * Image/video field with upload + URL entry + live preview + clear.
 * Used throughout the Homepage editor so every image is uploadable.
 */
export default function MediaField({
  label,
  value,
  onChange,
  prefix = 'cms',
  accept = 'image/*,video/mp4,video/webm',
  aspect = 'aspect-video',
  hint,
}: {
  label?: string
  value: string
  onChange: (url: string) => void
  prefix?: string
  accept?: string
  aspect?: string
  hint?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputId = useId()
  const mediaInputId = `media-input-${inputId}`

  async function handleFile(file: File | undefined) {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const url = await uploadMedia(file, prefix)
      onChange(url)
    } catch (e: any) {
      setError(e?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor={mediaInputId} className="form-label mb-0">{label}</label>
          <button
            type="button"
            className="btn-outline !py-1 !px-2 text-xs"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
          <input
            ref={inputRef}
            id={mediaInputId}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      )}

      <div className={`rounded-lg border ${value ? 'border-slate-300' : 'border-dashed border-slate-300'} bg-slate-50 overflow-hidden ${aspect} flex items-center justify-center relative`}>
        {value ? (
          isVideoUrl(value) ? (
            <video key={value} src={previewUrl(value)} muted playsInline loop autoPlay className="w-full h-full object-cover" />
          ) : (
            <img src={previewUrl(value)} alt={label ? `${label} preview` : 'Media preview'} className="w-full h-full object-cover" />
          )
        ) : (
          <span className="text-xs text-slate-400 px-3 text-center">No media — upload or paste a URL</span>
        )}
        {value && (
          <button
            type="button"
            title="Remove"
            aria-label="Remove media"
            onClick={() => onChange('')}
            className="absolute top-1.5 right-1.5 bg-white/90 rounded-md p-2 shadow-sm hover:bg-white min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-600" />
          </button>
        )}
      </div>

      <input
        className="form-input mt-2 text-xs"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://… or upload above"
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  )
}
