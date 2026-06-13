import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { getAccessToken } from '$lib/auth/session-service'
import { translationConversationSessionsPath } from '$lib/translation/conversation/constants'
import {
  createAuthenticatedTranslationConversationSession,
  createTranslationConversationSession,
  deleteTranslationConversationSession,
  exchangeTranslationConversationSessionOffer
} from '$lib/translation/conversation/session-api'

vi.mock('$lib/auth/session-service', () => ({
  getAccessToken: vi.fn()
}))

describe('translation conversation session API', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.mocked(getAccessToken).mockReset()
  })

  it('creates a backend session with two languages and no output audio', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            expiresAt: '2026-05-30T12:10:00Z',
            id: 'conversation-123'
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        )
    )
    vi.stubGlobal('fetch', fetchMock)

    const session = await createTranslationConversationSession(
      ['en', 'ja'],
      'access-token',
      'http://localhost:8080'
    )

    expect(session).toEqual({
      expiresAt: '2026-05-30T12:10:00Z',
      id: 'conversation-123'
    })
    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:8080${translationConversationSessionsPath}`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer access-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          languages: ['en', 'ja'],
          outputAudio: false
        })
      }
    )
  })

  it('posts offer SDP to the backend conversation route', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response('answer-sdp', {
          status: 200,
          headers: { 'Content-Type': 'application/sdp' }
        })
    )
    vi.stubGlobal('fetch', fetchMock)

    const answer = await exchangeTranslationConversationSessionOffer(
      'conversation-123',
      'offer-sdp',
      'access-token',
      'http://localhost:8080'
    )

    expect(answer).toBe('answer-sdp')
    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:8080${translationConversationSessionsPath}/conversation-123/offer`,
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

  it('deletes backend conversation sessions as best-effort cleanup', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    await deleteTranslationConversationSession(
      'conversation-123',
      'access-token',
      'http://localhost:8080'
    )

    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:8080${translationConversationSessionsPath}/conversation-123`,
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

    await expect(
      createAuthenticatedTranslationConversationSession(['en', 'ja'])
    ).rejects.toThrow('Sign in to start translation.')
  })

  it('maps backend errors to user-facing messages', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 503 }))
    )

    await expect(
      createTranslationConversationSession(
        ['en', 'ja'],
        'access-token',
        'http://localhost:8080'
      )
    ).rejects.toThrow('Conversation translation is not configured.')
  })
})
