import { getApiBaseUrl } from '$lib/api'
import { getAccessToken } from '$lib/auth/session-service'
import {
  normalizeTranslationLanguage,
  type TranslationLanguageCode
} from '$lib/translation/languages'
import { getTranslationDelta } from '$lib/translation/transcript'

const OPENAI_TRANSLATION_CALLS_URL =
  'https://api.openai.com/v1/realtime/translations/calls'

export type TranslationConnectionStatus =
  | 'idle'
  | 'requesting-microphone'
  | 'connecting'
  | 'listening'
  | 'stopped'

export type LiveTranslationSession = {
  stop: () => void
}

export type StartLiveTranslationSessionOptions = {
  targetLanguage: TranslationLanguageCode
  onTranscriptDelta: (delta: string) => void
  onTranslatedAudioStream?: (stream: MediaStream) => void
  onStatus?: (status: TranslationConnectionStatus) => void
  onError?: (message: string) => void
}

type TranslationClientSecretResponse = {
  value?: unknown
  client_secret?: {
    value?: unknown
  }
}

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

  const response = await fetch(`${apiBaseUrl}/translation/client-secret`, {
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

export async function startLiveTranslationSession({
  targetLanguage,
  onTranscriptDelta,
  onTranslatedAudioStream,
  onStatus,
  onError
}: StartLiveTranslationSessionOptions): Promise<LiveTranslationSession> {
  let stream: MediaStream | null = null
  let translatedAudioStream: MediaStream | null = null
  let peerConnection: RTCPeerConnection | null = null
  let events: RTCDataChannel | null = null
  let stopped = false

  const stop = () => {
    if (stopped) {
      return
    }

    stopped = true
    events?.close()
    events = null

    peerConnection?.getSenders().forEach((sender) => sender.track?.stop())
    peerConnection?.getReceivers().forEach((receiver) => receiver.track?.stop())
    peerConnection?.close()
    peerConnection = null

    for (const track of translatedAudioStream?.getTracks() ?? []) {
      track.stop()
    }
    translatedAudioStream = null

    for (const track of stream?.getTracks() ?? []) {
      track.stop()
    }
    stream = null
    onStatus?.('stopped')
  }

  try {
    onStatus?.('requesting-microphone')
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    if (stopped) {
      stop()
      return { stop }
    }

    onStatus?.('connecting')
    const clientSecret = await createTranslationClientSecret(targetLanguage)
    peerConnection = new RTCPeerConnection()

    for (const track of stream.getAudioTracks()) {
      peerConnection.addTrack(track, stream)
    }

    peerConnection.ontrack = ({ streams, track }) => {
      if (stopped) {
        track.stop()
        return
      }

      const [remoteStream] = streams
      if (remoteStream) {
        translatedAudioStream = remoteStream
      } else {
        translatedAudioStream ??= new MediaStream()
        translatedAudioStream.addTrack(track)
      }

      onTranslatedAudioStream?.(translatedAudioStream)
    }

    peerConnection.onconnectionstatechange = () => {
      if (!peerConnection || stopped) {
        return
      }

      if (peerConnection.connectionState === 'connected') {
        onStatus?.('listening')
      } else if (peerConnection.connectionState === 'failed') {
        onError?.('The translation connection failed.')
      }
    }

    events = peerConnection.createDataChannel('oai-events')
    events.onopen = () => onStatus?.('listening')
    events.onmessage = ({ data }) => {
      const event = parseRealtimeEvent(data)
      const delta = getTranslationDelta(event)
      if (delta) {
        onTranscriptDelta(delta)
      }
      if (isRealtimeErrorEvent(event)) {
        onError?.('The translation session returned an error.')
      }
    }

    const offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)

    const answerResponse = await fetch(OPENAI_TRANSLATION_CALLS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${clientSecret}`,
        'Content-Type': 'application/sdp'
      },
      body: offer.sdp ?? ''
    })

    if (!answerResponse.ok) {
      throw new Error('Could not connect to the translation session.')
    }

    await peerConnection.setRemoteDescription({
      type: 'answer',
      sdp: await answerResponse.text()
    })

    if (!stopped) {
      onStatus?.('listening')
    }

    return { stop }
  } catch (error) {
    stop()
    throw error
  }
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

function parseRealtimeEvent(data: unknown): unknown {
  if (typeof data !== 'string') {
    return data
  }

  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

function isRealtimeErrorEvent(event: unknown): boolean {
  return (
    !!event &&
    typeof event === 'object' &&
    (event as { type?: unknown }).type === 'error'
  )
}
