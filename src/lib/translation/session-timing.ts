export const translationSessionWarningMs = 50 * 60 * 1000
export const translationSessionRenewMs = 55 * 60 * 1000
export const translationSessionHardCutoffMs = 59.5 * 60 * 1000
export const translationSessionRenewRetryMs = 15 * 1000
export const translationSessionMaxRenewAttempts = 3

export type TranslationSessionTiming = {
  elapsedMs: number
  hardCutoffReached: boolean
  shouldRenew: boolean
  shouldWarn: boolean
  timeUntilHardCutoffMs: number
  timeUntilRenewMs: number
}

export function getTranslationSessionTiming(
  startedAtMs: number,
  nowMs = Date.now()
): TranslationSessionTiming {
  const elapsedMs = Math.max(0, nowMs - startedAtMs)
  const timeUntilRenewMs = Math.max(0, translationSessionRenewMs - elapsedMs)
  const timeUntilHardCutoffMs = Math.max(
    0,
    translationSessionHardCutoffMs - elapsedMs
  )

  return {
    elapsedMs,
    hardCutoffReached: elapsedMs >= translationSessionHardCutoffMs,
    shouldRenew: elapsedMs >= translationSessionRenewMs,
    shouldWarn: elapsedMs >= translationSessionWarningMs,
    timeUntilHardCutoffMs,
    timeUntilRenewMs
  }
}

export function formatTranslationSessionTime(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(durationMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes === 0) {
    return `${seconds}s`
  }

  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`
}
