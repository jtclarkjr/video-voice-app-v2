import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { getAccessToken } from '$lib/auth/session-service'
import {
  createTranslationClientSecret,
  fetchTranslationClientSecret
} from '$lib/translation/realtime/client-secret'
import { translationClientSecretPath } from '$lib/translation/realtime/constants'

vi.mock('$lib/auth/session-service', () => ({
  getAccessToken: vi.fn()
}))

describe('translation client secret requests', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.mocked(getAccessToken).mockReset()
  })

  it('posts the selected language with the bearer token', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ value: 'client-secret' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const secret = await fetchTranslationClientSecret(
      'es',
      'access-token',
      'http://localhost:8080'
    )

    expect(secret).toBe('client-secret')
    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:8080${translationClientSecretPath}`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer access-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ targetLanguage: 'es' })
      }
    )
  })

  it('handles nested client secret response shapes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({ client_secret: { value: 'nested-secret' } }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      )
    )

    await expect(
      fetchTranslationClientSecret('fr', 'access-token', 'http://localhost:8080')
    ).resolves.toBe('nested-secret')
  })

  it('requires an authenticated access token', async () => {
    vi.mocked(getAccessToken).mockResolvedValue(null)

    await expect(createTranslationClientSecret('es')).rejects.toThrow(
      'Sign in to start translation.'
    )
  })

  it('maps backend errors to user-facing messages', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 503 }))
    )

    await expect(
      fetchTranslationClientSecret('es', 'access-token', 'http://localhost:8080')
    ).rejects.toThrow('Live translation is not configured.')
  })
})
