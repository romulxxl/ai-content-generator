import { describe, it, expect } from 'vitest'
import { isValidContentType, buildPrompt } from '@/lib/prompts'
import type {
  ProductDescriptionInputs,
  BlogPostInputs,
  EmailInputs,
  SocialMediaInputs,
} from '@/lib/prompts'

// ─── isValidContentType ────────────────────────────────────────────────────

describe('isValidContentType()', () => {
  it('accepts all 4 valid types', () => {
    expect(isValidContentType('product_description')).toBe(true)
    expect(isValidContentType('blog_post_outline')).toBe(true)
    expect(isValidContentType('email_composer')).toBe(true)
    expect(isValidContentType('social_media_caption')).toBe(true)
  })

  it('rejects unknown strings', () => {
    expect(isValidContentType('unknown')).toBe(false)
    expect(isValidContentType('product')).toBe(false)
    expect(isValidContentType('')).toBe(false)
  })

  it('rejects non-string types', () => {
    expect(isValidContentType(null)).toBe(false)
    expect(isValidContentType(undefined)).toBe(false)
    expect(isValidContentType(42)).toBe(false)
    expect(isValidContentType({})).toBe(false)
  })
})

// ─── buildPrompt — product_description ────────────────────────────────────

describe('buildPrompt() — product_description', () => {
  const base: ProductDescriptionInputs = {
    productName: 'AirPods Pro',
    keyFeatures: ['noise cancellation', 'spatial audio'],
    tone: 'casual',
    wordCount: 'standard',
  }

  it('includes the product name', () => {
    expect(buildPrompt('product_description', base)).toContain('AirPods Pro')
  })

  it('includes all key features', () => {
    const prompt = buildPrompt('product_description', base)
    expect(prompt).toContain('noise cancellation')
    expect(prompt).toContain('spatial audio')
  })

  it('includes the tone', () => {
    expect(buildPrompt('product_description', base)).toContain('casual')
  })

  it('teaser targets 50–80 words', () => {
    const prompt = buildPrompt('product_description', { ...base, wordCount: 'teaser' })
    expect(prompt).toContain('50–80 words')
  })

  it('standard targets 120–200 words', () => {
    expect(buildPrompt('product_description', base)).toContain('120–200 words')
  })

  it('extended targets 250–400 words', () => {
    const prompt = buildPrompt('product_description', { ...base, wordCount: 'extended' })
    expect(prompt).toContain('250–400 words')
  })

  it('instructs not to include a title', () => {
    expect(buildPrompt('product_description', base)).toContain('Do not include a title')
  })

  it('lists clichés to avoid', () => {
    expect(buildPrompt('product_description', base)).toContain('game-changer')
  })

  it('handles empty keyFeatures array', () => {
    const prompt = buildPrompt('product_description', { ...base, keyFeatures: [] })
    expect(prompt).toBeTruthy()
  })

  it('includes every feature in the instructions section', () => {
    const prompt = buildPrompt('product_description', {
      ...base,
      keyFeatures: ['waterproof', 'long battery'],
    })
    expect(prompt).toContain('waterproof')
    expect(prompt).toContain('long battery')
  })
})

// ─── buildPrompt — blog_post_outline ──────────────────────────────────────

describe('buildPrompt() — blog_post_outline', () => {
  const base: BlogPostInputs = {
    topic: 'How to start a podcast',
    targetAudience: 'beginners',
    desiredLength: 'medium',
  }

  it('includes the topic', () => {
    expect(buildPrompt('blog_post_outline', base)).toContain('How to start a podcast')
  })

  it('includes the target audience', () => {
    expect(buildPrompt('blog_post_outline', base)).toContain('beginners')
  })

  it('short → 5–7 sections, ~500 words', () => {
    const prompt = buildPrompt('blog_post_outline', { ...base, desiredLength: 'short' })
    expect(prompt).toContain('5–7 sections')
    expect(prompt).toContain('~500 words')
  })

  it('medium → 7–10 sections, ~1 000 words', () => {
    const prompt = buildPrompt('blog_post_outline', base)
    expect(prompt).toContain('7–10 sections')
    expect(prompt).toContain('~1 000 words')
  })

  it('long → 10–15 sections, ~2 000+ words', () => {
    const prompt = buildPrompt('blog_post_outline', { ...base, desiredLength: 'long' })
    expect(prompt).toContain('10–15 sections')
    expect(prompt).toContain('~2 000+ words')
  })

  it('instructs to use Markdown headers', () => {
    expect(buildPrompt('blog_post_outline', base)).toContain('## for main section headers')
  })

  it('includes required outline sections', () => {
    const prompt = buildPrompt('blog_post_outline', base)
    expect(prompt).toContain('## Title')
    expect(prompt).toContain('## Opening hook')
    expect(prompt).toContain('## Conclusion')
  })
})

// ─── buildPrompt — email_composer ─────────────────────────────────────────

describe('buildPrompt() — email_composer', () => {
  const base: EmailInputs = {
    companyName: 'Acme Corp',
    emailPurpose: 'Follow up on proposal',
    emailStyle: 'formal',
    emailLength: 'standard',
    keyPoints: ['pricing', 'timeline'],
  }

  it('includes the company name', () => {
    expect(buildPrompt('email_composer', base)).toContain('Acme Corp')
  })

  it('includes the email purpose', () => {
    expect(buildPrompt('email_composer', base)).toContain('Follow up on proposal')
  })

  it('includes key points', () => {
    const prompt = buildPrompt('email_composer', base)
    expect(prompt).toContain('pricing')
    expect(prompt).toContain('timeline')
  })

  it('omits key points line when array is empty', () => {
    const prompt = buildPrompt('email_composer', { ...base, keyPoints: [] })
    expect(prompt).not.toContain('Key points to include')
  })

  it('brief → 100–180 words', () => {
    const prompt = buildPrompt('email_composer', { ...base, emailLength: 'brief' })
    expect(prompt).toContain('100–180 words')
  })

  it('standard → 200–350 words', () => {
    expect(buildPrompt('email_composer', base)).toContain('200–350 words')
  })

  it('detailed → 400–600 words', () => {
    const prompt = buildPrompt('email_composer', { ...base, emailLength: 'detailed' })
    expect(prompt).toContain('400–600 words')
  })

  it('formal style description is included', () => {
    expect(buildPrompt('email_composer', base)).toContain('no contractions')
  })

  it('friendly style description is included', () => {
    const prompt = buildPrompt('email_composer', { ...base, emailStyle: 'friendly' })
    expect(prompt).toContain('warm but on-point')
  })

  it('includes Subject line instruction', () => {
    expect(buildPrompt('email_composer', base)).toContain('Subject:')
  })
})

// ─── buildPrompt — social_media_caption ───────────────────────────────────

describe('buildPrompt() — social_media_caption', () => {
  const base: SocialMediaInputs = {
    platform: 'instagram',
    topic: 'Morning routine tips',
    tone: 'casual',
    wordCount: 'short',
  }

  it('mentions the platform name', () => {
    expect(buildPrompt('social_media_caption', base)).toContain('Instagram')
  })

  it('includes the topic', () => {
    expect(buildPrompt('social_media_caption', base)).toContain('Morning routine tips')
  })

  it('includes the tone', () => {
    expect(buildPrompt('social_media_caption', base)).toContain('casual')
  })

  it('instagram short → 60-90 слів', () => {
    const prompt = buildPrompt('social_media_caption', base)
    expect(prompt).toContain('60-90 слів')
  })

  it('linkedin medium → 180-280 слів', () => {
    const prompt = buildPrompt('social_media_caption', {
      ...base,
      platform: 'linkedin',
      wordCount: 'medium',
    })
    expect(prompt).toContain('180-280 слів')
  })

  it('twitter micro → До 140 символів', () => {
    const prompt = buildPrompt('social_media_caption', {
      ...base,
      platform: 'twitter',
      wordCount: 'micro',
    })
    expect(prompt).toContain('До 140 символів')
  })

  it('twitter long → тред 3-4 твітів', () => {
    const prompt = buildPrompt('social_media_caption', {
      ...base,
      platform: 'twitter',
      wordCount: 'long',
    })
    expect(prompt).toContain('3-4 твітів')
  })

  it('instagram rules include hashtags', () => {
    const prompt = buildPrompt('social_media_caption', base)
    expect(prompt).toContain('хештегами')
  })

  it('linkedin rules mention no emoji', () => {
    const prompt = buildPrompt('social_media_caption', {
      ...base,
      platform: 'linkedin',
      wordCount: 'short',
    })
    expect(prompt).toContain('Без емодзі')
  })

  it('twitter rules forbid markdown', () => {
    const prompt = buildPrompt('social_media_caption', {
      ...base,
      platform: 'twitter',
      wordCount: 'short',
    })
    expect(prompt).toContain('Без жодного markdown')
  })

  it('includes hook / розвиток / висновок structure', () => {
    const prompt = buildPrompt('social_media_caption', base)
    expect(prompt).toContain('ХУК')
    expect(prompt).toContain('РОЗВИТОК')
    expect(prompt).toContain('ВИСНОВОК')
  })

  it('facebook micro → 40-70 слів', () => {
    const prompt = buildPrompt('social_media_caption', {
      ...base,
      platform: 'facebook',
      wordCount: 'micro',
    })
    expect(prompt).toContain('40-70 слів')
  })
})
