'use client'

import { useState, useEffect } from 'react'
import { Copy, RefreshCw, Save, CheckCircle, ChevronLeft, ChevronRight, Zap } from 'lucide-react'
import type { ContentType, ContentInputs } from '@/lib/prompts'
import MarkdownContent from '@/components/shared/MarkdownContent'

interface ResultDisplayProps {
  result: string
  variants: string[]
  loading: boolean
  contentType: ContentType
  inputs: ContentInputs
  onRegenerate: () => void
  tokensUsed: number | null
}

export default function ResultDisplay({
  result, variants, loading, contentType, inputs, onRegenerate, tokensUsed,
}: ResultDisplayProps) {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [activeVariant, setActiveVariant] = useState<number | null>(null)

  useEffect(() => { if (loading) setActiveVariant(null) }, [loading])
  useEffect(() => { setActiveVariant(null) }, [variants.length])

  const displayText = activeVariant !== null ? variants[activeVariant] : result
  const totalVersions = variants.length + (result ? 1 : 0)
  const currentIndex = activeVariant !== null ? activeVariant : variants.length

  const handleCopy = async () => {
    if (!displayText) return
    try {
      await navigator.clipboard.writeText(displayText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopyError(true)
      setTimeout(() => setCopyError(false), 2000)
    }
  }

  const handleSave = async () => {
    if (!result || saving || loading) return
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType, inputs, result, tokensUsed }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error || 'Failed to save')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[#e8e4db] shadow-[0_1px_8px_0_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#eeebe3]">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-[#1c1c17] text-sm">Generated Result</h3>
          {!loading && tokensUsed !== null && (
            <span className="flex items-center gap-1 text-xs text-[#a09890]">
              <Zap className="w-3 h-3 text-amber-400" />
              {tokensUsed.toLocaleString()} tokens
            </span>
          )}
          {loading && !result && (
            <span className="text-xs text-[#a09890] animate-pulse">Generating…</span>
          )}
        </div>

        {!loading && result && (
          <div className="flex items-center gap-2">
            <button onClick={handleCopy} aria-label="Copy result"
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition ${
                copyError ? 'border-red-200 text-red-600 bg-red-50' : 'border-[#e8e4db] hover:bg-[#faf8f3] text-[#6b6660]'
              }`}>
              {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : copyError ? 'Failed' : 'Copy'}
            </button>
            <button onClick={onRegenerate} aria-label="Regenerate"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[#e8e4db] hover:bg-[#faf8f3] transition text-[#6b6660]">
              <RefreshCw className="w-3.5 h-3.5" />Regenerate
            </button>
            <button onClick={handleSave} disabled={saving || saved} aria-label="Save to history"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#1b3f2d] hover:bg-[#152e24] text-white transition disabled:opacity-60">
              {saved ? <CheckCircle className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {saved ? 'Saved!' : saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Variant navigation */}
      {totalVersions > 1 && (
        <div className="flex items-center gap-2 px-6 py-2 border-b border-[#eeebe3] bg-[#faf8f3]">
          <button disabled={currentIndex === 0}
            onClick={() => setActiveVariant(currentIndex - 1 === variants.length ? null : currentIndex - 1)}
            className="p-1 rounded hover:bg-[#e8e4db] disabled:opacity-30 transition">
            <ChevronLeft className="w-3.5 h-3.5 text-[#6b6660]" />
          </button>
          <span className="text-xs text-[#6b6660]">
            Version {currentIndex + 1} of {totalVersions}
            {currentIndex === variants.length && !loading && (
              <span className="ml-1.5 text-[#2d6e4a] font-medium">latest</span>
            )}
          </span>
          <button disabled={currentIndex === variants.length}
            onClick={() => setActiveVariant(currentIndex + 1 >= variants.length ? null : currentIndex + 1)}
            className="p-1 rounded hover:bg-[#e8e4db] disabled:opacity-30 transition">
            <ChevronRight className="w-3.5 h-3.5 text-[#6b6660]" />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="p-6 min-h-[120px]">
        {loading && !result && (
          <div className="flex items-center gap-3 text-[#a09890]">
            <span className="w-4 h-4 border-2 border-[#1b3f2d]/20 border-t-[#1b3f2d] rounded-full animate-spin inline-block" />
            <span className="text-sm">Claude is generating…</span>
          </div>
        )}

        {displayText && (
          <div>
            <MarkdownContent content={displayText} />
            {loading && activeVariant === null && (
              <span className="inline-block w-2 h-4 bg-[#1b3f2d] animate-pulse ml-0.5 align-text-bottom rounded-sm" />
            )}
          </div>
        )}

        {saveError && (
          <p className="mt-3 text-sm text-red-600 border-t border-red-100 pt-3">{saveError}</p>
        )}
      </div>
    </div>
  )
}
