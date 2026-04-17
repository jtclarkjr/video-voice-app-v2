import { connection } from '$lib/stores/connection.svelte'
import type { SignalHandlers } from '$lib/signaling/types'

const MAX_RECONNECT_ATTEMPTS = 10
const BASE_RECONNECT_DELAY = 1000
const MAX_RECONNECT_DELAY = 30000

let reconnectTimer: ReturnType<typeof setTimeout> | null = null

export function scheduleReconnect(
  createConnection: (
    roomId: string,
    displayName: string,
    handlers: SignalHandlers
  ) => void,
  roomId: string,
  displayName: string,
  handlers: SignalHandlers
) {
  const attempts = connection.reconnectAttempts
  if (attempts >= MAX_RECONNECT_ATTEMPTS) {
    connection.setPhase('failed')
    return
  }

  connection.setPhase('reconnecting')
  connection.incrementReconnectAttempts()

  const delay = Math.min(
    BASE_RECONNECT_DELAY * Math.pow(2, attempts),
    MAX_RECONNECT_DELAY
  )

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    createConnection(roomId, displayName, {
      ...handlers,
      onJoined(...args) {
        handlers.onJoined(...args)
        handlers.onReconnected?.()
      }
    })
  }, delay)
}

export function cancelReconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
}
