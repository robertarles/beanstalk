import { describe, it, expect } from 'vitest'
import { asBeansError, isConflict, isBeansUnavailable } from '../../lib/beansError'

describe('beansError (beanstalk-ep8j)', () => {
  it('reads the structured error the backend rejects with', () => {
    // Tauri rejects with a plain object, not an Error, so `instanceof Error`
    // would throw the message away.
    expect(asBeansError({ code: 'CONFLICT', message: 'changed on disk' })).toEqual({
      code: 'CONFLICT',
      message: 'changed on disk',
    })
  })

  it('falls back for a real Error', () => {
    expect(asBeansError(new Error('boom'))).toEqual({ code: 'UNKNOWN', message: 'boom' })
  })

  it('falls back for a bare string', () => {
    expect(asBeansError('plain failure')).toEqual({ code: 'UNKNOWN', message: 'plain failure' })
  })

  it('identifies a conflict', () => {
    expect(isConflict({ code: 'CONFLICT', message: 'x' })).toBe(true)
    expect(isConflict({ code: 'VALIDATION_ERROR', message: 'x' })).toBe(false)
    expect(isConflict(new Error('x'))).toBe(false)
  })

  it('identifies a missing binary', () => {
    expect(isBeansUnavailable({ code: 'BEANS_UNAVAILABLE', message: 'x' })).toBe(true)
    expect(isBeansUnavailable({ code: 'CONFLICT', message: 'x' })).toBe(false)
  })
})
