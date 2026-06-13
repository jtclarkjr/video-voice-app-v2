import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { getAccessToken } from '$lib/auth/session-service'
import { translationSessionsPath } from '$lib/translation/realtime/constants'
import {
  createAuthenticatedTranslationSession,
  createTranslationSession,
  deleteTranslationSession,
  exchangeTranslationSessionOffer
} from '$lib/translation/realtime/session-api'

vi.mock('$lib/auth/session-service', () => ({
  getAccessToken: vi.fn()
}))

describe('translation session API', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.mocked(getAccessToken).mockReset()
  })

  it('creates a backend session with the selected language and bearer token', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            expiresAt: '2026-05-30T12:10:00Z',
            id: 'session-123'
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        )
    )
    vi.stubGlobal('fetch', fetchMock)

    const session = await createTranslationSession(
      'es',
      'access-token',
      'http://localhost:8080'
    )

    expect(session).toEqual({
      expiresAt: '2026-05-30T12:10:00Z',
      id: 'session-123'
    })
    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:8080${translationSessionsPath}?lang=es`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer access-token'
        }
      }
    )
  })

  it('posts offer SDP to the backend session route', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response('answer-sdp', {
          status: 200,
          headers: { 'Content-Type': 'application/sdp' }
        })
    )
    vi.stubGlobal('fetch', fetchMock)

    const answer = await exchangeTranslationSessionOffer(
      'session-123',
      'offer-sdp',
      'access-token',
      'http://localhost:8080'
    )

    expect(answer).toBe('answer-sdp')
    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:8080${translationSessionsPath}/session-123/offer`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer access-token',
          'Content-Type': 'application/sdp'
        },
        body: 'offer-sdp'
      }
    )
  })

  it('deletes backend sessions as best-effort cleanup', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    await deleteTranslationSession(
      'session-123',
      'access-token',
      'http://localhost:8080'
    )

    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:8080${translationSessionsPath}/session-123`,
      {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer access-token'
        }
      }
    )
  })

  it('requires an authenticated access token', async () => {
    vi.mocked(getAccessToken).mockResolvedValue(null)

    await expect(createAuthenticatedTranslationSession('es')).rejects.toThrow(
      'Sign in to start translation.'
    )
  })

  it('maps backend errors to user-facing messages', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 503 }))
    )

    await expect(
      createTranslationSession('es', 'access-token', 'http://localhost:8080')
    ).rejects.toThrow('Live translation is not configured.')
  })
})
