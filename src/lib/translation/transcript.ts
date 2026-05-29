export type RealtimeTranslationEvent = {
  type?: unknown
  delta?: unknown
}

export function getTranslationDelta(event: unknown): string | null {
  if (!event || typeof event !== 'object') {
    return null
  }

  const candidate = event as RealtimeTranslationEvent
  if (
    candidate.type !== 'session.output_transcript.delta' ||
    typeof candidate.delta !== 'string'
  ) {
    return null
  }

  return candidate.delta
}

export function applyTranslationEvent(
  transcript: string,
  event: unknown
): string {
  const delta = getTranslationDelta(event)
  return delta ? transcript + delta : transcript
}
