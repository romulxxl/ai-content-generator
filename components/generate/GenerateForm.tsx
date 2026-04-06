'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import TagInput from './TagInput'
import ResultDisplay from './ResultDisplay'
import type { ContentType, ContentInputs } from '@/lib/prompts'

const CONTENT_TYPES: { value: ContentType; label: string; description: string }[] = [
  { value: 'product_description', label: 'Product Description', description: 'Compelling copy for your product' },
  { value: 'blog_post_outline', label: 'Blog Post Outline', description: 'Structured outline for your article' },
  { value: 'email_subject_lines', label: 'Email Subject Lines', description: 'Generate 5 high-converting options' },
  { value: 'social_media_caption', label: 'Social Media Caption', description: 'Platform-optimised captions' },
]

type ProductDescriptionForm = { productName: string; keyFeatures: string[]; tone: 'formal' | 'casual' | 'playful' | 'authoritative' | 'urgent' | 'empathetic' | 'minimalist' }
type BlogPostForm = { topic: string; targetAudience: string; desiredLength: 'short' | 'medium' | 'long' }
type EmailSubjectForm = { campaignGoal: string; productName: string }
type SocialMediaForm = { platform: 'instagram' | 'linkedin' | 'twitter'; topic: string; tone: 'professional' | 'casual' | 'fun' }

type AllForms = {
  product_description: ProductDescriptionForm
  blog_post_outline: BlogPostForm
  email_subject_lines: EmailSubjectForm
  social_media_caption: SocialMediaForm
}

const initialForms: AllForms = {
  product_description: { productName: '', keyFeatures: [], tone: 'formal' },
  blog_post_outline: { topic: '', targetAudience: '', desiredLength: 'medium' },
  email_subject_lines: { campaignGoal: '', productName: '' },
  social_media_caption: { platform: 'instagram', topic: '', tone: 'casual' },
}

const inputCls = 'w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition'
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

  function update<T extends ContentType>(type: T, patch: Partial<AllForms[T]>) {
    setForms((prev) => ({ ...prev, [type]: { ...prev[type], ...patch } }))
  }

  const handleGenerate = async () => {
    if (result) setVariants((prev) => [...prev.slice(-4), result])
    setLoading(true)
    setError(null)
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

      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        setResult((prev) => prev + decoder.decode(value, { stream: true }))
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
                  onChange={(e) => update('product_description', { tone: e.target.value as 'formal' | 'casual' | 'playful' })}
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
                  onChange={(e) => update('blog_post_outline', { desiredLength: e.target.value as 'short' | 'medium' | 'long' })}
                  className={selectCls}>
                  <option value="short">Short (5-7 sections)</option>
                  <option value="medium">Medium (7-10 sections)</option>
                  <option value="long">Long (10-15 sections)</option>
                </select>
              </SelectWrapper>
            </Field>
          </>
        )}

        {contentType === 'email_subject_lines' && (
          <>
            <Field label="Campaign Goal">
              <input type="text" value={forms.email_subject_lines.campaignGoal}
                onChange={(e) => update('email_subject_lines', { campaignGoal: e.target.value })}
                className={inputCls} placeholder="e.g. Drive Black Friday sales, re-engage inactive users" />
            </Field>
            <Field label="Product / Service Name">
              <input type="text" value={forms.email_subject_lines.productName}
                onChange={(e) => update('email_subject_lines', { productName: e.target.value })}
                className={inputCls} placeholder="e.g. CloudSync Pro" />
            </Field>
          </>
        )}

        {contentType === 'social_media_caption' && (
          <>
            <Field label="Platform">
              <SelectWrapper>
                <select value={forms.social_media_caption.platform}
                  onChange={(e) => update('social_media_caption', { platform: e.target.value as 'instagram' | 'linkedin' | 'twitter' })}
                  className={selectCls}>
                  <option value="instagram">Instagram</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="twitter">Twitter / X</option>
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
                  onChange={(e) => update('social_media_caption', { tone: e.target.value as 'professional' | 'casual' | 'fun' })}
                  className={selectCls}>
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="fun">Fun</option>
                </select>
              </SelectWrapper>
            </Field>
          </>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
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
