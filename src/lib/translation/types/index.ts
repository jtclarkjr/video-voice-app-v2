export type TranslationLanguageCode =
  | 'en'
  | 'es'
  | 'fr'
  | 'de'
  | 'it'
  | 'pt'
  | 'ja'
  | 'ko'
  | 'zh'
  | 'ar'
  | 'hi'

export type TranslationConnectionStatus =
  | 'idle'
  | 'requesting-microphone'
  | 'connecting'
  | 'listening'
  | 'renewing'
  | 'stopped'

export type LiveTranslationSession = {
  renew: () => Promise<void>
  stop: () => void
}

export type StartLiveTranslationSessionOptions = {
  targetLanguage: TranslationLanguageCode
  onTranscriptDelta: (delta: string) => void
  onTranslatedAudioStream?: (stream: MediaStream) => void
  onStatus?: (status: TranslationConnectionStatus) => void
  onError?: (message: string) => void
}

export type TranslationClientSecretResponse = {
  value?: unknown
  client_secret?: {
    value?: unknown
  }
}

export type TranslationConnection = {
  events: RTCDataChannel | null
  peerConnection: RTCPeerConnection
  translatedAudioStream: MediaStream | null
}

export type RealtimeTranslationEvent = {
  type?: unknown
  delta?: unknown
}

export type TranslationSessionTiming = {
  elapsedMs: number
  hardCutoffReached: boolean
  shouldRenew: boolean
  shouldWarn: boolean
  timeUntilHardCutoffMs: number
  timeUntilRenewMs: number
}
