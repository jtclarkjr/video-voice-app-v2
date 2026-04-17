import {
  createConnectionState,
  type ConnectionPhase,
  type ConnectionState
} from '$lib/types/connection'

let state = $state<ConnectionState>(createConnectionState())

export const connection = {
  get phase() {
    return state.phase
  },
  get userId() {
    return state.userId
  },
  get roomId() {
    return state.roomId
  },
  get reconnectAttempts() {
    return state.reconnectAttempts
  },
  setPhase(phase: ConnectionPhase) {
    state.phase = phase
  },
  setConnected(userId: string, roomId: string) {
    state.phase = 'connected'
    state.userId = userId
    state.roomId = roomId
    state.reconnectAttempts = 0
  },
  setDisconnected() {
    state = createConnectionState()
  },
  incrementReconnectAttempts() {
    state.reconnectAttempts += 1
  },
  resetReconnectAttempts() {
    state.reconnectAttempts = 0
  }
}
