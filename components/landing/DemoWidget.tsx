'use client'

import { useState } from 'react'
import { Zap, RefreshCw, Copy, CheckCircle, ArrowRight } from 'lucide-react'
import MarkdownContent from '@/components/shared/MarkdownContent'

const DEMO_LIMIT = 3
const TOKEN_MARKER = '\n\n__TOKENS__:'
const ERROR_MARKER = '\n\n__ERROR__:'

const TEMPLATES = [
  {
    label: 'AirPods Pro',
    productName: 'AirPods Pro 2',
    keyFeatures: ['Active Noise Cancellation', 'Spatial Audio', 'H2 chip', 'Adaptive Transparency'],
  },
  {
    label: 'Mechanical KB',
    productName: 'Keychron Q1 Pro',
    keyFeatures: ['hot-swappable switches', 'gasket mount', 'wireless', 'aluminum frame'],
  },
  {
    label: 'Running Shoes',
    productName: 'Nike Pegasus 41',
    keyFeatures: ['React foam', 'breathable mesh', 'wide toe box', 'versatile daily trainer'],
  },
]

export default function DemoWidget() {
  const [productName, setProductName] = useState(TEMPLATES[0].productName)
  const [keyFeatures, setKeyFeatures] = useState<string[]>(TEMPLATES[0].keyFeatures)
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tokensUsed, setTokensUsed] = useState<number | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [limitReached, setLimitReached] = useState(false)
  const [copied, setCopied] = useState(false)

  const applyTemplate = (t: typeof TEMPLATES[0]) => {
    setProductName(t.productName)
    setKeyFeatures(t.keyFeatures)
    setResult('')
    setError(null)
    setTokensUsed(null)
  }

  const handleGenerate = async () => {
    if (!productName.trim() || loading) return
    setLoading(true)
    setError(null)
    setResult('')
    setTokensUsed(null)

    try {
      const response = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName, keyFeatures }),
      })

      if (response.status === 429) {
        setLimitReached(true)
        setRemaining(0)
        setLoading(false)
        return
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error || 'Request failed')
      }

      const rem = Number(response.headers.get('X-Demo-Remaining') ?? DEMO_LIMIT - 1)
      setRemaining(rem)

      if (!response.body) throw new Error('No response body')
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      for (;;) {
        const { done, value } = await reader.read()
        if (done) break

        accumulated += decoder.decode(value, { stream: true })

        const tIdx = accumulated.lastIndexOf(TOKEN_MARKER)
        if (tIdx !== -1) {
          const n = parseInt(accumulated.slice(tIdx + TOKEN_MARKER.length), 10)
          if (!isNaN(n)) setTokensUsed(n)
          setResult(accumulated.slice(0, tIdx))
          break
        }

        const eIdx = accumulated.lastIndexOf(ERROR_MARKER)
        if (eIdx !== -1) {
          setError(accumulated.slice(eIdx + ERROR_MARKER.length).trim() || 'Generation failed')
          setResult('')
          break
        }

        setResult(accumulated)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* ignore */ }
  }

  const displayRemaining = remaining !== null ? remaining : DEMO_LIMIT

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="ml-3 text-sm font-medium text-slate-600">Live demo</span>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
          limitReached
            ? 'bg-red-50 text-red-600'
            : displayRemaining <= 1
            ? 'bg-amber-50 text-amber-600'
            : 'bg-teal-50 text-teal-600'
        }`}>
          {limitReached ? 'Limit reached' : `${displayRemaining} generation${displayRemaining !== 1 ? 's' : ''} left`}
        </span>
      </div>

      <div className="p-6 space-y-4">
        {/* Quick templates */}
        <div className="flex gap-2 flex-wrap">
          {TEMPLATES.map((t) => (
            <button
              key={t.label}
              onClick={() => applyTemplate(t)}
              className={`text-xs px-3 py-1.5 rounded-full border transition ${
                productName === t.productName
                  ? 'border-teal-500 bg-teal-50 text-teal-700 font-medium'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">
            Product name
          </label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="e.g. iPhone 15 Pro"
            maxLength={100}
            disabled={limitReached}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Features tags */}
        {keyFeatures.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {keyFeatures.map((f) => (
              <span key={f} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                {f}
              </span>
            ))}
          </div>
        )}

        {/* Generate button */}
        {!limitReached ? (
          <button
            onClick={handleGenerate}
            disabled={loading || !productName.trim()}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Generate description
              </>
            )}
          </button>
        ) : (
          <div className="text-center py-2">
            <p className="text-sm text-slate-500 mb-3">
              You&apos;ve used all 3 free demo generations.
            </p>
            <a
              href="/signup"
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium px-5 py-2.5 rounded-lg transition"
            >
              Create free account for unlimited access
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Result */}
        {(result || (loading && !result)) && (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
              <span className="text-xs font-medium text-slate-500">Generated result</span>
              <div className="flex items-center gap-2">
                {tokensUsed !== null && (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Zap className="w-3 h-3 text-amber-400" />
                    {tokensUsed} tokens
                  </span>
                )}
                {result && !loading && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition"
                  >
                    {copied ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                )}
                {result && !loading && !limitReached && (
                  <button
                    onClick={handleGenerate}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry
                  </button>
                )}
              </div>
            </div>
            <div className="p-4 min-h-[80px]">
              {loading && !result && (
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="w-3.5 h-3.5 border-2 border-teal-200 border-t-teal-500 rounded-full animate-spin" />
                  <span className="text-sm">Claude is writing…</span>
                </div>
              )}
              {result && <MarkdownContent content={result} />}
            </div>
          </div>
        )}

        {/* Post-result CTA */}
        {result && !loading && !limitReached && (
          <div className="flex items-center justify-between text-sm pt-1">
            <span className="text-slate-400">Want to generate blog posts, emails & social posts too?</span>
            <a href="/signup" className="flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium transition">
              Sign up free <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
