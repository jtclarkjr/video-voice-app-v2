import { beforeEach, describe, expect, it } from 'vite-plus/test'
import {
  ensureAnonymousSession,
  getUserDisplayName,
  hasAuthenticatedSession,
  isAnonymousUser
} from '$lib/auth/session-service'
import { createGuestSession, setCurrentSession } from '$lib/auth/session-store'

describe('session service', () => {
  beforeEach(() => {
    setCurrentSession(createGuestSession(), false)
  })

  it('initializes a guest session when auth is not configured', async () => {
    const session = await ensureAnonymousSession()
    expect(session?.user.id).toBe('guest-user')
    expect(isAnonymousUser(session?.user)).toBe(true)
    expect(hasAuthenticatedSession(session)).toBe(false)
  })

  it('derives display names from user metadata or falls back safely', () => {
    expect(getUserDisplayName(null)).toBe('Guest')
    expect(
      getUserDisplayName({
        id: '123',
        email: 'jane@example.com',
        user_metadata: { name: 'Jane' }
      } as never)
    ).toBe('Jane')
    expect(
      getUserDisplayName({
        id: '456',
        email: 'fallback@example.com',
        user_metadata: {}
      } as never)
    ).toBe('fallback@example.com')
  })

  it('treats anonymous Supabase sessions as authenticated for joining rooms', () => {
    expect(
      hasAuthenticatedSession({
        access_token: 'anon-access-token',
        refresh_token: 'anon-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: 'anon-user-id',
          is_anonymous: true,
          app_metadata: {
            provider: 'anonymous'
          }
        } as never
      })
    ).toBe(true)
  })
})
