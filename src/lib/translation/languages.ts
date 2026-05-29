export const translationLanguages = [
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ko', label: '한국어' },
  { code: 'zh', label: '中文' },
  { code: 'ar', label: 'Arabic' },
  { code: 'hi', label: 'Hindi' }
] as const

export type TranslationLanguageCode = (typeof translationLanguages)[number]['code']

export const defaultTranslationLanguage: TranslationLanguageCode = 'en'

const supportedLanguageCodes = new Set<string>(
  translationLanguages.map((language) => language.code)
)

export function isSupportedTranslationLanguage(
  value: string
): value is TranslationLanguageCode {
  return supportedLanguageCodes.has(value)
}

export function normalizeTranslationLanguage(
  value: string | null | undefined
): TranslationLanguageCode {
  const normalized = value?.trim().toLowerCase() ?? ''
  return isSupportedTranslationLanguage(normalized)
    ? normalized
    : defaultTranslationLanguage
}

export function getTranslationLanguageLabel(
  code: TranslationLanguageCode
): string {
  return (
    translationLanguages.find((language) => language.code === code)?.label ??
    'English'
  )
}
