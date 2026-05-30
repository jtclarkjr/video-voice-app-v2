import { getApiBaseUrl } from '$lib/api'
import { getAccessToken } from '$lib/auth/session-service'
import { normalizeTranslationLanguage } from '$lib/translation/config/languages'
import { translationSessionsPath } from '$lib/translation/realtime/constants'
import type { TranslationLanguageCode } from '$lib/translation/types'

export type TranslationBackendSession = {
  expiresAt?: string
  id: string
}

type TranslationBackendSessionResponse = {
  expiresAt?: unknown
  id?: unknown
}

export async function createAuthenticatedTranslationSession(
  targetLanguage: TranslationLanguageCode
): Promise<{ accessToken: string; session: TranslationBackendSession }> {
  const accessToken = await getAccessToken()
  if (!accessToken) {
    throw new Error('Sign in to start translation.')
  }

  return {
    accessToken,
    session: await createTranslationSession(targetLanguage, accessToken)
  }
}

export async function createTranslationSession(
  targetLanguage: TranslationLanguageCode,
  accessToken: string,
  apiBaseUrl = getApiBaseUrl()
): Promise<TranslationBackendSession> {
  if (!accessToken.trim()) {
    throw new Error('Sign in to start translation.')
  }

  const lang = normalizeTranslationLanguage(targetLanguage)
  const response = await fetch(
    `${apiBaseUrl}${translationSessionsPath}?lang=${encodeURIComponent(lang)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  )

  if (!response.ok) {
    throw new Error(getTranslationSessionError(response.status))
  }

  return extractTranslationSession(await response.json())
}

export async function exchangeTranslationSessionOffer(
  sessionId: string,
  offerSdp: string,
  accessToken: string,
  apiBaseUrl = getApiBaseUrl()
): Promise<string> {
  if (!sessionId.trim() || !offerSdp.trim() || !accessToken.trim()) {
    throw new Error('Could not connect to the translation session.')
  }

  const response = await fetch(
    `${apiBaseUrl}${translationSessionsPath}/${encodeURIComponent(sessionId)}/offer`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/sdp'
      },
      body: offerSdp
    }
  )

  if (!response.ok) {
    throw new Error('Could not connect to the translation session.')
  }

  const answerSdp = await response.text()
  if (!answerSdp.trim()) {
    throw new Error('Invalid translation session response.')
  }
  return answerSdp
}

export async function deleteTranslationSession(
  sessionId: string,
  accessToken?: string | null,
  apiBaseUrl = getApiBaseUrl()
): Promise<void> {
  if (!sessionId.trim()) {
    return
  }

  const token = accessToken ?? (await getAccessToken())
  if (!token?.trim()) {
    return
  }

  try {
    await fetch(
      `${apiBaseUrl}${translationSessionsPath}/${encodeURIComponent(sessionId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
  } catch {
    // Best-effort cleanup only; closing RTCPeerConnection ends the media session.
  }
}

function extractTranslationSession(
  payload: TranslationBackendSessionResponse
): TranslationBackendSession {
  if (typeof payload.id !== 'string' || !payload.id.trim()) {
    throw new Error('Invalid translation session response.')
  }

  return {
    expiresAt:
      typeof payload.expiresAt === 'string' ? payload.expiresAt : undefined,
    id: payload.id
  }
}

function getTranslationSessionError(status: number): string {
  if (status === 401) {
    return 'Sign in to start translation.'
  }
  if (status === 400) {
    return 'Choose a supported target language.'
  }
  if (status === 503) {
    return 'Live translation is not configured.'
  }
  return 'Could not start translation.'
}
