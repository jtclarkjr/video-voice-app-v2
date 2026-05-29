import { getApiBaseUrl } from '$lib/api'
import { getAccessToken } from '$lib/auth/session-service'
import { normalizeTranslationLanguage } from '$lib/translation/config/languages'
import { translationClientSecretPath } from '$lib/translation/realtime/constants'
import type {
  TranslationClientSecretResponse,
  TranslationLanguageCode
} from '$lib/translation/types'

export async function createTranslationClientSecret(
  targetLanguage: TranslationLanguageCode
): Promise<string> {
  const accessToken = await getAccessToken()
  if (!accessToken) {
    throw new Error('Sign in to start translation.')
  }

  return fetchTranslationClientSecret(targetLanguage, accessToken)
}

export async function fetchTranslationClientSecret(
  targetLanguage: TranslationLanguageCode,
  accessToken: string,
  apiBaseUrl = getApiBaseUrl()
): Promise<string> {
  if (!accessToken.trim()) {
    throw new Error('Sign in to start translation.')
  }

  const response = await fetch(`${apiBaseUrl}${translationClientSecretPath}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      targetLanguage: normalizeTranslationLanguage(targetLanguage)
    })
  })

  if (!response.ok) {
    throw new Error(getTranslationClientSecretError(response.status))
  }

  return extractTranslationClientSecret(await response.json())
}

function extractTranslationClientSecret(
  payload: TranslationClientSecretResponse
): string {
  const value =
    typeof payload.value === 'string'
      ? payload.value
      : payload.client_secret?.value

  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Invalid translation session response.')
  }

  return value
}

function getTranslationClientSecretError(status: number): string {
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
