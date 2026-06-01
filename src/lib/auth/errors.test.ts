import { describe, expect, it } from 'vite-plus/test'
import { getAuthErrorMessage } from '$lib/auth/errors'

describe('auth errors', () => {
  it('normalizes email rate limit errors', () => {
    const error = Object.assign(
      new Error('Request failed: 429 Email rate limit exceeded'),
      { statusCode: 429 }
    )

    expect(getAuthErrorMessage(error, 'Could not create account.')).toBe(
      'Email rate limit exceeded. Please wait before trying again.'
    )
  })
})
