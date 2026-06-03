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

export type TranslationMode = 'listening' | 'conversation'

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

export type ConversationSpeakerLanguage = TranslationLanguageCode

export type ConversationLanguagePair = readonly [
  TranslationLanguageCode,
  TranslationLanguageCode
]

export type ConversationTurn = {
  completed: boolean
  id: string
  sourceText: string
  speakerLanguage: ConversationSpeakerLanguage
  targetLanguage: TranslationLanguageCode
  translatedText: string
}

export type ConversationTranscriptDeltaEvent = {
  delta: string
  language: ConversationSpeakerLanguage
  turnId: string
  type: 'conversation.transcript.delta'
}

export type ConversationTranslationDeltaEvent = {
  delta: string
  sourceLanguage: ConversationSpeakerLanguage
  targetLanguage: TranslationLanguageCode
  turnId: string
  type: 'conversation.translation.delta'
}

export type ConversationTurnCompletedEvent = {
  turnId: string
  type: 'conversation.turn.completed'
}

export type ConversationRealtimeEvent =
  | ConversationTranscriptDeltaEvent
  | ConversationTranslationDeltaEvent
  | ConversationTurnCompletedEvent

export type TranslationConversationStatus = TranslationConnectionStatus

export type LiveTranslationConversationSession = {
  renew: () => Promise<void>
  stop: () => void
}

export type StartTranslationConversationSessionOptions = {
  languages: ConversationLanguagePair
  onError?: (message: string) => void
  onStatus?: (status: TranslationConversationStatus) => void
  onTurnEvent: (event: ConversationRealtimeEvent) => void
}

export type TranslationConversationConnection = {
  cleanupConversationSession?: (() => void) | null
  events: RTCDataChannel | null
  peerConnection: RTCPeerConnection
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
