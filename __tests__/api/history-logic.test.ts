/**
 * Tests for pure pagination / validation logic mirrored from
 * app/api/history/route.ts — tested without a real HTTP server.
 */
import { describe, it, expect } from 'vitest'
import { isValidContentType } from '@/lib/prompts'

const PAGE_LIMIT = 20

function parseLimit(raw: string | null): number {
  return Math.min(parseInt(raw ?? String(PAGE_LIMIT), 10), 50)
}

function parseOffset(raw: string | null): number {
  return Math.max(parseInt(raw ?? '0', 10), 0)
}

function parseTokesUsed(tokensUsed: unknown): number | null {
  return typeof tokensUsed === 'number' && tokensUsed > 0 ? tokensUsed : null
}

describe('parseLimit()', () => {
  it('defaults to PAGE_LIMIT when null', () => {
    expect(parseLimit(null)).toBe(20)
  })

  it('caps at 50', () => {
    expect(parseLimit('100')).toBe(50)
    expect(parseLimit('51')).toBe(50)
    expect(parseLimit('50')).toBe(50)
  })

  it('accepts values below 50', () => {
    expect(parseLimit('10')).toBe(10)
    expect(parseLimit('1')).toBe(1)
  })

  it('returns NaN for non-numeric string (parseInt behaviour)', () => {
    expect(parseLimit('abc')).toBeNaN()
  })
})

describe('parseOffset()', () => {
  it('defaults to 0 when null', () => {
    expect(parseOffset(null)).toBe(0)
  })

  it('clamps negative values to 0', () => {
    expect(parseOffset('-5')).toBe(0)
    expect(parseOffset('-1')).toBe(0)
  })

  it('passes positive values through', () => {
    expect(parseOffset('20')).toBe(20)
    expect(parseOffset('100')).toBe(100)
  })
})

describe('parseTokesUsed()', () => {
  it('returns null for 0', () => {
    expect(parseTokesUsed(0)).toBeNull()
  })

  it('returns null for negative numbers', () => {
    expect(parseTokesUsed(-1)).toBeNull()
  })

  it('returns null for non-numbers', () => {
    expect(parseTokesUsed('100')).toBeNull()
    expect(parseTokesUsed(null)).toBeNull()
    expect(parseTokesUsed(undefined)).toBeNull()
  })

  it('returns the value for positive numbers', () => {
    expect(parseTokesUsed(150)).toBe(150)
    expect(parseTokesUsed(1)).toBe(1)
  })
})

describe('POST history — content type validation', () => {
  it('rejects invalid content type', () => {
    expect(isValidContentType('bad_type')).toBe(false)
  })

  it('accepts all valid content types', () => {
    expect(isValidContentType('product_description')).toBe(true)
    expect(isValidContentType('blog_post_outline')).toBe(true)
    expect(isValidContentType('email_composer')).toBe(true)
    expect(isValidContentType('social_media_caption')).toBe(true)
  })
})

describe('result field validation', () => {
  function isValidResult(result: unknown): boolean {
    return !!result && typeof result === 'string'
  }

  it('rejects null result', () => {
    expect(isValidResult(null)).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidResult('')).toBe(false)
  })

  it('rejects number', () => {
    expect(isValidResult(42)).toBe(false)
  })

  it('accepts non-empty string', () => {
    expect(isValidResult('some content')).toBe(true)
  })
})

describe('inputs sanitization', () => {
  function sanitizeInputs(inputs: unknown): Record<string, unknown> {
    return (inputs && typeof inputs === 'object') ? inputs as Record<string, unknown> : {}
  }

  it('passes through valid objects', () => {
    expect(sanitizeInputs({ productName: 'Pen' })).toEqual({ productName: 'Pen' })
  })

  it('returns empty object for null', () => {
    expect(sanitizeInputs(null)).toEqual({})
  })

  it('returns empty object for string', () => {
    expect(sanitizeInputs('text')).toEqual({})
  })

  it('returns empty object for number', () => {
    expect(sanitizeInputs(42)).toEqual({})
  })
})
