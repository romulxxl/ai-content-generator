'use client'

import { useState, useEffect } from 'react'
import { Copy, RefreshCw, Save, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ContentType, ContentInputs } from '@/lib/prompts'

interface ResultDisplayProps {
  result: string
  variants: string[]
  loading: boolean
  contentType: ContentType
  inputs: ContentInputs
  onRegenerate: () => void
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

const WORD_RANGE: Record<ContentType, string> = {
  product_description: '100–200 words',
  blog_post_outline: '200–400 words',
  email_subject_lines: '60–120 words',
  social_media_caption: '20–80 words',
}

export default function ResultDisplay({
  result,
  variants,
  loading,
  contentType,
  inputs,
  onRegenerate,
}: ResultDisplayProps) {
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [activeVariant, setActiveVariant] = useState<number | null>(null)

  // When new generation starts, reset to current result view
  useEffect(() => {
    if (loading) setActiveVariant(null)
  }, [loading])

  // When new variant arrives, reset to current
  useEffect(() => {
    setActiveVariant(null)
  }, [variants.length])

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
      // ignore
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
        body: JSON.stringify({ contentType, inputs, result }),
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

  const isError = displayText
    ? /\[Error:\s*[\s\S]+?\]$/.test(displayText)
    : false

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-800 text-sm">Generated Result</h3>
          {!loading && displayText && !isError && (
            <span className="text-xs text-gray-400">
              {wordCount(displayText)} words
              <span className="ml-1 text-gray-300">/ rec. {WORD_RANGE[contentType]}</span>
            </span>
          )}
        </div>

        {!loading && result && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition text-gray-600"
            >
              {copied ? (
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={onRegenerate}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition text-gray-600"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Regenerate
            </button>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-60"
            >
              {saved ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {saved ? 'Saved!' : saving ? 'Saving...' : 'Save to History'}
            </button>
          </div>
        )}
      </div>

      {/* Variant navigation */}
      {totalVersions > 1 && (
        <div className="flex items-center gap-2 px-6 py-2 border-b border-gray-100 bg-gray-50">
          <button
            disabled={currentIndex === 0}
            onClick={() => setActiveVariant(currentIndex - 1 === variants.length ? null : currentIndex - 1)}
            className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
          </button>
          <span className="text-xs text-gray-500">
            Version {currentIndex + 1} of {totalVersions}
            {currentIndex === variants.length && !loading && (
              <span className="ml-1.5 text-indigo-500 font-medium">latest</span>
            )}
          </span>
          <button
            disabled={currentIndex === variants.length}
            onClick={() => setActiveVariant(currentIndex + 1 >= variants.length ? null : currentIndex + 1)}
            className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition"
          >
            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>
      )}

      <div className="p-6 min-h-[100px]">
        {loading && !result && (
          <div className="flex items-center gap-3 text-gray-400">
            <span className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin inline-block" />
            <span className="text-sm">Claude is generating...</span>
          </div>
        )}

        {displayText && (() => {
          const errorMatch = displayText.match(/\[Error:\s*([\s\S]+?)\]$/)
          if (errorMatch) {
            const msg = errorMatch[1].trim()
            const isLowCredits = msg.includes('credit balance')
            return (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-medium text-red-700 mb-1">Generation failed</p>
                {isLowCredits ? (
                  <p className="text-sm text-red-600">
                    Your Anthropic API credit balance is too low.{' '}
                    <a href="https://console.anthropic.com/settings/billing" target="_blank" rel="noreferrer"
                      className="underline font-medium hover:text-red-700">
                      Add credits in Anthropic Console →
                    </a>
                  </p>
                ) : (
                  <p className="text-sm text-red-600">{msg}</p>
                )}
              </div>
            )
          }
          return (
            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">
              {displayText}
              {loading && activeVariant === null && (
                <span className="inline-block w-2 h-4 bg-indigo-600 animate-pulse ml-0.5 align-text-bottom rounded-sm" />
              )}
            </pre>
          )
        })()}

        {saveError && (
          <p className="mt-3 text-sm text-red-600 border-t border-red-100 pt-3">
            {saveError}
          </p>
        )}
      </div>
    </div>
  )
}
