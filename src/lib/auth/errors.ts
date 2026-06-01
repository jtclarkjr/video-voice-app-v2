const pickAuthErrorMessage = (value: unknown): string | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const payload = value as Record<string, unknown>
  const messageKeys = ['msg', 'message', 'error_description', 'error'] as const

  for (const key of messageKeys) {
    const nextValue = payload[key]
    if (typeof nextValue === 'string' && nextValue.trim()) {
      return nextValue.trim()
    }
  }

  return null
}

const tryParseJson = (value: string): unknown => {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const parseAuthErrorMessage = (value: string): string | null => {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const candidates = [trimmed]
  const firstBraceIndex = trimmed.indexOf('{')
  if (firstBraceIndex >= 0) {
    candidates.push(trimmed.slice(firstBraceIndex))
  }

  for (const candidate of candidates) {
    const parsed = tryParseJson(candidate)
    if (!parsed) {
      continue
    }

    const message = pickAuthErrorMessage(parsed)
    if (message) {
      return message
    }
  }

  return null
}

const getAuthErrorStatusCode = (value: unknown): number | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const payload = value as Record<string, unknown>
  return typeof payload.statusCode === 'number' ? payload.statusCode : null
}

const isEmailRateLimitMessage = (value: string) => {
  const normalized = value.toLowerCase()
  return (
    normalized.includes('email rate limit') ||
    normalized.includes('over_email_send_rate_limit') ||
    normalized.includes('rate limit exceeded') ||
    (normalized.includes('429') && normalized.includes('too many'))
  )
}

export const getAuthErrorMessage = (error: unknown, fallback: string) => {
  let rawMessage: string | null = null

  if (error instanceof Error) {
    rawMessage = error.message
  } else if (typeof error === 'string') {
    rawMessage = error
  }

  if (!rawMessage) {
    return fallback
  }

  const message = parseAuthErrorMessage(rawMessage) ?? rawMessage
  if (
    getAuthErrorStatusCode(error) === 429 ||
    isEmailRateLimitMessage(rawMessage) ||
    isEmailRateLimitMessage(message)
  ) {
    return 'Email rate limit exceeded. Please wait before trying again.'
  }

  return message
}
