import { browser } from '$app/environment'
import {
  ensureAnonymousSession,
  isAnonymousUser
} from '$lib/auth/session-service'
import {
  getCurrentSession,
  getLastSessionError,
  hasSupabaseConfig,
  subscribeToSessionChanges
} from '$lib/auth/session-store'
import type { Session, User } from '$lib/auth/types'

type SessionState = {
  session: Session | null
  user: User | null
  isPending: boolean
  error: string | null
  initialized: boolean
}

function createInitialState(): SessionState {
  const currentSession = getCurrentSession()

  return {
    session: currentSession,
    user: currentSession?.user ?? null,
    isPending: hasSupabaseConfig,
    error: getLastSessionError(),
    initialized: false
  }
}

let state = $state<SessionState>(createInitialState())
let unsubscribe: (() => void) | null = null
let initPromise: Promise<void> | null = null

function updateFromSession(nextSession: Session | null) {
  state.session = nextSession
  state.user = nextSession?.user ?? null
  state.isPending = false
  state.error = getLastSessionError()
}

export const session = {
  get data() {
    if (!state.session) {
      return null
    }

    return {
      session: state.session,
      user: state.user
    }
  },
  get isAnonymous() {
    return isAnonymousUser(state.user)
  },
  get isPending() {
    return state.isPending
  },
  get error() {
    return state.error
  },
  async init() {
    if (!browser) {
      state.isPending = false
      state.initialized = true
      return
    }

    if (state.initialized) {
      return
    }

    if (!unsubscribe) {
      unsubscribe = subscribeToSessionChanges(updateFromSession)
    }

    if (!initPromise) {
      initPromise = (async () => {
        try {
          const ensured = await ensureAnonymousSession()
          updateFromSession(ensured)
        } catch (error) {
          state.isPending = false
          state.error =
            error instanceof Error
              ? error.message
              : 'Could not initialize authentication.'
        } finally {
          state.initialized = true
        }
      })().finally(() => {
        initPromise = null
      })
    }

    await initPromise
  },
  destroy() {
    unsubscribe?.()
    unsubscribe = null
  }
}
