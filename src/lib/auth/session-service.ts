import {
  type AuthSessionResponse,
  type AuthTokenResponse,
  type OAuthProvider
} from '@jtclarkjr/supabase-ts-rest'
import { getAuthErrorMessage } from '$lib/auth/errors'
import {
  anonymousDisplayName,
  clearAuthRedirectParams,
  createGuestSession,
  getCurrentSession,
  hasSupabaseConfig,
  isGuestSession,
  isGuestUser,
  loadStoredSession,
  normalizeSessionPayload,
  normalizeUser,
  redirectHomeIfInCallFlow,
  setCurrentSession,
  setLastSessionError,
  supabase
} from '$lib/auth/session-store'
import type { Session, SessionPayload, User } from '$lib/auth/types'

let initializeSessionPromise: Promise<Session | null> | null = null

const resolveSession = async (
  value: AuthSessionResponse | AuthTokenResponse | SessionPayload
): Promise<Session> => {
  const payload = normalizeSessionPayload(value)
  if (!payload) {
    throw new Error('Invalid session response from Supabase.')
  }

  if (!supabase) {
    throw new Error('Supabase auth is not configured.')
  }

  supabase.setToken(payload.access_token)

  let user = payload.user
  if (!user) {
    user = normalizeUser(await supabase.getUser())
  }

  if (!user) {
    throw new Error('Could not load the authenticated user.')
  }

  return {
    ...payload,
    user
  }
}

const refreshSession = async (session: Session): Promise<Session | null> => {
  if (!supabase || !session.refresh_token) {
    return null
  }

  try {
    const refreshed = await supabase.refreshToken(session.refresh_token)
    return await resolveSession(refreshed)
  } catch {
    return null
  }
}

const validateSession = async (session: Session): Promise<Session | null> => {
  if (!supabase) {
    return null
  }

  supabase.setToken(session.access_token)

  const now = Math.floor(Date.now() / 1000)
  if (session.expires_at && session.expires_at <= now + 60) {
    return refreshSession(session)
  }

  try {
    const user = normalizeUser(await supabase.getUser())
    if (!user) {
      throw new Error('Missing user')
    }

    return {
      ...session,
      user
    }
  } catch {
    return refreshSession(session)
  }
}

const consumeOAuthRedirectSession = async (): Promise<Session | null> => {
  if (typeof window === 'undefined' || !supabase) {
    return null
  }

  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : ''
  if (!hash) {
    return null
  }

  const params = new URLSearchParams(hash)
  const error = params.get('error_description') ?? params.get('error')
  if (error) {
    clearAuthRedirectParams()
    throw new Error(error)
  }

  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')
  if (!accessToken || !refreshToken) {
    return null
  }

  const session = await resolveSession({
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: Number(params.get('expires_in') ?? 3600),
    expires_at: params.get('expires_at')
      ? Number(params.get('expires_at'))
      : undefined,
    token_type: params.get('token_type') ?? 'bearer'
  })

  clearAuthRedirectParams()
  return session
}

const initializeSession = async () => {
  if (!hasSupabaseConfig || !supabase) {
    const guestSession = createGuestSession()
    setLastSessionError(null)
    setCurrentSession(guestSession, false)
    return guestSession
  }

  try {
    const redirectSession = await consumeOAuthRedirectSession()
    if (redirectSession) {
      setLastSessionError(null)
      setCurrentSession(redirectSession)
      return redirectSession
    }
  } catch (error) {
    setLastSessionError(
      getAuthErrorMessage(error, 'Could not complete sign-in.')
    )
    const guestSession = createGuestSession()
    setCurrentSession(guestSession)
    return guestSession
  }

  const currentSession = getCurrentSession()
  const storedSession =
    currentSession && !isGuestSession(currentSession)
      ? currentSession
      : loadStoredSession()

  if (!storedSession || isGuestSession(storedSession)) {
    const guestSession = createGuestSession()
    setLastSessionError(null)
    setCurrentSession(guestSession, false)
    return guestSession
  }

  const validated = await validateSession(storedSession)
  if (!validated) {
    const guestSession = createGuestSession()
    setCurrentSession(guestSession)
    return guestSession
  }

  setLastSessionError(null)
  setCurrentSession(validated)
  return validated
}

const ensureInitializedSession = async () => {
  if (!initializeSessionPromise) {
    initializeSessionPromise = initializeSession().finally(() => {
      initializeSessionPromise = null
    })
  }

  return initializeSessionPromise
}

export const isAnonymousUser = (user: User | null | undefined) =>
  Boolean(
    isGuestUser(user) ||
    user?.is_anonymous ||
    user?.app_metadata?.provider === 'anonymous'
  )

export const getUserDisplayName = (user: User | null | undefined) => {
  if (!user || isAnonymousUser(user)) {
    return anonymousDisplayName
  }

  const metadata =
    user.user_metadata && typeof user.user_metadata === 'object'
      ? user.user_metadata
      : {}

  const name = typeof metadata.name === 'string' ? metadata.name.trim() : ''
  if (name) {
    return name
  }

  const email = typeof user.email === 'string' ? user.email.trim() : ''
  return email || 'User'
}

export const getAccessToken = async () => {
  const session = await ensureInitializedSession()
  if (!session || isGuestSession(session) || !session.access_token) {
    return null
  }

  return session.access_token
}

export const hasAuthenticatedSession = (session: Session | null | undefined) =>
  !!(session && !isGuestSession(session) && session.access_token)

export const ensureAnonymousSession = async () => ensureInitializedSession()

export const signInWithEmail = async (email: string, password: string) => {
  if (!hasSupabaseConfig || !supabase) {
    return {
      data: null,
      error: { message: 'Supabase auth is not configured.' }
    }
  }

  try {
    const session = await resolveSession(await supabase.signIn(email, password))
    setLastSessionError(null)
    setCurrentSession(session)
    return { data: { session }, error: null }
  } catch (error) {
    return {
      data: null,
      error: {
        message: getAuthErrorMessage(error, 'Could not sign in.')
      }
    }
  }
}

export const signUpWithEmail = async (
  email: string,
  password: string,
  name: string
) => {
  if (!hasSupabaseConfig || !supabase) {
    return {
      data: null,
      error: { message: 'Supabase auth is not configured.' }
    }
  }

  try {
    const session = await resolveSession(
      await supabase.signUp(email, password, {
        data: { name }
      })
    )

    setLastSessionError(null)
    setCurrentSession(session)
    return { data: { session }, error: null }
  } catch (error) {
    return {
      data: null,
      error: {
        message: getAuthErrorMessage(error, 'Could not create account.')
      }
    }
  }
}

export const signInWithOAuth = async (provider: OAuthProvider) => {
  if (!hasSupabaseConfig || !supabase) {
    return {
      error: { message: 'Supabase auth is not configured.' },
      data: null
    }
  }

  try {
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}${window.location.pathname}${window.location.search}`
        : undefined

    const data = supabase.getOAuthSignInUrl(provider, {
      redirectTo
    })

    if (typeof window !== 'undefined') {
      window.location.assign(data.url)
    }

    return { data, error: null }
  } catch (error) {
    return {
      data: null,
      error: {
        message: getAuthErrorMessage(error, 'Could not start OAuth sign-in.')
      }
    }
  }
}

export const signOut = async () => {
  if (!hasSupabaseConfig || !supabase) {
    const guestSession = createGuestSession()
    setCurrentSession(guestSession)
    redirectHomeIfInCallFlow()
    return guestSession
  }

  const accessToken =
    getCurrentSession()?.access_token ?? loadStoredSession()?.access_token
  if (accessToken) {
    supabase.setToken(accessToken)
    try {
      await supabase.signOut('global')
    } catch {
      // Ignore remote sign-out failures and clear local state anyway.
    }
  }

  const guestSession = createGuestSession()
  setCurrentSession(guestSession)
  redirectHomeIfInCallFlow()
  return guestSession
}
