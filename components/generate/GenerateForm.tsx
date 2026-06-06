'use client'

import { useState } from 'react'
import { flushSync } from 'react-dom'
import { Wand2 } from 'lucide-react'
import TagInput from './TagInput'
import ResultDisplay from './ResultDisplay'
import type {
  ContentType,
  ContentInputs,
  ProductDescriptionInputs,
  BlogPostInputs,
  EmailInputs,
  SocialMediaInputs,
} from '@/lib/prompts'

const TABS: { value: ContentType; label: string }[] = [
  { value: 'product_description',  label: 'Product' },
  { value: 'blog_post_outline',    label: 'Blog' },
  { value: 'email_composer',       label: 'Email' },
  { value: 'social_media_caption', label: 'Social' },
]

type AllForms = {
  product_description:  ProductDescriptionInputs
  blog_post_outline:    BlogPostInputs
  email_composer:       EmailInputs
  social_media_caption: SocialMediaInputs
}

const initialForms: AllForms = {
  product_description:  { productName: '', keyFeatures: [], tone: 'formal', wordCount: 'standard' },
  blog_post_outline:    { topic: '', targetAudience: '', desiredLength: 'medium' },
  email_composer:       { companyName: '', emailPurpose: '', emailStyle: 'formal', emailLength: 'standard', keyPoints: [] },
  social_media_caption: { platform: 'instagram', topic: '', tone: 'casual', wordCount: 'short' },
}

const inputCls = 'w-full px-4 py-2.5 border border-[#e8e4db] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3f2d]/20 focus:border-[#1b3f2d] transition bg-white text-[#1c1c17] placeholder:text-[#b0a89e]'

const activeLengthCls   = 'border-[#1b3f2d] bg-[#f0f7f3] text-[#1b3f2d]'
const inactiveLengthCls = 'border-[#e8e4db] bg-white text-[#6b6660] hover:border-[#1b3f2d] hover:text-[#1b3f2d]'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-[#a09890] mb-1.5 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-md border font-medium transition whitespace-nowrap ${
        active ? 'border-[#1b3f2d] bg-[#1b3f2d] text-white' : 'border-[#e8e4db] text-[#6b6660] hover:border-[#1b3f2d] hover:text-[#1b3f2d]'
      }`}>
      {label}
    </button>
  )
}

export default function GenerateForm() {
  const [contentType, setContentType] = useState<ContentType>('product_description')
  const [forms, setForms] = useState<AllForms>(initialForms)
  const [result, setResult] = useState('')
  const [variants, setVariants] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tokensUsed, setTokensUsed] = useState<number | null>(null)

  const canGenerate = (() => {
    const f = forms[contentType]
    switch (contentType) {
      case 'product_description':  return (f as ProductDescriptionInputs).productName.trim() !== ''
      case 'blog_post_outline':    return (f as BlogPostInputs).topic.trim() !== ''
      case 'email_composer':       return (f as EmailInputs).companyName.trim() !== '' && (f as EmailInputs).emailPurpose.trim() !== ''
      case 'social_media_caption': return (f as SocialMediaInputs).topic.trim() !== ''
    }
  })()

  function update<T extends ContentType>(type: T, patch: Partial<AllForms[T]>) {
    setForms(prev => ({ ...prev, [type]: { ...prev[type], ...patch } }))
  }

  const handleTabChange = (tab: ContentType) => {
    setContentType(tab)
    setResult('')
    setVariants([])
    setError(null)
    setTokensUsed(null)
  }

  const handleGenerate = async () => {
    if (result) setVariants(prev => [...prev.slice(-4), result])
    setLoading(true); setError(null); setResult(''); setTokensUsed(null)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType, inputs: forms[contentType] }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error || 'Request failed with status ' + response.status)
      }
      if (!response.body) throw new Error('No response body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        flushSync(() => setResult(accumulated))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[#1c1c17] tracking-tight">Generate Content</h1>
        <p className="text-[#6b6660] mt-1 text-sm">Select a content type and fill in the details</p>
      </div>

      {/* Two-column canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ── Left: Form card ── */}
        <div className="bg-white rounded-xl border border-[#e8e4db] shadow-[0_1px_8px_0_rgba(0,0,0,0.04)] overflow-hidden">

          {/* Content type tabs */}
          <div className="grid grid-cols-4 border-b border-[#e8e4db]">
            {TABS.map(tab => (
              <button key={tab.value} onClick={() => handleTabChange(tab.value)}
                className={`py-3 text-xs font-semibold tracking-wide transition border-b-2 ${
                  contentType === tab.value
                    ? 'border-[#1b3f2d] text-[#1b3f2d] bg-white'
                    : 'border-transparent text-[#a09890] hover:text-[#6b6660] bg-[#faf8f3]/60 hover:bg-white/80'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Form fields */}
          <div className="p-5 space-y-5">

            {/* ── Product Description ── */}
            {contentType === 'product_description' && (<>
              <Field label="Product Name">
                <input type="text" value={forms.product_description.productName}
                  onChange={e => update('product_description', { productName: e.target.value })}
                  className={inputCls} placeholder="e.g. EcoBottle Pro" />
              </Field>
              <Field label="Key Features (Enter or comma to add)">
                <TagInput tags={forms.product_description.keyFeatures}
                  onChange={keyFeatures => update('product_description', { keyFeatures })}
                  placeholder="e.g. Stainless steel, 24oz, BPA-free..." />
              </Field>
              <Field label="Tone">
                <div className="flex flex-wrap gap-1.5">
                  {(['formal','casual','playful','authoritative','urgent','empathetic','minimalist'] as const).map(t => (
                    <Chip key={t} label={t.charAt(0).toUpperCase() + t.slice(1)}
                      active={forms.product_description.tone === t}
                      onClick={() => update('product_description', { tone: t })} />
                  ))}
                </div>
              </Field>
              <Field label="Length">
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: 'teaser',   label: 'Teaser',   hint: '50–80 words' },
                    { value: 'standard', label: 'Standard', hint: '120–200 words' },
                    { value: 'extended', label: 'Extended', hint: '250–400 words' },
                  ] as const).map(({ value, label, hint }) => (
                    <button key={value} type="button" onClick={() => update('product_description', { wordCount: value })}
                      className={`px-3 py-2.5 rounded-lg border text-left transition ${forms.product_description.wordCount === value ? activeLengthCls : inactiveLengthCls}`}>
                      <span className="block text-sm font-medium">{label}</span>
                      <span className="block text-xs text-[#a09890] mt-0.5">{hint}</span>
                    </button>
                  ))}
                </div>
              </Field>
            </>)}

            {/* ── Blog Blueprint ── */}
            {contentType === 'blog_post_outline' && (<>
              <Field label="Topic">
                <input type="text" value={forms.blog_post_outline.topic}
                  onChange={e => update('blog_post_outline', { topic: e.target.value })}
                  className={inputCls} placeholder="e.g. Benefits of remote work for small businesses" />
              </Field>
              <Field label="Target Audience">
                <input type="text" value={forms.blog_post_outline.targetAudience}
                  onChange={e => update('blog_post_outline', { targetAudience: e.target.value })}
                  className={inputCls} placeholder="e.g. Small business owners, 30–50 years old" />
              </Field>
              <Field label="Article Scope">
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: 'short',  label: 'Overview',      hint: '~500 words' },
                    { value: 'medium', label: 'Standard',      hint: '~1 000 words' },
                    { value: 'long',   label: 'Comprehensive', hint: '~2 000 words' },
                  ] as const).map(({ value, label, hint }) => (
                    <button key={value} type="button" onClick={() => update('blog_post_outline', { desiredLength: value })}
                      className={`px-3 py-2.5 rounded-lg border text-left transition ${forms.blog_post_outline.desiredLength === value ? activeLengthCls : inactiveLengthCls}`}>
                      <span className="block text-sm font-medium">{label}</span>
                      <span className="block text-xs text-[#a09890] mt-0.5">{hint}</span>
                    </button>
                  ))}
                </div>
              </Field>
            </>)}

            {/* ── Email Composer ── */}
            {contentType === 'email_composer' && (<>
              <Field label="Company / Sender Name">
                <input type="text" value={forms.email_composer.companyName}
                  onChange={e => update('email_composer', { companyName: e.target.value })}
                  className={inputCls} placeholder="e.g. Acme Corp" />
              </Field>
              <Field label="Email Purpose">
                <input type="text" value={forms.email_composer.emailPurpose}
                  onChange={e => update('email_composer', { emailPurpose: e.target.value })}
                  className={inputCls} placeholder="e.g. Invite to a product demo" />
              </Field>
              <Field label="Style">
                <div className="flex flex-wrap gap-1.5">
                  {(['formal','friendly','persuasive','direct','empathetic'] as const).map(s => (
                    <Chip key={s} label={s.charAt(0).toUpperCase() + s.slice(1)}
                      active={forms.email_composer.emailStyle === s}
                      onClick={() => update('email_composer', { emailStyle: s })} />
                  ))}
                </div>
              </Field>
              <Field label="Length">
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: 'brief',    label: 'Brief',    hint: '100–180 words' },
                    { value: 'standard', label: 'Standard', hint: '200–350 words' },
                    { value: 'detailed', label: 'Detailed', hint: '400–600 words' },
                  ] as const).map(({ value, label, hint }) => (
                    <button key={value} type="button" onClick={() => update('email_composer', { emailLength: value })}
                      className={`px-3 py-2.5 rounded-lg border text-left transition ${forms.email_composer.emailLength === value ? activeLengthCls : inactiveLengthCls}`}>
                      <span className="block text-sm font-medium">{label}</span>
                      <span className="block text-xs text-[#a09890] mt-0.5">{hint}</span>
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Key Points (Enter or comma to add)">
                <TagInput tags={forms.email_composer.keyPoints}
                  onChange={keyPoints => update('email_composer', { keyPoints })}
                  placeholder="e.g. 20% discount, Friday deadline..." />
              </Field>
            </>)}

            {/* ── Social Post ── */}
            {contentType === 'social_media_caption' && (<>
              <Field label="Platform">
                <div className="flex flex-wrap gap-1.5">
                  {([['instagram','Instagram'],['linkedin','LinkedIn'],['twitter','Twitter/X'],['facebook','Facebook']] as const).map(([v, l]) => (
                    <Chip key={v} label={l}
                      active={forms.social_media_caption.platform === v}
                      onClick={() => update('social_media_caption', { platform: v })} />
                  ))}
                </div>
              </Field>
              <Field label="Topic">
                <input type="text" value={forms.social_media_caption.topic}
                  onChange={e => update('social_media_caption', { topic: e.target.value })}
                  className={inputCls} placeholder="e.g. New product launch, company milestone" />
              </Field>
              <Field label="Tone">
                <div className="flex gap-1.5">
                  {(['professional','casual','fun'] as const).map(t => (
                    <Chip key={t} label={t.charAt(0).toUpperCase() + t.slice(1)}
                      active={forms.social_media_caption.tone === t}
                      onClick={() => update('social_media_caption', { tone: t })} />
                  ))}
                </div>
              </Field>
              <Field label="Post Length">
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: 'micro',  label: 'Micro',  hint: forms.social_media_caption.platform === 'twitter' ? 'up to 140 chars' : 'up to 50 words' },
                    { value: 'short',  label: 'Short',  hint: forms.social_media_caption.platform === 'twitter' ? 'up to 220 chars' : '60–90 words' },
                    { value: 'medium', label: 'Medium', hint: forms.social_media_caption.platform === 'twitter' ? 'up to 280 chars' : '120–180 words' },
                    { value: 'long',   label: 'Long',   hint: forms.social_media_caption.platform === 'twitter' ? '3–4 tweet thread' : '220–300 words' },
                  ] as const).map(({ value, label, hint }) => (
                    <button key={value} type="button" onClick={() => update('social_media_caption', { wordCount: value })}
                      className={`px-3 py-2.5 rounded-lg border text-left transition ${forms.social_media_caption.wordCount === value ? activeLengthCls : inactiveLengthCls}`}>
                      <span className="block text-sm font-medium">{label}</span>
                      <span className="block text-xs text-[#a09890] mt-0.5">{hint}</span>
                    </button>
                  ))}
                </div>
              </Field>
            </>)}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error === 'CREDIT_BALANCE_LOW' ? (
                  <>API credit balance is too low.{' '}
                    <a href="https://console.anthropic.com/settings/billing" target="_blank" rel="noreferrer" className="underline font-medium hover:text-red-800">
                      Add credits →
                    </a>
                  </>
                ) : error}
              </div>
            )}

            {/* Generate */}
            <button onClick={handleGenerate} disabled={loading || !canGenerate}
              className="w-full bg-[#1b3f2d] hover:bg-[#152e24] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg transition flex items-center justify-center gap-2 text-sm">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating…</>
                : 'Generate'}
            </button>
          </div>
        </div>

        {/* ── Right: Result column (always visible) ── */}
        <div className="lg:sticky lg:top-20">
          {(result || loading) ? (
            <ResultDisplay
              result={result}
              variants={variants}
              loading={loading}
              contentType={contentType}
              inputs={forms[contentType] as ContentInputs}
              onRegenerate={handleGenerate}
              tokensUsed={tokensUsed}
            />
          ) : (
            <div className="bg-white rounded-xl border border-[#e8e4db] shadow-[0_1px_8px_0_rgba(0,0,0,0.04)] min-h-[400px] flex flex-col items-center justify-center gap-3 p-8">
              <div className="w-12 h-12 rounded-xl bg-[#f0ede6] flex items-center justify-center">
                <Wand2 className="w-6 h-6 text-[#b0a89e]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[#3d3d35] mb-1">Ready to generate</p>
                <p className="text-xs text-[#b0a89e] max-w-xs leading-relaxed">
                  Fill in the form and click Generate —<br />your content streams here in real time
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
