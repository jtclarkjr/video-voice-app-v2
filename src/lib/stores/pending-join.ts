import { browser } from '$app/environment'
import { writable } from 'svelte/store'

export type PendingJoinPayload = {
  roomId: string
  displayName: string
  isMicOn: boolean
  isCameraOn: boolean
  createdAt: number
}

const STORAGE_KEY = 'pending-join'
const MAX_AGE_MS = 60_000

export const pendingJoin = writable<PendingJoinPayload | null>(null)

export function savePendingJoin(payload: PendingJoinPayload) {
  pendingJoin.set(payload)
  if (browser) {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }
}

export function consumePendingJoin(roomId: string) {
  if (!browser) {
    return null
  }

  const raw = window.sessionStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    const payload = JSON.parse(raw) as PendingJoinPayload
    const isExpired = Date.now() - payload.createdAt > MAX_AGE_MS
    if (isExpired || payload.roomId !== roomId) {
      clearPendingJoin()
      return null
    }

    clearPendingJoin()
    return payload
  } catch {
    clearPendingJoin()
    return null
  }
}

export function clearPendingJoin() {
  pendingJoin.set(null)
  if (browser) {
    window.sessionStorage.removeItem(STORAGE_KEY)
  }
}
