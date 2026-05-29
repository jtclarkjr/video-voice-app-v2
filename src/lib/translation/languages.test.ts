import { describe, expect, it } from 'vite-plus/test'
import {
  defaultTranslationLanguage,
  getTranslationLanguageLabel,
  isSupportedTranslationLanguage,
  normalizeTranslationLanguage,
  translationLanguages
} from '$lib/translation/languages'

describe('translation languages', () => {
  it('normalizes supported language codes', () => {
    expect(normalizeTranslationLanguage(' ES ')).toBe('es')
    expect(normalizeTranslationLanguage('ja')).toBe('ja')
  })

  it('falls back to the default language for unsupported values', () => {
    expect(defaultTranslationLanguage).toBe('en')
    expect(normalizeTranslationLanguage('xx')).toBe(defaultTranslationLanguage)
    expect(normalizeTranslationLanguage(null)).toBe(defaultTranslationLanguage)
  })

  it('places English first and Japanese second', () => {
    expect(translationLanguages[0].code).toBe('en')
    expect(translationLanguages[1].code).toBe('ja')
  })

  it('identifies supported language codes and labels', () => {
    expect(isSupportedTranslationLanguage('fr')).toBe(true)
    expect(isSupportedTranslationLanguage('xx')).toBe(false)
    expect(getTranslationLanguageLabel('ko')).toBe('한국어')
    expect(getTranslationLanguageLabel('ja')).toBe('日本語')
    expect(getTranslationLanguageLabel('zh')).toBe('中文')
  })
})
