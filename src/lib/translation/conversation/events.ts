import { isSupportedTranslationLanguage } from '$lib/translation/config/languages'
import type {
  ConversationLanguagePair,
  ConversationRealtimeEvent,
  ConversationSpeakerLanguage,
  ConversationTurn,
  TranslationLanguageCode
} from '$lib/translation/types'

export function createConversationRealtimeEventMapper(
  languages: ConversationLanguagePair
): (event: unknown) => ConversationRealtimeEvent | null {
  let turnIndex = 0
  let currentTurnId: string | null = null

  const ensureTurnId = () => {
    currentTurnId ??= `openai-turn-${++turnIndex}`
    return currentTurnId
  }

  return (event) => {
    const conversationEvent = getConversationRealtimeEvent(event)
    if (conversationEvent) {
      return conversationEvent
    }

    if (!event || typeof event !== 'object') {
      return null
    }

    const candidate = event as Record<string, unknown>
    const type = candidate.type
    if (typeof type !== 'string') {
      return null
    }

    if (type === 'session.input_transcript.delta') {
      const delta = getNonEmptyString(candidate.delta)
      if (!delta) {
        return null
      }
      return {
        delta,
        language: languages[0],
        turnId: ensureTurnId(),
        type: 'conversation.transcript.delta'
      }
    }

    if (type === 'session.output_transcript.delta') {
      const delta = getNonEmptyString(candidate.delta)
      if (!delta) {
        return null
      }
      return {
        delta,
        sourceLanguage: languages[0],
        targetLanguage: languages[1],
        turnId: ensureTurnId(),
        type: 'conversation.translation.delta'
      }
    }

    if (
      type === 'session.output_transcript.done' ||
      type === 'session.output_transcript.completed'
    ) {
      const turnId = currentTurnId
      currentTurnId = null
      return turnId
        ? {
            turnId,
            type: 'conversation.turn.completed'
          }
        : null
    }

    return null
  }
}

export function getConversationRealtimeEvent(
  event: unknown
): ConversationRealtimeEvent | null {
  if (!event || typeof event !== 'object') {
    return null
  }

  const candidate = event as Record<string, unknown>
  const type = candidate.type
  if (typeof type !== 'string') {
    return null
  }

  if (type === 'conversation.transcript.delta') {
    const turnId = getNonEmptyString(candidate.turnId)
    const delta = getNonEmptyString(candidate.delta)
    const language = getConversationLanguage(candidate.language)
    if (!turnId || !delta || !language) {
      return null
    }
    return {
      delta,
      language,
      turnId,
      type
    }
  }

  if (type === 'conversation.translation.delta') {
    const turnId = getNonEmptyString(candidate.turnId)
    const delta = getNonEmptyString(candidate.delta)
    const sourceLanguage = getConversationLanguage(candidate.sourceLanguage)
    const targetLanguage = getConversationLanguage(candidate.targetLanguage)
    if (!turnId || !delta || !sourceLanguage || !targetLanguage) {
      return null
    }
    return {
      delta,
      sourceLanguage,
      targetLanguage,
      turnId,
      type
    }
  }

  if (type === 'conversation.turn.completed') {
    const turnId = getNonEmptyString(candidate.turnId)
    return turnId ? { turnId, type } : null
  }

  return null
}

export function applyConversationEvent(
  turns: readonly ConversationTurn[],
  event: ConversationRealtimeEvent,
  languages: ConversationLanguagePair
): ConversationTurn[] {
  if (event.type === 'conversation.turn.completed') {
    return updateConversationTurn(turns, event.turnId, (turn) =>
      turn ? { ...turn, completed: true } : null
    )
  }

  if (event.type === 'conversation.transcript.delta') {
    return updateConversationTurn(turns, event.turnId, (turn) => {
      const nextTurn = turn ?? createEmptyConversationTurn(event, languages)
      return {
        ...nextTurn,
        sourceText: nextTurn.sourceText + event.delta,
        speakerLanguage: event.language,
        targetLanguage: getPeerLanguage(event.language, languages)
      }
    })
  }

  return updateConversationTurn(turns, event.turnId, (turn) => {
    const nextTurn = turn ?? createEmptyConversationTurn(event, languages)
    return {
      ...nextTurn,
      speakerLanguage: event.sourceLanguage,
      targetLanguage: event.targetLanguage,
      translatedText: nextTurn.translatedText + event.delta
    }
  })
}

export function isConversationErrorEvent(event: unknown): boolean {
  return (
    !!event &&
    typeof event === 'object' &&
    (event as { type?: unknown }).type === 'error'
  )
}

function updateConversationTurn(
  turns: readonly ConversationTurn[],
  turnId: string,
  update: (turn: ConversationTurn | null) => ConversationTurn | null
): ConversationTurn[] {
  const index = turns.findIndex((turn) => turn.id === turnId)
  const currentTurn = index === -1 ? null : turns[index]
  const nextTurn = update(currentTurn)
  if (!nextTurn) {
    return [...turns]
  }

  if (index === -1) {
    return [...turns, nextTurn]
  }

  const nextTurns = [...turns]
  nextTurns[index] = nextTurn
  return nextTurns
}

function createEmptyConversationTurn(
  event:
    | Extract<
        ConversationRealtimeEvent,
        { type: 'conversation.transcript.delta' }
      >
    | Extract<
        ConversationRealtimeEvent,
        { type: 'conversation.translation.delta' }
      >,
  languages: ConversationLanguagePair
): ConversationTurn {
  const speakerLanguage =
    event.type === 'conversation.transcript.delta'
      ? event.language
      : event.sourceLanguage

  return {
    completed: false,
    id: event.turnId,
    sourceText: '',
    speakerLanguage,
    targetLanguage: getPeerLanguage(speakerLanguage, languages),
    translatedText: ''
  }
}

function getPeerLanguage(
  language: ConversationSpeakerLanguage,
  languages: ConversationLanguagePair
): TranslationLanguageCode {
  return languages[0] === language ? languages[1] : languages[0]
}

function getNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed ? value : null
}

function getConversationLanguage(
  value: unknown
): ConversationSpeakerLanguage | null {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return isSupportedTranslationLanguage(normalized) ? normalized : null
}
