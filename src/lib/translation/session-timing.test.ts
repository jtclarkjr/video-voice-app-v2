import { describe, expect, it } from 'vite-plus/test'
import {
  formatTranslationSessionTime,
  getTranslationSessionTiming,
  translationSessionHardCutoffMs,
  translationSessionRenewMs,
  translationSessionWarningMs
} from '$lib/translation/session-timing'

describe('translation session timing', () => {
  it('does not warn or renew before the warning threshold', () => {
    const timing = getTranslationSessionTiming(
      1_000,
      1_000 + translationSessionWarningMs - 1
    )

    expect(timing.shouldWarn).toBe(false)
    expect(timing.shouldRenew).toBe(false)
    expect(timing.hardCutoffReached).toBe(false)
  })

  it('warns before the renewal threshold', () => {
    const timing = getTranslationSessionTiming(0, translationSessionWarningMs)

    expect(timing.shouldWarn).toBe(true)
    expect(timing.shouldRenew).toBe(false)
    expect(timing.timeUntilRenewMs).toBe(
      translationSessionRenewMs - translationSessionWarningMs
    )
  })

  it('requests renewal at the renewal threshold', () => {
    const timing = getTranslationSessionTiming(0, translationSessionRenewMs)

    expect(timing.shouldWarn).toBe(true)
    expect(timing.shouldRenew).toBe(true)
    expect(timing.hardCutoffReached).toBe(false)
  })

  it('reaches the hard cutoff before the remote session limit', () => {
    const timing = getTranslationSessionTiming(0, translationSessionHardCutoffMs)

    expect(timing.shouldRenew).toBe(true)
    expect(timing.hardCutoffReached).toBe(true)
    expect(timing.timeUntilHardCutoffMs).toBe(0)
  })

  it('formats countdown values', () => {
    expect(formatTranslationSessionTime(0)).toBe('0s')
    expect(formatTranslationSessionTime(45_000)).toBe('45s')
    expect(formatTranslationSessionTime(305_000)).toBe('5m 05s')
  })
})
