'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import TagInput from './TagInput'
import ResultDisplay from './ResultDisplay'
import type { ContentType, ContentInputs } from '@/lib/prompts'

const CONTENT_TYPES: { value: ContentType; label: string; description: string }[] = [
  { value: 'product_description',  label: 'Product Description', description: 'sales-ready copy for product pages & landing pages' },
  { value: 'blog_post_outline',    label: 'Blog Blueprint',      description: 'structured article plan from headline to conclusion' },
  { value: 'email_composer',       label: 'Email Composer',      description: 'complete email for any business or marketing goal' },
  { value: 'social_media_caption', label: 'Social Post',         description: 'ready-to-publish posts for any social media platform' },
]

type ProductDescriptionForm = { productName: string; keyFeatures: string[]; tone: 'formal' | 'casual' | 'playful' | 'authoritative' | 'urgent' | 'empathetic' | 'minimalist' }
type BlogPostForm           = { topic: string; targetAudience: string; desiredLength: 'short' | 'medium' | 'long' }
type EmailForm              = { companyName: string; emailPurpose: string; emailStyle: 'formal' | 'friendly' | 'persuasive' | 'direct' | 'empathetic'; emailLength: 'brief' | 'standard' | 'detailed'; keyPoints: string[] }
type SocialMediaForm        = { platform: 'instagram' | 'linkedin' | 'twitter' | 'facebook'; topic: string; tone: 'professional' | 'casual' | 'fun'; wordCount: 'micro' | 'short' | 'medium' | 'long' }

type AllForms = {
  product_description:  ProductDescriptionForm
  blog_post_outline:    BlogPostForm
  email_composer:       EmailForm
  social_media_caption: SocialMediaForm
}

const initialForms: AllForms = {
  product_description:  { productName: '', keyFeatures: [], tone: 'formal' },
  blog_post_outline:    { topic: '', targetAudience: '', desiredLength: 'medium' },
  email_composer:       { companyName: '', emailPurpose: '', emailStyle: 'formal', emailLength: 'standard', keyPoints: [] },
  social_media_caption: { platform: 'instagram', topic: '', tone: 'casual', wordCount: 'short' },
}

const inputCls  = 'w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition'
const selectCls = 'w-full appearance-none px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white transition'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  )
}

export default function GenerateForm() {
  const [contentType, setContentType] = useState<ContentType>('product_description')
  const [forms, setForms] = useState<AllForms>(initialForms)
  const [result, setResult] = useState('')
  const [variants, setVariants] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  function update<T extends ContentType>(type: T, patch: Partial<AllForms[T]>) {
    setForms((prev) => ({ ...prev, [type]: { ...prev[type], ...patch } }))
  }

  const handleGenerate = async () => {
    if (result) setVariants((prev) => [...prev.slice(-4), result])
    setLoading(true)
    setError(null)
    setSaveError(null)
    setResult('')

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
      let fullResult = ''

      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullResult += chunk
        setResult((prev) => prev + chunk)
      }

      if (fullResult) {
        try {
          const saveRes = await fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contentType, inputs: forms[contentType], result: fullResult }),
          })
          if (!saveRes.ok) {
            const data = await saveRes.json().catch(() => ({}))
            throw new Error((data as { error?: string }).error || 'Failed to save to history')
          }
        } catch (err) {
          setSaveError(err instanceof Error ? err.message : 'Auto-save to history failed')
        }
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
        <h1 className="text-2xl font-bold text-gray-900">Generate Content</h1>
        <p className="text-gray-500 mt-1 text-sm">Select a content type and fill in the details</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
        <Field label="Content Type">
          <SelectWrapper>
            <select
              value={contentType}
              onChange={(e) => { setContentType(e.target.value as ContentType); setResult(''); setVariants([]); setError(null) }}
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
              <TagInput
                tags={forms.product_description.keyFeatures}
                onChange={(keyFeatures) => update('product_description', { keyFeatures })}
                placeholder="e.g. Stainless steel, 24oz, BPA-free..." />
            </Field>
            <Field label="Tone">
              <SelectWrapper>
                <select value={forms.product_description.tone}
                  onChange={(e) => update('product_description', { tone: e.target.value as ProductDescriptionForm['tone'] })}
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
            <Field label="Desired Length">
              <SelectWrapper>
                <select value={forms.blog_post_outline.desiredLength}
                  onChange={(e) => update('blog_post_outline', { desiredLength: e.target.value as BlogPostForm['desiredLength'] })}
                  className={selectCls}>
                  <option value="short">Short (5-7 sections)</option>
                  <option value="medium">Medium (7-10 sections)</option>
                  <option value="long">Long (10-15 sections)</option>
                </select>
              </SelectWrapper>
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
                  onChange={(e) => update('email_composer', { emailStyle: e.target.value as EmailForm['emailStyle'] })}
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
                {(
                  [
                    { value: 'brief',    label: 'Brief',    hint: '100–180 words' },
                    { value: 'standard', label: 'Standard', hint: '200–350 words' },
                    { value: 'detailed', label: 'Detailed', hint: '400–600 words' },
                  ] as const
                ).map(({ value, label, hint }) => (
                  <button key={value} type="button"
                    onClick={() => update('email_composer', { emailLength: value })}
                    className={`px-3 py-2.5 rounded-lg border text-left transition ${
                      forms.email_composer.emailLength === value
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}>
                    <span className="block text-sm font-medium">{label}</span>
                    <span className="block text-xs text-gray-400 mt-0.5">{hint}</span>
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Key Points to Highlight (press Enter or comma to add)">
              <TagInput
                tags={forms.email_composer.keyPoints}
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
                  onChange={(e) => update('social_media_caption', { platform: e.target.value as SocialMediaForm['platform'] })}
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
                  onChange={(e) => update('social_media_caption', { tone: e.target.value as SocialMediaForm['tone'] })}
                  className={selectCls}>
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="fun">Fun</option>
                </select>
              </SelectWrapper>
            </Field>
            <Field label="Post Length">
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { value: 'micro',  label: 'Micro',  hint: forms.social_media_caption.platform === 'twitter' ? 'up to 140 chars' : forms.social_media_caption.platform === 'facebook' ? '40–70 words' : 'up to 50 words' },
                    { value: 'short',  label: 'Short',  hint: forms.social_media_caption.platform === 'twitter' ? 'up to 220 chars' : forms.social_media_caption.platform === 'linkedin' ? '80–130 words' : forms.social_media_caption.platform === 'facebook' ? '80–130 words' : '60–90 words' },
                    { value: 'medium', label: 'Medium', hint: forms.social_media_caption.platform === 'twitter' ? 'up to 280 chars' : forms.social_media_caption.platform === 'linkedin' ? '180–280 words' : forms.social_media_caption.platform === 'facebook' ? '150–250 words' : '120–180 words' },
                    { value: 'long',   label: 'Long',   hint: forms.social_media_caption.platform === 'twitter' ? '3–4 tweet thread' : forms.social_media_caption.platform === 'linkedin' ? '350–500 words' : forms.social_media_caption.platform === 'facebook' ? '300–450 words' : '220–300 words' },
                  ] as const
                ).map(({ value, label, hint }) => (
                  <button key={value} type="button"
                    onClick={() => update('social_media_caption', { wordCount: value })}
                    className={`px-3 py-2.5 rounded-lg border text-left transition ${
                      forms.social_media_caption.wordCount === value
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}>
                    <span className="block text-sm font-medium">{label}</span>
                    <span className="block text-xs text-gray-400 mt-0.5">{hint}</span>
                  </button>
                ))}
              </div>
            </Field>
          </>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {saveError && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg text-sm">
            Auto-save failed: {saveError}
          </div>
        )}

        <button onClick={handleGenerate} disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition flex items-center justify-center gap-2">
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </>
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
        />
      )}
    </div>
  )
}
