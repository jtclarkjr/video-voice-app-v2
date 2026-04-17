import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'

describe('session controller', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.doUnmock('$app/environment')
    vi.unstubAllGlobals()
  })

  it('initializes in a non-browser environment without leaving pending state', async () => {
    vi.doMock('$app/environment', () => ({ browser: false }))

    const { session } = await import('$lib/stores/session.svelte')

    await session.init()

    expect(session.isPending).toBe(false)
    expect(session.isAnonymous).toBe(true)
    expect(session.data?.user?.id).toBe('guest-user')
  })

  it('exposes an authenticated session snapshot', async () => {
    vi.doMock('$app/environment', () => ({ browser: false }))

    const { setCurrentSession } = await import('$lib/auth/session-store')

    setCurrentSession(
      {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: 'user-1',
          email: 'jane@example.com',
          is_anonymous: false,
          app_metadata: { provider: 'email' },
          user_metadata: { name: 'Jane' }
        } as never
      },
      false
    )

    const { session } = await import('$lib/stores/session.svelte')

    expect(session.isAnonymous).toBe(false)
    expect(session.data?.user?.email).toBe('jane@example.com')
  })
})
