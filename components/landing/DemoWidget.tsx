'use client'

import { useState } from 'react'
import { flushSync } from 'react-dom'
import { Zap, RefreshCw, Copy, CheckCircle, ArrowRight, Wand2 } from 'lucide-react'
import MarkdownContent from '@/components/shared/MarkdownContent'

type ContentType = 'product_description' | 'blog_post_outline' | 'email_composer' | 'social_media_caption'

const DEMO_LIMIT = 3

const TABS: { id: ContentType; label: string; demoNote: string }[] = [
  { id: 'product_description',  label: 'Product',  demoNote: 'Teaser length — sign up for all sizes' },
  { id: 'blog_post_outline',    label: 'Blog',     demoNote: 'Short outline — sign up for deep-dives' },
  { id: 'email_composer',       label: 'Email',    demoNote: 'Brief email — sign up for detailed campaigns' },
  { id: 'social_media_caption', label: 'Social',   demoNote: 'Short post — sign up for threads & long-form' },
]

const PRODUCT_TEMPLATES = [
  { label: 'AirPods Pro',  productName: 'AirPods Pro 2',   keyFeatures: ['Active Noise Cancellation', 'Spatial Audio', 'H2 chip'], tone: 'authoritative' },
  { label: 'Keychron Q1',  productName: 'Keychron Q1 Pro', keyFeatures: ['hot-swappable switches', 'gasket mount', 'wireless'],   tone: 'casual' },
  { label: 'Nike Pegasus', productName: 'Nike Pegasus 41', keyFeatures: ['React foam', 'breathable mesh', 'lightweight'],          tone: 'empathetic' },
]
const BLOG_TEMPLATES = [
  { label: 'Remote Work',    topic: 'Staying productive while working from home',           targetAudience: 'remote workers and team leads' },
  { label: 'Morning Habits', topic: 'Building a morning routine that actually sticks',       targetAudience: 'professionals, 25–40' },
  { label: 'Investing 101',  topic: "Beginner's guide to investing in index funds in 2025", targetAudience: 'young professionals with no investing experience' },
]
const EMAIL_TEMPLATES = [
  { label: 'Demo Invite',    companyName: 'Acme SaaS',    emailPurpose: 'Invite a prospect to a 30-min product demo call',              emailStyle: 'persuasive' },
  { label: 'Product Launch', companyName: 'TechStartup', emailPurpose: 'Announce the launch of our new product to existing users',      emailStyle: 'friendly' },
  { label: 'Support Reply',  companyName: 'Support',     emailPurpose: 'Follow up with a customer after their support ticket resolved', emailStyle: 'empathetic' },
]
const SOCIAL_TEMPLATES = [
  { label: 'Product Launch',   platform: 'instagram', topic: 'Launching our new minimalist leather wallet',                        tone: 'casual' },
  { label: 'LinkedIn Insight', platform: 'linkedin',  topic: 'The most underrated skill in software: writing clearly',             tone: 'professional' },
  { label: 'Hot Take',         platform: 'twitter',   topic: 'Why most productivity advice fails — and what actually works',       tone: 'casual' },
]

const inputCls = 'w-full px-3 py-2 border border-[#e8e4db] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1b3f2d]/20 focus:border-[#1b3f2d] transition text-[#1c1c17] placeholder:text-[#b0a89e] disabled:opacity-50 disabled:cursor-not-allowed'

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-semibold text-[#a09890] mb-1.5 uppercase tracking-wider">{children}</label>
}

function Chip({ label, active, onClick, disabled }: { label: string; active: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={`text-xs px-3 py-1.5 rounded-md border font-medium transition whitespace-nowrap ${
        active ? 'border-[#1b3f2d] bg-[#1b3f2d] text-white' : 'border-[#e8e4db] text-[#6b6660] hover:border-[#1b3f2d] hover:text-[#1b3f2d]'
      } disabled:opacity-40 disabled:cursor-not-allowed`}>
      {label}
    </button>
  )
}

export default function DemoWidget() {
  const [activeTab, setActiveTab] = useState<ContentType>('product_description')

  const [productForm, setProductForm] = useState({ productName: PRODUCT_TEMPLATES[0].productName, keyFeatures: PRODUCT_TEMPLATES[0].keyFeatures, tone: PRODUCT_TEMPLATES[0].tone })
  const [blogForm,    setBlogForm]    = useState({ topic: BLOG_TEMPLATES[0].topic, targetAudience: BLOG_TEMPLATES[0].targetAudience })
  const [emailForm,   setEmailForm]   = useState({ companyName: EMAIL_TEMPLATES[0].companyName, emailPurpose: EMAIL_TEMPLATES[0].emailPurpose, emailStyle: EMAIL_TEMPLATES[0].emailStyle })
  const [socialForm,  setSocialForm]  = useState({ platform: SOCIAL_TEMPLATES[0].platform, topic: SOCIAL_TEMPLATES[0].topic, tone: SOCIAL_TEMPLATES[0].tone })

  const [result,      setResult]      = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [tokensUsed,  setTokensUsed]  = useState<number | null>(null)
  const [remaining,   setRemaining]   = useState<number | null>(null)
  const [limitReached,setLimitReached]= useState(false)
  const [copied,      setCopied]      = useState(false)

  const handleTabChange = (tab: ContentType) => { setActiveTab(tab); setResult(''); setError(null); setTokensUsed(null) }

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
    setLoading(true); setError(null); setResult(''); setTokensUsed(null)
    try {
      const response = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: activeTab, inputs: getInputs() }),
      })
      if (response.status === 429) { setLimitReached(true); setRemaining(0); setLoading(false); return }
      if (!response.ok) {
        const d = await response.json().catch(() => ({}))
        throw new Error((d as { error?: string }).error || 'Request failed')
      }
      setRemaining(Number(response.headers.get('X-Demo-Remaining') ?? DEMO_LIMIT - 1))
      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        flushSync(() => setResult(accumulated))
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Generation failed') }
    finally { setLoading(false) }
  }

  const handleCopy = async () => {
    if (!result) return
    try { await navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* ignore */ }
  }

  const displayRemaining = remaining !== null ? remaining : DEMO_LIMIT
  const activeTabMeta = TABS.find(t => t.id === activeTab)!

  return (
    <div className="bg-white rounded-2xl border border-[#e8e4db] shadow-[0_2px_16px_0_rgba(0,0,0,0.06)] overflow-hidden w-full text-left">

      {/* ── Card header: label + usage badge ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#e8e4db] bg-[#faf8f3]/60">
        <span className="text-[11px] font-medium text-[#a09890] uppercase tracking-wider">Live demo</span>
        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
          limitReached
            ? 'bg-red-50 text-red-600'
            : displayRemaining <= 1
            ? 'bg-amber-50 text-amber-600'
            : 'bg-[#e0f0e8] text-[#1b3f2d]'
        }`}>
          {limitReached ? 'Limit reached' : `${displayRemaining} of ${DEMO_LIMIT} free`}
        </span>
      </div>

      {/* ── Content-type tabs — only tabs ── */}
      <div className="flex border-b border-[#e8e4db]">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => handleTabChange(tab.id)}
            className={`flex-1 py-2.5 text-xs font-semibold tracking-wide transition border-b-2 ${
              activeTab === tab.id
                ? 'border-[#1b3f2d] text-[#1b3f2d] bg-white'
                : 'border-transparent text-[#a09890] hover:text-[#6b6660] bg-[#faf8f3]/60 hover:bg-white/80'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Form ── */}
      <div className="p-5 space-y-4">

        {/* Product Description */}
        {activeTab === 'product_description' && (<>
          <div>
            <Label>Quick start</Label>
            <div className="flex gap-2 flex-wrap">
              {PRODUCT_TEMPLATES.map(t => (
                <Chip key={t.label} label={t.label} active={productForm.productName === t.productName} disabled={limitReached}
                  onClick={() => { setProductForm({ productName: t.productName, keyFeatures: t.keyFeatures, tone: t.tone }); setResult(''); setError(null) }} />
              ))}
            </div>
          </div>
          <div><Label>Product name</Label>
            <input value={productForm.productName} onChange={e => setProductForm(f => ({ ...f, productName: e.target.value }))}
              placeholder="e.g. iPhone 15 Pro" maxLength={100} disabled={limitReached} className={inputCls} />
          </div>
          {productForm.keyFeatures.length > 0 && (
            <div><Label>Key features</Label>
              <div className="flex flex-wrap gap-1.5">
                {productForm.keyFeatures.map(f => <span key={f} className="text-xs bg-[#f0ede6] text-[#6b6660] px-2.5 py-1 rounded-md">{f}</span>)}
              </div>
            </div>
          )}
          <div><Label>Tone</Label>
            <div className="flex flex-wrap gap-1.5">
              {['formal','casual','playful','authoritative','urgent','empathetic','minimalist'].map(t => (
                <Chip key={t} label={t.charAt(0).toUpperCase() + t.slice(1)} active={productForm.tone === t} disabled={limitReached}
                  onClick={() => setProductForm(f => ({ ...f, tone: t }))} />
              ))}
            </div>
          </div>
        </>)}

        {/* Blog Blueprint */}
        {activeTab === 'blog_post_outline' && (<>
          <div><Label>Quick start</Label>
            <div className="flex flex-wrap gap-2">
              {BLOG_TEMPLATES.map(t => (
                <Chip key={t.label} label={t.label} active={blogForm.topic === t.topic} disabled={limitReached}
                  onClick={() => { setBlogForm({ topic: t.topic, targetAudience: t.targetAudience }); setResult(''); setError(null) }} />
              ))}
            </div>
          </div>
          <div><Label>Topic</Label>
            <input value={blogForm.topic} onChange={e => setBlogForm(f => ({ ...f, topic: e.target.value }))}
              placeholder="e.g. How to build a morning routine" maxLength={200} disabled={limitReached} className={inputCls} />
          </div>
          <div><Label>Target audience</Label>
            <input value={blogForm.targetAudience} onChange={e => setBlogForm(f => ({ ...f, targetAudience: e.target.value }))}
              placeholder="e.g. Remote workers, 25–40" maxLength={100} disabled={limitReached} className={inputCls} />
          </div>
        </>)}

        {/* Email Composer */}
        {activeTab === 'email_composer' && (<>
          <div><Label>Quick start</Label>
            <div className="flex flex-wrap gap-2">
              {EMAIL_TEMPLATES.map(t => (
                <Chip key={t.label} label={t.label} active={emailForm.emailPurpose === t.emailPurpose} disabled={limitReached}
                  onClick={() => { setEmailForm({ companyName: t.companyName, emailPurpose: t.emailPurpose, emailStyle: t.emailStyle }); setResult(''); setError(null) }} />
              ))}
            </div>
          </div>
          <div><Label>Company / Sender</Label>
            <input value={emailForm.companyName} onChange={e => setEmailForm(f => ({ ...f, companyName: e.target.value }))}
              placeholder="e.g. Acme Corp" maxLength={100} disabled={limitReached} className={inputCls} />
          </div>
          <div><Label>Email purpose</Label>
            <input value={emailForm.emailPurpose} onChange={e => setEmailForm(f => ({ ...f, emailPurpose: e.target.value }))}
              placeholder="e.g. Invite to a product demo" maxLength={200} disabled={limitReached} className={inputCls} />
          </div>
          <div><Label>Style</Label>
            <div className="flex flex-wrap gap-1.5">
              {['formal','friendly','persuasive','direct','empathetic'].map(s => (
                <Chip key={s} label={s.charAt(0).toUpperCase() + s.slice(1)} active={emailForm.emailStyle === s} disabled={limitReached}
                  onClick={() => setEmailForm(f => ({ ...f, emailStyle: s }))} />
              ))}
            </div>
          </div>
        </>)}

        {/* Social Post */}
        {activeTab === 'social_media_caption' && (<>
          <div><Label>Quick start</Label>
            <div className="flex flex-wrap gap-2">
              {SOCIAL_TEMPLATES.map(t => (
                <Chip key={t.label} label={t.label} active={socialForm.topic === t.topic} disabled={limitReached}
                  onClick={() => { setSocialForm({ platform: t.platform, topic: t.topic, tone: t.tone }); setResult(''); setError(null) }} />
              ))}
            </div>
          </div>
          <div><Label>Platform</Label>
            <div className="flex flex-wrap gap-1.5">
              {[['instagram','Instagram'],['linkedin','LinkedIn'],['twitter','Twitter/X'],['facebook','Facebook']].map(([v, l]) => (
                <Chip key={v} label={l} active={socialForm.platform === v} disabled={limitReached}
                  onClick={() => setSocialForm(f => ({ ...f, platform: v }))} />
              ))}
            </div>
          </div>
          <div><Label>Topic</Label>
            <input value={socialForm.topic} onChange={e => setSocialForm(f => ({ ...f, topic: e.target.value }))}
              placeholder="e.g. New product launch" maxLength={200} disabled={limitReached} className={inputCls} />
          </div>
          <div><Label>Tone</Label>
            <div className="flex gap-1.5">
              {['professional','casual','fun'].map(t => (
                <Chip key={t} label={t.charAt(0).toUpperCase() + t.slice(1)} active={socialForm.tone === t} disabled={limitReached}
                  onClick={() => setSocialForm(f => ({ ...f, tone: t }))} />
              ))}
            </div>
          </div>
        </>)}

        {/* Demo note */}
        <p className="text-[11px] text-[#b0a89e]">{activeTabMeta.demoNote}</p>

        {/* Generate / Limit CTA */}
        {!limitReached ? (
          <button onClick={handleGenerate} disabled={loading || !canGenerate}
            className="w-full bg-[#1b3f2d] hover:bg-[#152e24] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg transition flex items-center justify-center gap-2 text-sm">
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating…</>
              : <><Zap className="w-4 h-4" />Generate</>}
          </button>
        ) : (
          <a href="/signup"
            className="w-full flex items-center justify-center gap-2 bg-[#1b3f2d] hover:bg-[#152e24] text-white font-semibold py-2.5 px-4 rounded-lg transition text-sm">
            Create free account <ArrowRight className="w-4 h-4" />
          </a>
        )}

        {/* Error */}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      </div>

      {/* ── Output (appears below form during + after generation) ── */}
      {(loading || result) && (
        <div className="border-t border-[#e8e4db]">
          {/* Output header */}
          <div className="flex items-center justify-between px-5 py-3 bg-[#faf8f3]/70 border-b border-[#eeebe3]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#a09890]">Output</span>
            <div className="flex items-center gap-3">
              {tokensUsed !== null && (
                <span className="flex items-center gap-1 text-[11px] text-[#a09890]">
                  <Zap className="w-3 h-3 text-amber-400" />{tokensUsed} tokens
                </span>
              )}
              {result && !loading && (
                <button onClick={handleCopy} className="flex items-center gap-1 text-[11px] text-[#a09890] hover:text-[#1c1c17] transition">
                  {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              )}
              {result && !loading && !limitReached && (
                <button onClick={handleGenerate} className="flex items-center gap-1 text-[11px] text-[#a09890] hover:text-[#1c1c17] transition">
                  <RefreshCw className="w-3.5 h-3.5" />Retry
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            {loading && !result && (
              <div className="space-y-2.5">
                {[100, 83, 62, 100, 71].map((w, i) => (
                  <div key={i} className="h-3 bg-[#f0ede6] rounded-full animate-pulse" style={{ width: `${w}%` }} />
                ))}
                <div className="flex items-center gap-1.5 pt-2">
                  <span className="w-3 h-3 border-2 border-[#1b3f2d]/20 border-t-[#1b3f2d] rounded-full animate-spin inline-block" />
                  <span className="text-xs text-[#b0a89e]">Claude is writing…</span>
                </div>
              </div>
            )}
            {result && (
              <div>
                <MarkdownContent content={result} />
                {loading && <span className="inline-block w-2 h-4 bg-[#1b3f2d] animate-pulse ml-0.5 align-text-bottom rounded-sm" />}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Post-result sign-up nudge ── */}
      {result && !loading && !limitReached && (
        <div className="flex items-center justify-between border-t border-[#e8e4db] px-5 py-3">
          <span className="text-[11px] text-[#a09890]">History, versions, longer outputs in full app</span>
          <a href="/signup" className="text-[11px] font-semibold text-[#1b3f2d] hover:underline flex items-center gap-1">
            Sign up free <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  )
}
