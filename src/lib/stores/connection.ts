import { get, writable } from 'svelte/store'
import {
  createConnectionState,
  type ConnectionPhase,
  type ConnectionState
} from '$lib/types/connection'

export const connection = writable<ConnectionState>(createConnectionState())

export function setConnectionPhase(phase: ConnectionPhase) {
  connection.update((state) => ({ ...state, phase }))
}

export function setConnected(userId: string, roomId: string) {
  connection.set({
    phase: 'connected',
    userId,
    roomId,
    reconnectAttempts: 0
  })
}

export function setDisconnected() {
  connection.set(createConnectionState())
}

export function incrementReconnectAttempts() {
  connection.update((state) => ({
    ...state,
    reconnectAttempts: state.reconnectAttempts + 1
  }))
}

export function resetReconnectAttempts() {
  connection.update((state) => ({ ...state, reconnectAttempts: 0 }))
}

export const getConnectionSnapshot = () => get(connection)
