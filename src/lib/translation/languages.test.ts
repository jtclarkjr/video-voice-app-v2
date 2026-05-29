import { describe, expect, it } from 'vite-plus/test'
import {
  defaultTranslationLanguage,
  getTranslationLanguageLabel,
  isSupportedTranslationLanguage,
  normalizeTranslationLanguage
} from '$lib/translation/languages'

describe('translation languages', () => {
  it('normalizes supported language codes', () => {
    expect(normalizeTranslationLanguage(' ES ')).toBe('es')
    expect(normalizeTranslationLanguage('ja')).toBe('ja')
  })

  it('falls back to the default language for unsupported values', () => {
    expect(normalizeTranslationLanguage('xx')).toBe(defaultTranslationLanguage)
    expect(normalizeTranslationLanguage(null)).toBe(defaultTranslationLanguage)
  })

  it('identifies supported language codes and labels', () => {
    expect(isSupportedTranslationLanguage('fr')).toBe(true)
    expect(isSupportedTranslationLanguage('xx')).toBe(false)
    expect(getTranslationLanguageLabel('ko')).toBe('Korean')
  })
})
