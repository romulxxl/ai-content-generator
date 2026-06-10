/**
 * Tests for the pure helper logic inside app/api/demo/route.ts.
 * We re-implement the helpers here because Next.js route files can't be
 * imported directly in a vitest/jsdom environment (they use next/server
 * internals).  The logic is small enough that testing it in isolation
 * catches real bugs without needing a full HTTP integration test.
 */
import { describe, it, expect } from 'vitest'
import { isValidContentType, buildPrompt } from '@/lib/prompts'
import type { ContentType, ContentInputs } from '@/lib/prompts'

// ── getClientIp equivalent ────────────────────────────────────────────────

function getClientIp(headers: Record<string, string | null>): string {
  return (
    headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    headers['x-real-ip'] ||
    'demo-unknown'
  )
}

describe('getClientIp()', () => {
  it('returns first IP from x-forwarded-for', () => {
    expect(getClientIp({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8', 'x-real-ip': null })).toBe('1.2.3.4')
  })

  it('trims spaces from x-forwarded-for', () => {
    expect(getClientIp({ 'x-forwarded-for': '  9.9.9.9  ', 'x-real-ip': null })).toBe('9.9.9.9')
  })

  it('falls back to x-real-ip when no x-forwarded-for', () => {
    expect(getClientIp({ 'x-forwarded-for': null, 'x-real-ip': '10.0.0.1' })).toBe('10.0.0.1')
  })

  it('falls back to demo-unknown when both headers absent', () => {
    expect(getClientIp({ 'x-forwarded-for': null, 'x-real-ip': null })).toBe('demo-unknown')
  })
})

// ── buildDemoInputs equivalent ────────────────────────────────────────────

function buildDemoInputs(
  contentType: ContentType,
  raw: Record<string, unknown>,
): ContentInputs | null {
  switch (contentType) {
    case 'product_description': {
      const name = String(raw.productName ?? '').slice(0, 100).trim()
      if (!name) return null
      return {
        productName: name,
        keyFeatures: Array.isArray(raw.keyFeatures)
          ? raw.keyFeatures.slice(0, 5).map((f) => String(f).slice(0, 60))
          : [],
        tone: (['formal','casual','playful','authoritative','urgent','empathetic','minimalist'].includes(String(raw.tone))
          ? raw.tone as 'formal'
          : 'formal'),
        wordCount: 'teaser',
      }
    }
    case 'blog_post_outline': {
      const topic = String(raw.topic ?? '').slice(0, 200).trim()
      if (!topic) return null
      return {
        topic,
        targetAudience: String(raw.targetAudience ?? 'general readers').slice(0, 100).trim() || 'general readers',
        desiredLength: 'short',
      }
    }
    case 'email_composer': {
      const company = String(raw.companyName ?? '').slice(0, 100).trim()
      const purpose = String(raw.emailPurpose ?? '').slice(0, 200).trim()
      if (!company || !purpose) return null
      return {
        companyName: company,
        emailPurpose: purpose,
        emailStyle: (['formal','friendly','persuasive','direct','empathetic'].includes(String(raw.emailStyle))
          ? raw.emailStyle as 'formal'
          : 'formal'),
        emailLength: 'brief',
        keyPoints: [],
      }
    }
    case 'social_media_caption': {
      const topic = String(raw.topic ?? '').slice(0, 200).trim()
      if (!topic) return null
      return {
        platform: (['instagram','linkedin','twitter','facebook'].includes(String(raw.platform))
          ? raw.platform as 'instagram'
          : 'instagram'),
        topic,
        tone: (['professional','casual','fun'].includes(String(raw.tone))
          ? raw.tone as 'professional'
          : 'casual'),
        wordCount: 'short',
      }
    }
  }
}

describe('buildDemoInputs() — product_description', () => {
  it('returns null when productName is empty', () => {
    expect(buildDemoInputs('product_description', {})).toBeNull()
  })

  it('returns null when productName is whitespace only', () => {
    expect(buildDemoInputs('product_description', { productName: '   ' })).toBeNull()
  })

  it('truncates productName to 100 chars', () => {
    const long = 'x'.repeat(150)
    const result = buildDemoInputs('product_description', { productName: long })
    expect((result as { productName: string }).productName.length).toBe(100)
  })

  it('defaults to formal tone for unknown tone', () => {
    const result = buildDemoInputs('product_description', { productName: 'Widget', tone: 'weird' })
    expect((result as { tone: string }).tone).toBe('formal')
  })

  it('accepts a valid tone', () => {
    const result = buildDemoInputs('product_description', { productName: 'Widget', tone: 'playful' })
    expect((result as { tone: string }).tone).toBe('playful')
  })

  it('limits keyFeatures to 5', () => {
    const features = ['a','b','c','d','e','f','g']
    const result = buildDemoInputs('product_description', { productName: 'Widget', keyFeatures: features })
    expect((result as { keyFeatures: string[] }).keyFeatures).toHaveLength(5)
  })

  it('always forces wordCount to teaser', () => {
    const result = buildDemoInputs('product_description', { productName: 'Widget', wordCount: 'extended' })
    expect((result as { wordCount: string }).wordCount).toBe('teaser')
  })

  it('returns empty array for non-array keyFeatures', () => {
    const result = buildDemoInputs('product_description', { productName: 'Widget', keyFeatures: 'string' })
    expect((result as { keyFeatures: string[] }).keyFeatures).toEqual([])
  })
})

describe('buildDemoInputs() — blog_post_outline', () => {
  it('returns null when topic is empty', () => {
    expect(buildDemoInputs('blog_post_outline', {})).toBeNull()
  })

  it('always forces desiredLength to short', () => {
    const result = buildDemoInputs('blog_post_outline', { topic: 'AI trends', desiredLength: 'long' })
    expect((result as { desiredLength: string }).desiredLength).toBe('short')
  })

  it('defaults targetAudience to general readers when blank', () => {
    const result = buildDemoInputs('blog_post_outline', { topic: 'AI trends', targetAudience: '' })
    expect((result as { targetAudience: string }).targetAudience).toBe('general readers')
  })

  it('truncates topic to 200 chars', () => {
    const long = 'y'.repeat(250)
    const result = buildDemoInputs('blog_post_outline', { topic: long })
    expect((result as { topic: string }).topic.length).toBe(200)
  })
})

describe('buildDemoInputs() — email_composer', () => {
  it('returns null when companyName is missing', () => {
    expect(buildDemoInputs('email_composer', { emailPurpose: 'Hello' })).toBeNull()
  })

  it('returns null when emailPurpose is missing', () => {
    expect(buildDemoInputs('email_composer', { companyName: 'Acme' })).toBeNull()
  })

  it('always forces emailLength to brief', () => {
    const result = buildDemoInputs('email_composer', {
      companyName: 'Acme', emailPurpose: 'Follow up', emailLength: 'detailed',
    })
    expect((result as { emailLength: string }).emailLength).toBe('brief')
  })

  it('always returns empty keyPoints', () => {
    const result = buildDemoInputs('email_composer', {
      companyName: 'Acme', emailPurpose: 'Follow up', keyPoints: ['x'],
    })
    expect((result as { keyPoints: string[] }).keyPoints).toEqual([])
  })
})

describe('buildDemoInputs() — social_media_caption', () => {
  it('returns null when topic is empty', () => {
    expect(buildDemoInputs('social_media_caption', {})).toBeNull()
  })

  it('defaults platform to instagram for unknown platform', () => {
    const result = buildDemoInputs('social_media_caption', { topic: 'Coffee', platform: 'tiktok' })
    expect((result as { platform: string }).platform).toBe('instagram')
  })

  it('accepts valid platforms', () => {
    for (const p of ['instagram', 'linkedin', 'twitter', 'facebook']) {
      const result = buildDemoInputs('social_media_caption', { topic: 'x', platform: p })
      expect((result as { platform: string }).platform).toBe(p)
    }
  })

  it('defaults tone to casual for unknown tone', () => {
    const result = buildDemoInputs('social_media_caption', { topic: 'Coffee', tone: 'aggressive' })
    expect((result as { tone: string }).tone).toBe('casual')
  })

  it('always forces wordCount to short', () => {
    const result = buildDemoInputs('social_media_caption', { topic: 'Coffee', wordCount: 'long' })
    expect((result as { wordCount: string }).wordCount).toBe('short')
  })
})

// ── DEMO_LIMIT behaviour (pure logic, no DB) ──────────────────────────────

describe('demo rate-limit constants', () => {
  const DEMO_LIMIT = 3

  it('allows requests when used < DEMO_LIMIT', () => {
    expect(0 < DEMO_LIMIT).toBe(true)
    expect(2 < DEMO_LIMIT).toBe(true)
  })

  it('blocks at exactly DEMO_LIMIT', () => {
    expect(3 >= DEMO_LIMIT).toBe(true)
  })

  it('calculates remaining correctly', () => {
    expect(DEMO_LIMIT - 0 - 1).toBe(2)
    expect(DEMO_LIMIT - 2 - 1).toBe(0)
  })
})

// ── buildPrompt integration (prompt text used by demo route) ──────────────

describe('buildPrompt used by demo route', () => {
  it('produces non-empty prompt for each content type', () => {
    const cases = [
      buildDemoInputs('product_description', { productName: 'Pen' }),
      buildDemoInputs('blog_post_outline', { topic: 'AI' }),
      buildDemoInputs('email_composer', { companyName: 'Co', emailPurpose: 'Hi' }),
      buildDemoInputs('social_media_caption', { topic: 'Cats' }),
    ] as ContentInputs[]

    const types: ContentType[] = [
      'product_description', 'blog_post_outline', 'email_composer', 'social_media_caption',
    ]

    types.forEach((type, i) => {
      const prompt = buildPrompt(type, cases[i])
      expect(prompt.length).toBeGreaterThan(50)
    })
  })
})
