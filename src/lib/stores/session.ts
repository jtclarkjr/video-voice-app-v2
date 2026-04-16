import { browser } from '$app/environment'
import { derived, get, writable } from 'svelte/store'
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

const createInitialState = (): SessionState => ({
  session: getCurrentSession(),
  user: getCurrentSession()?.user ?? null,
  isPending: hasSupabaseConfig,
  error: getLastSessionError(),
  initialized: false
})

const sessionState = writable<SessionState>(createInitialState())

let unsubscribe: (() => void) | null = null
let initPromise: Promise<void> | null = null

const updateFromSession = (session: Session | null) => {
  sessionState.update((state) => ({
    ...state,
    session,
    user: session?.user ?? null,
    isPending: false,
    error: getLastSessionError()
  }))
}

export const session = derived(sessionState, ($state) => ({
  data: $state.session ? { session: $state.session, user: $state.user } : null,
  isAnonymous: isAnonymousUser($state.user),
  isPending: $state.isPending,
  error: $state.error
}))

export async function initSessionStore() {
  if (!browser) {
    sessionState.update((state) => ({
      ...state,
      isPending: false,
      initialized: true
    }))
    return
  }

  if (get(sessionState).initialized) {
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
        sessionState.update((state) => ({
          ...state,
          isPending: false,
          error:
            error instanceof Error
              ? error.message
              : 'Could not initialize authentication.'
        }))
      } finally {
        sessionState.update((state) => ({ ...state, initialized: true }))
      }
    })().finally(() => {
      initPromise = null
    })
  }

  await initPromise
}

export function destroySessionStore() {
  unsubscribe?.()
  unsubscribe = null
}
