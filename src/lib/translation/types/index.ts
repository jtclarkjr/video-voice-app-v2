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
  | 'hi'
  | 'ru'
  | 'id'
  | 'vi'

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

export type TranslationConnection = {
  cleanupTranslationSession?: (() => void) | null
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
