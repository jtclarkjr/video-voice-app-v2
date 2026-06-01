import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { signUpWithEmail } from '$lib/auth/session-service'

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  setCurrentSession: vi.fn(),
  setLastSessionError: vi.fn(),
  setToken: vi.fn(),
  signUp: vi.fn()
}))

vi.mock('$lib/auth/session-store', () => ({
  anonymousDisplayName: 'Guest',
  clearAuthRedirectParams: vi.fn(),
  createGuestSession: () => ({
    access_token: '',
    refresh_token: '',
    expires_in: 0,
    token_type: 'guest',
    user: { id: 'guest-user' }
  }),
  getCurrentSession: vi.fn(() => null),
  hasSupabaseConfig: true,
  isGuestSession: vi.fn(() => false),
  isGuestUser: vi.fn((user: { id?: string } | null | undefined) => user?.id === 'guest-user'),
  loadStoredSession: vi.fn(() => null),
  normalizeSessionPayload: (value: unknown) => {
    if (!value || typeof value !== 'object') {
      return null
    }

    const payload = value as Record<string, unknown>
    if (
      typeof payload.access_token !== 'string' ||
      typeof payload.refresh_token !== 'string' ||
      typeof payload.expires_in !== 'number'
    ) {
      return null
    }

    return {
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
      expires_in: payload.expires_in,
      token_type: typeof payload.token_type === 'string' ? payload.token_type : 'bearer',
      user: payload.user
    }
  },
  normalizeUser: (value: unknown) =>
    value && typeof value === 'object' ? (value as Record<string, unknown>) : null,
  redirectHomeIfInCallFlow: vi.fn(() => false),
  setCurrentSession: mocks.setCurrentSession,
  setLastSessionError: mocks.setLastSessionError,
  supabase: {
    getUser: mocks.getUser,
    setToken: mocks.setToken,
    signUp: mocks.signUp
  }
}))

describe('signUpWithEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('treats email confirmation signup responses as successful', async () => {
    mocks.signUp.mockResolvedValue({
      id: 'user-id',
      email: 'jane@example.com'
    })

    const result = await signUpWithEmail('jane@example.com', 'password123', 'Jane')

    expect(result.error).toBeNull()
    expect(result.data?.session).toBeNull()
    expect(result.data?.user?.email).toBe('jane@example.com')
    expect(mocks.setLastSessionError).toHaveBeenCalledWith(null)
    expect(mocks.setCurrentSession).not.toHaveBeenCalled()
  })

  it('persists signup session responses', async () => {
    const session = {
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
      user: { id: 'user-id', email: 'jane@example.com' }
    }
    mocks.signUp.mockResolvedValue(session)

    const result = await signUpWithEmail('jane@example.com', 'password123', 'Jane')

    expect(result.error).toBeNull()
    expect(result.data?.session?.access_token).toBe('access-token')
    expect(mocks.setCurrentSession).toHaveBeenCalledWith(session)
  })

  it('returns a clear message for signup email rate limits', async () => {
    mocks.signUp.mockRejectedValue(
      Object.assign(new Error('Request failed: 429 Email rate limit exceeded'), {
        statusCode: 429
      })
    )

    const result = await signUpWithEmail('jane@example.com', 'password123', 'Jane')

    expect(result.data).toBeNull()
    expect(result.error?.message).toBe(
      'Email rate limit exceeded. Please wait before trying again.'
    )
  })
})
