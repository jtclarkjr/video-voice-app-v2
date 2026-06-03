import { getApiBaseUrl } from '$lib/api'
import { getAccessToken } from '$lib/auth/session-service'
import { normalizeTranslationLanguage } from '$lib/translation/config/languages'
import { translationConversationSessionsPath } from '$lib/translation/conversation/constants'
import type { ConversationLanguagePair } from '$lib/translation/types'

export type TranslationConversationBackendSession = {
  expiresAt?: string
  id: string
}

type TranslationConversationBackendSessionResponse = {
  expiresAt?: unknown
  id?: unknown
}

export async function createAuthenticatedTranslationConversationSession(
  languages: ConversationLanguagePair
): Promise<{
  accessToken: string
  session: TranslationConversationBackendSession
}> {
  const accessToken = await getAccessToken()
  if (!accessToken) {
    throw new Error('Sign in to start translation.')
  }

  return {
    accessToken,
    session: await createTranslationConversationSession(languages, accessToken)
  }
}

export async function createTranslationConversationSession(
  languages: ConversationLanguagePair,
  accessToken: string,
  apiBaseUrl = getApiBaseUrl()
): Promise<TranslationConversationBackendSession> {
  if (!accessToken.trim()) {
    throw new Error('Sign in to start translation.')
  }

  const normalizedLanguages = [
    normalizeTranslationLanguage(languages[0]),
    normalizeTranslationLanguage(languages[1])
  ] as const
  const response = await fetch(
    `${apiBaseUrl}${translationConversationSessionsPath}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        languages: normalizedLanguages,
        outputAudio: false
      })
    }
  )

  if (!response.ok) {
    throw new Error(getTranslationConversationSessionError(response.status))
  }

  return extractTranslationConversationSession(await response.json())
}

export async function exchangeTranslationConversationSessionOffer(
  sessionId: string,
  offerSdp: string,
  accessToken: string,
  apiBaseUrl = getApiBaseUrl()
): Promise<string> {
  if (!sessionId.trim() || !offerSdp.trim() || !accessToken.trim()) {
    throw new Error('Could not connect to the conversation.')
  }

  const response = await fetch(
    `${apiBaseUrl}${translationConversationSessionsPath}/${encodeURIComponent(
      sessionId
    )}/offer`,
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
    throw new Error('Could not connect to the conversation.')
  }

  const answerSdp = await response.text()
  if (!answerSdp.trim()) {
    throw new Error('Invalid conversation response.')
  }
  return answerSdp
}

export async function deleteTranslationConversationSession(
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
      `${apiBaseUrl}${translationConversationSessionsPath}/${encodeURIComponent(
        sessionId
      )}`,
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

function extractTranslationConversationSession(
  payload: TranslationConversationBackendSessionResponse
): TranslationConversationBackendSession {
  if (typeof payload.id !== 'string' || !payload.id.trim()) {
    throw new Error('Invalid conversation response.')
  }

  return {
    expiresAt:
      typeof payload.expiresAt === 'string' ? payload.expiresAt : undefined,
    id: payload.id
  }
}

function getTranslationConversationSessionError(status: number): string {
  if (status === 401) {
    return 'Sign in to start translation.'
  }
  if (status === 400) {
    return 'Choose two supported conversation languages.'
  }
  if (status === 503) {
    return 'Conversation translation is not configured.'
  }
  return 'Could not start conversation.'
}
