import { browser } from '$app/environment'

export type PendingJoinPayload = {
  roomId: string
  displayName: string
  isMicOn: boolean
  isCameraOn: boolean
  createdAt: number
}

const STORAGE_KEY = 'pending-join'
const MAX_AGE_MS = 60_000

let current = $state<PendingJoinPayload | null>(null)

export const pendingJoin = {
  get current() {
    return current
  },
  save(payload: PendingJoinPayload) {
    current = payload
    if (browser) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    }
  },
  consume(roomId: string) {
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
        pendingJoin.clear()
        return null
      }

      current = payload
      pendingJoin.clear()
      return payload
    } catch {
      pendingJoin.clear()
      return null
    }
  },
  clear() {
    current = null
    if (browser) {
      window.sessionStorage.removeItem(STORAGE_KEY)
    }
  }
}
