export const translationLanguages = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ar', label: 'Arabic' },
  { code: 'hi', label: 'Hindi' }
] as const

export type TranslationLanguageCode = (typeof translationLanguages)[number]['code']

export const defaultTranslationLanguage: TranslationLanguageCode = 'es'

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
    'Spanish'
  )
}
