import { describe, it, expect } from 'vitest'
import { isAllowedUrl } from '../../lib/markdown'

describe('isAllowedUrl', () => {
  it('allows http URLs', () => {
    expect(isAllowedUrl('http://example.com')).toBe(true)
  })

  it('allows https URLs', () => {
    expect(isAllowedUrl('https://example.com')).toBe(true)
  })

  it('allows https URLs with paths and query params', () => {
    expect(isAllowedUrl('https://example.com/path?q=1#hash')).toBe(true)
  })

  it('disallows javascript: scheme', () => {
    expect(isAllowedUrl('javascript:void(0)')).toBe(false)
  })

  it('disallows file: scheme', () => {
    expect(isAllowedUrl('file:///etc/passwd')).toBe(false)
  })

  it('disallows data: scheme', () => {
    expect(isAllowedUrl('data:text/html,<h1>XSS</h1>')).toBe(false)
  })

  it('disallows ftp: scheme', () => {
    expect(isAllowedUrl('ftp://example.com')).toBe(false)
  })

  it('returns false for malformed URLs', () => {
    expect(isAllowedUrl('not-a-url')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isAllowedUrl('')).toBe(false)
  })
})
