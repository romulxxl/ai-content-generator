'use client'

import { useState } from 'react'
import { Zap, RefreshCw, Copy, CheckCircle, ArrowRight, ChevronDown } from 'lucide-react'
import MarkdownContent from '@/components/shared/MarkdownContent'

type ContentType = 'product_description' | 'blog_post_outline' | 'email_composer' | 'social_media_caption'

const DEMO_LIMIT = 3
const TOKEN_MARKER = '\n\n__TOKENS__:'
const ERROR_MARKER = '\n\n__ERROR__:'

const TABS: { id: ContentType; label: string; hint: string }[] = [
  { id: 'product_description',  label: 'Product',  hint: 'teaser · sign up for all lengths' },
  { id: 'blog_post_outline',    label: 'Blog',     hint: 'short outline · sign up for deep-dives' },
  { id: 'email_composer',       label: 'Email',    hint: 'brief · sign up for detailed emails' },
  { id: 'social_media_caption', label: 'Social',   hint: 'short post · sign up for all sizes' },
]

// ── templates per tab ──────────────────────────────────────────────────────────

const PRODUCT_TEMPLATES = [
  { label: 'AirPods Pro',   productName: 'AirPods Pro 2',    keyFeatures: ['Active Noise Cancellation', 'Spatial Audio', 'H2 chip'], tone: 'authoritative' },
  { label: 'Keychron Q1',   productName: 'Keychron Q1 Pro',  keyFeatures: ['hot-swappable switches', 'gasket mount', 'wireless'],   tone: 'casual' },
  { label: 'Nike Pegasus',  productName: 'Nike Pegasus 41',  keyFeatures: ['React foam', 'breathable mesh', 'lightweight'],          tone: 'empathetic' },
]
const BLOG_TEMPLATES = [
  { label: 'Remote Work',    topic: 'Staying productive while working from home',             targetAudience: 'remote workers and team leads' },
  { label: 'Morning Habits', topic: 'Building a morning routine that actually sticks',         targetAudience: 'professionals, 25–40' },
  { label: 'Investing 101',  topic: "Beginner's guide to investing in index funds in 2025",   targetAudience: 'young professionals with no investing experience' },
]
const EMAIL_TEMPLATES = [
  { label: 'Demo Invite',    companyName: 'Acme SaaS',     emailPurpose: 'Invite a prospect to a 30-min product demo call', emailStyle: 'persuasive' },
  { label: 'Product Launch', companyName: 'TechStartup',  emailPurpose: 'Announce the launch of our new product to existing users', emailStyle: 'friendly' },
  { label: 'Support Reply',  companyName: 'Support Team', emailPurpose: 'Follow up with a customer after their support ticket was resolved', emailStyle: 'empathetic' },
]
const SOCIAL_TEMPLATES = [
  { label: 'Product Launch',   platform: 'instagram', topic: 'Launching our new minimalist leather wallet',                                 tone: 'casual' },
  { label: 'LinkedIn Insight', platform: 'linkedin',  topic: 'The most underrated skill in software development: writing clearly',          tone: 'professional' },
  { label: 'Twitter Hot Take', platform: 'twitter',   topic: 'Why most productivity advice fails — and what actually works',                tone: 'casual' },
]

// ── helpers ────────────────────────────────────────────────────────────────────

const inputCls  = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed bg-white'
const selectCls = 'w-full appearance-none px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white transition disabled:opacity-50 disabled:cursor-not-allowed'

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">{children}</label>
}
function Sel({ children, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={selectCls} {...p}>{children}</select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
    </div>
  )
}

// ── widget ─────────────────────────────────────────────────────────────────────

export default function DemoWidget() {
  const [activeTab, setActiveTab] = useState<ContentType>('product_description')

  // per-tab form state
  const [productForm, setProductForm] = useState({
    productName: PRODUCT_TEMPLATES[0].productName,
    keyFeatures: PRODUCT_TEMPLATES[0].keyFeatures,
    tone: PRODUCT_TEMPLATES[0].tone,
  })
  const [blogForm, setBlogForm] = useState({
    topic: BLOG_TEMPLATES[0].topic,
    targetAudience: BLOG_TEMPLATES[0].targetAudience,
  })
  const [emailForm, setEmailForm] = useState({
    companyName: EMAIL_TEMPLATES[0].companyName,
    emailPurpose: EMAIL_TEMPLATES[0].emailPurpose,
    emailStyle: EMAIL_TEMPLATES[0].emailStyle,
  })
  const [socialForm, setSocialForm] = useState({
    platform: SOCIAL_TEMPLATES[0].platform,
    topic: SOCIAL_TEMPLATES[0].topic,
    tone: SOCIAL_TEMPLATES[0].tone,
  })

  // shared
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tokensUsed, setTokensUsed] = useState<number | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [limitReached, setLimitReached] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleTabChange = (tab: ContentType) => {
    setActiveTab(tab)
    setResult('')
    setError(null)
    setTokensUsed(null)
  }

  const getInputs = () => {
    switch (activeTab) {
      case 'product_description':  return productForm
      case 'blog_post_outline':    return blogForm
      case 'email_composer':       return emailForm
      case 'social_media_caption': return socialForm
    }
  }

  const canGenerate = (() => {
    switch (activeTab) {
      case 'product_description':  return productForm.productName.trim() !== ''
      case 'blog_post_outline':    return blogForm.topic.trim() !== ''
      case 'email_composer':       return emailForm.companyName.trim() !== '' && emailForm.emailPurpose.trim() !== ''
      case 'social_media_caption': return socialForm.topic.trim() !== ''
    }
  })()

  const handleGenerate = async () => {
    if (!canGenerate || loading) return
    setLoading(true)
    setError(null)
    setResult('')
    setTokensUsed(null)

    try {
      const response = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: activeTab, inputs: getInputs() }),
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
  const activeTabMeta = TABS.find((t) => t.id === activeTab)!

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden w-full max-w-2xl mx-auto text-left">

      {/* Window chrome */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="ml-3 text-sm font-medium text-slate-500">Live demo</span>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
          limitReached       ? 'bg-red-50 text-red-600' :
          displayRemaining <= 1 ? 'bg-amber-50 text-amber-600' :
                               'bg-teal-50 text-teal-600'
        }`}>
          {limitReached ? 'Limit reached' : `${displayRemaining} generation${displayRemaining !== 1 ? 's' : ''} left`}
        </span>
      </div>

      {/* Tab nav */}
      <div className="flex border-b border-slate-100 bg-slate-50/60">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex-1 py-2.5 text-xs font-medium transition border-b-2 ${
              activeTab === tab.id
                ? 'border-teal-500 text-teal-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-5 space-y-4">

        {/* ── Product Description ── */}
        {activeTab === 'product_description' && (
          <>
            <div className="flex gap-2 flex-wrap">
              {PRODUCT_TEMPLATES.map((t) => (
                <button key={t.label} onClick={() => { setProductForm({ productName: t.productName, keyFeatures: t.keyFeatures, tone: t.tone }); setResult(''); setError(null) }}
                  className={`text-xs px-3 py-1.5 rounded-full border transition ${productForm.productName === t.productName ? 'border-teal-500 bg-teal-50 text-teal-700 font-medium' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                  {t.label}
                </button>
              ))}
            </div>
            <div><Label>Product name</Label>
              <input value={productForm.productName} onChange={(e) => setProductForm(f => ({ ...f, productName: e.target.value }))}
                placeholder="e.g. iPhone 15 Pro" maxLength={100} disabled={limitReached} className={inputCls} />
            </div>
            {productForm.keyFeatures.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {productForm.keyFeatures.map((f) => (
                  <span key={f} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">{f}</span>
                ))}
              </div>
            )}
            <div><Label>Tone</Label>
              <Sel value={productForm.tone} onChange={(e) => setProductForm(f => ({ ...f, tone: e.target.value }))} disabled={limitReached}>
                <option value="formal">Formal</option>
                <option value="casual">Casual</option>
                <option value="playful">Playful</option>
                <option value="authoritative">Authoritative</option>
                <option value="urgent">Urgent / FOMO</option>
                <option value="empathetic">Empathetic</option>
                <option value="minimalist">Minimalist</option>
              </Sel>
            </div>
          </>
        )}

        {/* ── Blog Blueprint ── */}
        {activeTab === 'blog_post_outline' && (
          <>
            <div className="flex gap-2 flex-wrap">
              {BLOG_TEMPLATES.map((t) => (
                <button key={t.label} onClick={() => { setBlogForm({ topic: t.topic, targetAudience: t.targetAudience }); setResult(''); setError(null) }}
                  className={`text-xs px-3 py-1.5 rounded-full border transition ${blogForm.topic === t.topic ? 'border-teal-500 bg-teal-50 text-teal-700 font-medium' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                  {t.label}
                </button>
              ))}
            </div>
            <div><Label>Topic</Label>
              <input value={blogForm.topic} onChange={(e) => setBlogForm(f => ({ ...f, topic: e.target.value }))}
                placeholder="e.g. How to build a morning routine" maxLength={200} disabled={limitReached} className={inputCls} />
            </div>
            <div><Label>Target audience</Label>
              <input value={blogForm.targetAudience} onChange={(e) => setBlogForm(f => ({ ...f, targetAudience: e.target.value }))}
                placeholder="e.g. Remote workers, 25–40" maxLength={100} disabled={limitReached} className={inputCls} />
            </div>
          </>
        )}

        {/* ── Email Composer ── */}
        {activeTab === 'email_composer' && (
          <>
            <div className="flex gap-2 flex-wrap">
              {EMAIL_TEMPLATES.map((t) => (
                <button key={t.label} onClick={() => { setEmailForm({ companyName: t.companyName, emailPurpose: t.emailPurpose, emailStyle: t.emailStyle }); setResult(''); setError(null) }}
                  className={`text-xs px-3 py-1.5 rounded-full border transition ${emailForm.emailPurpose === t.emailPurpose ? 'border-teal-500 bg-teal-50 text-teal-700 font-medium' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Company / Sender</Label>
                <input value={emailForm.companyName} onChange={(e) => setEmailForm(f => ({ ...f, companyName: e.target.value }))}
                  placeholder="e.g. Acme Corp" maxLength={100} disabled={limitReached} className={inputCls} />
              </div>
              <div><Label>Style</Label>
                <Sel value={emailForm.emailStyle} onChange={(e) => setEmailForm(f => ({ ...f, emailStyle: e.target.value }))} disabled={limitReached}>
                  <option value="formal">Formal</option>
                  <option value="friendly">Friendly</option>
                  <option value="persuasive">Persuasive</option>
                  <option value="direct">Direct</option>
                  <option value="empathetic">Empathetic</option>
                </Sel>
              </div>
            </div>
            <div><Label>Email purpose</Label>
              <input value={emailForm.emailPurpose} onChange={(e) => setEmailForm(f => ({ ...f, emailPurpose: e.target.value }))}
                placeholder="e.g. Invite to a product demo" maxLength={200} disabled={limitReached} className={inputCls} />
            </div>
          </>
        )}

        {/* ── Social Post ── */}
        {activeTab === 'social_media_caption' && (
          <>
            <div className="flex gap-2 flex-wrap">
              {SOCIAL_TEMPLATES.map((t) => (
                <button key={t.label} onClick={() => { setSocialForm({ platform: t.platform, topic: t.topic, tone: t.tone }); setResult(''); setError(null) }}
                  className={`text-xs px-3 py-1.5 rounded-full border transition ${socialForm.topic === t.topic ? 'border-teal-500 bg-teal-50 text-teal-700 font-medium' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Platform</Label>
                <Sel value={socialForm.platform} onChange={(e) => setSocialForm(f => ({ ...f, platform: e.target.value }))} disabled={limitReached}>
                  <option value="instagram">Instagram</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="twitter">Twitter / X</option>
                  <option value="facebook">Facebook</option>
                </Sel>
              </div>
              <div><Label>Tone</Label>
                <Sel value={socialForm.tone} onChange={(e) => setSocialForm(f => ({ ...f, tone: e.target.value }))} disabled={limitReached}>
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="fun">Fun</option>
                </Sel>
              </div>
            </div>
            <div><Label>Topic</Label>
              <input value={socialForm.topic} onChange={(e) => setSocialForm(f => ({ ...f, topic: e.target.value }))}
                placeholder="e.g. New product launch, company milestone" maxLength={200} disabled={limitReached} className={inputCls} />
            </div>
          </>
        )}

        {/* Demo scope note */}
        <p className="text-xs text-slate-400 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-slate-300 inline-block" />
          Demo: {activeTabMeta.hint}
        </p>

        {/* Generate / Limit CTA */}
        {!limitReached ? (
          <button onClick={handleGenerate} disabled={loading || !canGenerate}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition flex items-center justify-center gap-2">
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating…</>
            ) : (
              <><Zap className="w-4 h-4" />Generate</>
            )}
          </button>
        ) : (
          <div className="text-center py-1">
            <p className="text-sm text-slate-500 mb-3">You&apos;ve used all 3 free demo generations.</p>
            <a href="/signup" className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium px-5 py-2.5 rounded-lg transition">
              Create free account for unlimited access <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        {/* Result */}
        {(result || (loading && !result)) && (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
              <span className="text-xs font-medium text-slate-500">Generated result</span>
              <div className="flex items-center gap-3">
                {tokensUsed !== null && (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Zap className="w-3 h-3 text-amber-400" />{tokensUsed} tokens
                  </span>
                )}
                {result && !loading && (
                  <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition">
                    {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                )}
                {result && !loading && !limitReached && (
                  <button onClick={handleGenerate} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition">
                    <RefreshCw className="w-3.5 h-3.5" />Retry
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

        {/* Post-result sign-up nudge */}
        {result && !loading && !limitReached && (
          <div className="flex items-center justify-between text-sm border-t border-slate-100 pt-3">
            <span className="text-slate-400 text-xs">Full access: history, versions, longer outputs</span>
            <a href="/signup" className="flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium text-xs transition">
              Sign up free <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
