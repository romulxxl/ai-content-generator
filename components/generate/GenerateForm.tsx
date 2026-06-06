'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
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

const CONTENT_TYPES: { value: ContentType; label: string; description: string }[] = [
  { value: 'product_description',  label: 'Product Description', description: 'sales-ready copy for product pages & landing pages' },
  { value: 'blog_post_outline',    label: 'Blog Blueprint',      description: 'structured article plan from headline to conclusion' },
  { value: 'email_composer',       label: 'Email Composer',      description: 'complete email for any business or marketing goal' },
  { value: 'social_media_caption', label: 'Social Post',         description: 'ready-to-publish posts for any social media platform' },
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

const inputCls  = 'w-full px-4 py-2.5 border border-[#e8e4db] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3f2d]/20 focus:border-[#1b3f2d] transition bg-white text-[#1c1c17] placeholder:text-[#b0a89e]'
const selectCls = 'w-full appearance-none px-4 py-2.5 border border-[#e8e4db] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3f2d]/20 focus:border-[#1b3f2d] bg-white transition text-[#1c1c17]'

const TOKEN_MARKER = '\n\n__TOKENS__:'
const ERROR_MARKER = '\n\n__ERROR__:'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#3d3d35] mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a09890] pointer-events-none" />
    </div>
  )
}

const activeLengthCls = 'border-[#1b3f2d] bg-[#f0f7f3] text-[#1b3f2d]'
const inactiveLengthCls = 'border-[#e8e4db] bg-white text-[#6b6660] hover:border-[#1b3f2d] hover:text-[#1b3f2d]'

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
    setForms((prev) => ({ ...prev, [type]: { ...prev[type], ...patch } }))
  }

  const handleGenerate = async () => {
    if (result) setVariants((prev) => [...prev.slice(-4), result])
    setLoading(true)
    setError(null)
    setResult('')
    setTokensUsed(null)

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

        const tIdx = accumulated.lastIndexOf(TOKEN_MARKER)
        if (tIdx !== -1) {
          const n = parseInt(accumulated.slice(tIdx + TOKEN_MARKER.length), 10)
          if (!isNaN(n)) setTokensUsed(n)
          setResult(accumulated.slice(0, tIdx))
          break
        }
        const eIdx = accumulated.lastIndexOf(ERROR_MARKER)
        if (eIdx !== -1) {
          const msg = accumulated.slice(eIdx + ERROR_MARKER.length).trim()
          const isLowCredits = msg.includes('credit balance') || msg.includes('insufficient') || msg.includes('billing')
          setError(isLowCredits ? 'CREDIT_BALANCE_LOW' : (msg || 'Generation failed. Please try again.'))
          setResult(accumulated.slice(0, eIdx) || '')
          break
        }
        setResult(accumulated)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#1c1c17] tracking-tight">Generate Content</h1>
        <p className="text-[#6b6660] mt-1 text-sm">Select a content type and fill in the details</p>
      </div>

      <div className="bg-white rounded-xl border border-[#e8e4db] p-4 md:p-6 shadow-[0_1px_8px_0_rgba(0,0,0,0.04)] space-y-5">
        <Field label="Content Type">
          <SelectWrapper>
            <select
              value={contentType}
              onChange={(e) => { setContentType(e.target.value as ContentType); setResult(''); setVariants([]); setError(null); setTokensUsed(null) }}
              className={selectCls}
            >
              {CONTENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label} — {t.description}</option>
              ))}
            </select>
          </SelectWrapper>
        </Field>

        {/* ── Product Description ── */}
        {contentType === 'product_description' && (
          <>
            <Field label="Product Name">
              <input type="text" value={forms.product_description.productName}
                onChange={(e) => update('product_description', { productName: e.target.value })}
                className={inputCls} placeholder="e.g. EcoBottle Pro" />
            </Field>
            <Field label="Key Features (press Enter or comma to add)">
              <TagInput tags={forms.product_description.keyFeatures}
                onChange={(keyFeatures) => update('product_description', { keyFeatures })}
                placeholder="e.g. Stainless steel, 24oz, BPA-free..." />
            </Field>
            <Field label="Tone">
              <SelectWrapper>
                <select value={forms.product_description.tone}
                  onChange={(e) => update('product_description', { tone: e.target.value as ProductDescriptionInputs['tone'] })}
                  className={selectCls}>
                  <option value="formal">Formal</option>
                  <option value="casual">Casual</option>
                  <option value="playful">Playful</option>
                  <option value="authoritative">Authoritative</option>
                  <option value="urgent">Urgent / FOMO</option>
                  <option value="empathetic">Empathetic</option>
                  <option value="minimalist">Minimalist</option>
                </select>
              </SelectWrapper>
            </Field>
            <Field label="Length">
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'teaser',   label: 'Teaser',   hint: '50–80 words' },
                  { value: 'standard', label: 'Standard', hint: '120–200 words' },
                  { value: 'extended', label: 'Extended', hint: '250–400 words' },
                ] as const).map(({ value, label, hint }) => (
                  <button key={value} type="button"
                    onClick={() => update('product_description', { wordCount: value })}
                    className={`px-3 py-2.5 rounded-lg border text-left transition ${forms.product_description.wordCount === value ? activeLengthCls : inactiveLengthCls}`}>
                    <span className="block text-sm font-medium">{label}</span>
                    <span className="block text-xs text-[#a09890] mt-0.5">{hint}</span>
                  </button>
                ))}
              </div>
            </Field>
          </>
        )}

        {/* ── Blog Blueprint ── */}
        {contentType === 'blog_post_outline' && (
          <>
            <Field label="Topic">
              <input type="text" value={forms.blog_post_outline.topic}
                onChange={(e) => update('blog_post_outline', { topic: e.target.value })}
                className={inputCls} placeholder="e.g. Benefits of remote work for small businesses" />
            </Field>
            <Field label="Target Audience">
              <input type="text" value={forms.blog_post_outline.targetAudience}
                onChange={(e) => update('blog_post_outline', { targetAudience: e.target.value })}
                className={inputCls} placeholder="e.g. Small business owners, 30-50 years old" />
            </Field>
            <Field label="Article Scope">
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'short',  label: 'Overview',      hint: '5–7 sections / ~500 words' },
                  { value: 'medium', label: 'Standard',      hint: '7–10 sections / ~1 000 words' },
                  { value: 'long',   label: 'Comprehensive', hint: '10–15 sections / ~2 000 words' },
                ] as const).map(({ value, label, hint }) => (
                  <button key={value} type="button"
                    onClick={() => update('blog_post_outline', { desiredLength: value })}
                    className={`px-3 py-2.5 rounded-lg border text-left transition ${forms.blog_post_outline.desiredLength === value ? activeLengthCls : inactiveLengthCls}`}>
                    <span className="block text-sm font-medium">{label}</span>
                    <span className="block text-xs text-[#a09890] mt-0.5">{hint}</span>
                  </button>
                ))}
              </div>
            </Field>
          </>
        )}

        {/* ── Email Composer ── */}
        {contentType === 'email_composer' && (
          <>
            <Field label="Company / Sender Name">
              <input type="text" value={forms.email_composer.companyName}
                onChange={(e) => update('email_composer', { companyName: e.target.value })}
                className={inputCls} placeholder="e.g. Acme Corp, John from Support" />
            </Field>
            <Field label="Email Purpose">
              <input type="text" value={forms.email_composer.emailPurpose}
                onChange={(e) => update('email_composer', { emailPurpose: e.target.value })}
                className={inputCls} placeholder="e.g. Invite to a product demo, announce a pricing change" />
            </Field>
            <Field label="Style">
              <SelectWrapper>
                <select value={forms.email_composer.emailStyle}
                  onChange={(e) => update('email_composer', { emailStyle: e.target.value as EmailInputs['emailStyle'] })}
                  className={selectCls}>
                  <option value="formal">Formal — precise & professional</option>
                  <option value="friendly">Friendly — warm & approachable</option>
                  <option value="persuasive">Persuasive — benefit-focused, action-driving</option>
                  <option value="direct">Direct — straight to the point</option>
                  <option value="empathetic">Empathetic — understanding & supportive</option>
                </select>
              </SelectWrapper>
            </Field>
            <Field label="Email Length">
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'brief',    label: 'Brief',    hint: '100–180 words' },
                  { value: 'standard', label: 'Standard', hint: '200–350 words' },
                  { value: 'detailed', label: 'Detailed', hint: '400–600 words' },
                ] as const).map(({ value, label, hint }) => (
                  <button key={value} type="button"
                    onClick={() => update('email_composer', { emailLength: value })}
                    className={`px-3 py-2.5 rounded-lg border text-left transition ${forms.email_composer.emailLength === value ? activeLengthCls : inactiveLengthCls}`}>
                    <span className="block text-sm font-medium">{label}</span>
                    <span className="block text-xs text-[#a09890] mt-0.5">{hint}</span>
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Key Points to Highlight (press Enter or comma to add)">
              <TagInput tags={forms.email_composer.keyPoints}
                onChange={(keyPoints) => update('email_composer', { keyPoints })}
                placeholder="e.g. 20% discount, Friday deadline, free trial..." />
            </Field>
          </>
        )}

        {/* ── Social Post ── */}
        {contentType === 'social_media_caption' && (
          <>
            <Field label="Platform">
              <SelectWrapper>
                <select value={forms.social_media_caption.platform}
                  onChange={(e) => update('social_media_caption', { platform: e.target.value as SocialMediaInputs['platform'] })}
                  className={selectCls}>
                  <option value="instagram">Instagram</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="twitter">Twitter / X</option>
                  <option value="facebook">Facebook</option>
                </select>
              </SelectWrapper>
            </Field>
            <Field label="Topic">
              <input type="text" value={forms.social_media_caption.topic}
                onChange={(e) => update('social_media_caption', { topic: e.target.value })}
                className={inputCls} placeholder="e.g. New product launch, company milestone" />
            </Field>
            <Field label="Tone">
              <SelectWrapper>
                <select value={forms.social_media_caption.tone}
                  onChange={(e) => update('social_media_caption', { tone: e.target.value as SocialMediaInputs['tone'] })}
                  className={selectCls}>
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="fun">Fun</option>
                </select>
              </SelectWrapper>
            </Field>
            <Field label="Post Length">
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'micro',  label: 'Micro',  hint: forms.social_media_caption.platform === 'twitter' ? 'up to 140 chars' : 'up to 50 words' },
                  { value: 'short',  label: 'Short',  hint: forms.social_media_caption.platform === 'twitter' ? 'up to 220 chars' : '60–90 words' },
                  { value: 'medium', label: 'Medium', hint: forms.social_media_caption.platform === 'twitter' ? 'up to 280 chars' : '120–180 words' },
                  { value: 'long',   label: 'Long',   hint: forms.social_media_caption.platform === 'twitter' ? '3–4 tweet thread' : '220–300 words' },
                ] as const).map(({ value, label, hint }) => (
                  <button key={value} type="button"
                    onClick={() => update('social_media_caption', { wordCount: value })}
                    className={`px-3 py-2.5 rounded-lg border text-left transition ${forms.social_media_caption.wordCount === value ? activeLengthCls : inactiveLengthCls}`}>
                    <span className="block text-sm font-medium">{label}</span>
                    <span className="block text-xs text-[#a09890] mt-0.5">{hint}</span>
                  </button>
                ))}
              </div>
            </Field>
          </>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error === 'CREDIT_BALANCE_LOW' ? (
              <>
                API credit balance is too low.{' '}
                <a href="https://console.anthropic.com/settings/billing" target="_blank" rel="noreferrer"
                  className="underline font-medium hover:text-red-800">
                  Add credits →
                </a>
              </>
            ) : error}
          </div>
        )}

        <button onClick={handleGenerate} disabled={loading || !canGenerate}
          className="w-full bg-[#1b3f2d] hover:bg-[#152e24] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg transition flex items-center justify-center gap-2 text-sm">
          {loading ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating…</>
          ) : 'Generate'}
        </button>
      </div>

      {(result || loading) && (
        <ResultDisplay
          result={result}
          variants={variants}
          loading={loading}
          contentType={contentType}
          inputs={forms[contentType] as ContentInputs}
          onRegenerate={handleGenerate}
          tokensUsed={tokensUsed}
        />
      )}
    </div>
  )
}
