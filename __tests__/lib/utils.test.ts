import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn()', () => {
  it('joins multiple strings', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })

  it('filters out falsy values', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b')
  })

  it('returns empty string when all values are falsy', () => {
    expect(cn(false, undefined, null)).toBe('')
  })

  it('returns single class unchanged', () => {
    expect(cn('only')).toBe('only')
  })

  it('handles empty call', () => {
    expect(cn()).toBe('')
  })

  it('handles boolean true as a class (truthy but useless)', () => {
    // true passes Boolean filter but is not a valid class — documented behaviour
    expect(cn('a', true as unknown as string, 'b')).toBe('a true b')
  })
})
