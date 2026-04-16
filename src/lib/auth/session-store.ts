import { createClient } from '@jtclarkjr/supabase-ts-rest'
import type {
  Session,
  SessionListener,
  SessionPayload,
  User
} from '$lib/auth/types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''

export const hasSupabaseConfig =
  Boolean(supabaseUrl) && Boolean(supabasePublishableKey)

const projectRef = hasSupabaseConfig
  ? new URL(supabaseUrl).hostname.split('.')[0]
  : 'webrtc-app'
const cookieName = `sb-${projectRef}-auth-token`
const sessionStorageKey = `sb-${projectRef}-auth-session`
const guestUserID = 'guest-user'
export const anonymousDisplayName = 'Guest'

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabasePublishableKey)
  : null

const createGuestUser = (): User =>
  ({
    id: guestUserID,
    email: '',
    is_anonymous: true,
    app_metadata: {
      provider: 'guest'
    },
    user_metadata: {
      name: anonymousDisplayName
    }
  }) as User

export const createGuestSession = (): Session => ({
  access_token: '',
  refresh_token: '',
  expires_in: 0,
  token_type: 'guest',
  user: createGuestUser()
})

export const isGuestUser = (user: User | null | undefined) =>
  user?.id === guestUserID

export const isGuestSession = (session: Session | null | undefined) =>
  Boolean(session?.user && isGuestUser(session.user))

const listeners = new Set<SessionListener>()

let currentSession: Session | null = createGuestSession()
let lastSessionError: string | null = null

export const getCurrentSession = () => currentSession

export const getLastSessionError = () => lastSessionError

export const setLastSessionError = (message: string | null) => {
  lastSessionError = message
}

export const subscribeToSessionChanges = (listener: SessionListener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const notifySessionListeners = (session: Session | null) => {
  for (const listener of listeners) {
    listener(session)
  }
}

const syncSessionToCookie = (session: Session | null) => {
  if (typeof document === 'undefined') {
    return
  }

  if (
    session &&
    !isGuestSession(session) &&
    session.access_token &&
    session.refresh_token
  ) {
    const value = JSON.stringify([session.access_token, session.refresh_token])
    document.cookie = `${cookieName}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
    return
  }

  document.cookie = `${cookieName}=; path=/; max-age=0`
}

const persistSession = (session: Session | null) => {
  if (typeof window !== 'undefined') {
    if (
      session &&
      !isGuestSession(session) &&
      session.access_token &&
      session.refresh_token
    ) {
      window.localStorage.setItem(sessionStorageKey, JSON.stringify(session))
    } else {
      window.localStorage.removeItem(sessionStorageKey)
    }
  }

  syncSessionToCookie(session)
}

export const setCurrentSession = (session: Session | null, notify = true) => {
  currentSession = session
  if (supabase) {
    supabase.setToken(session?.access_token ?? '')
  }
  persistSession(session)
  if (notify) {
    notifySessionListeners(session)
  }
}

export const normalizeUser = (value: unknown): User | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  return value as User
}

export const normalizeSessionPayload = (
  value: unknown
): SessionPayload | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const payload = value as Record<string, unknown>
  if (
    typeof payload.access_token !== 'string' ||
    typeof payload.refresh_token !== 'string' ||
    typeof payload.expires_in !== 'number'
  ) {
    return null
  }

  return {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    expires_in: payload.expires_in,
    expires_at:
      typeof payload.expires_at === 'number' ? payload.expires_at : undefined,
    token_type:
      typeof payload.token_type === 'string' ? payload.token_type : 'bearer',
    user: normalizeUser(payload.user)
  }
}

export const clearAuthRedirectParams = () => {
  if (typeof window === 'undefined') {
    return
  }

  const url = new URL(window.location.href)
  url.hash = ''
  window.history.replaceState(null, '', `${url.pathname}${url.search}`)
}

export const redirectHomeIfInCallFlow = () => {
  if (typeof window === 'undefined') {
    return false
  }

  const { pathname } = window.location
  if (pathname === '/call/new' || pathname.startsWith('/call/')) {
    window.location.replace('/')
    return true
  }

  return false
}

export const loadStoredSession = (): Session | null => {
  if (typeof window === 'undefined') {
    return currentSession
  }

  const value = window.localStorage.getItem(sessionStorageKey)
  if (!value) {
    return currentSession
  }

  try {
    const payload = normalizeSessionPayload(JSON.parse(value))
    if (!payload?.user) {
      return null
    }

    return {
      ...payload,
      user: payload.user
    }
  } catch {
    return null
  }
}
