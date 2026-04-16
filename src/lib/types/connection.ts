export type ConnectionPhase =
  | 'idle'
  | 'prejoin'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'failed'

export type PeerConnectionState =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'failed'

export type NetworkQuality = 'good' | 'fair' | 'poor' | 'unknown'

export type ConnectionState = {
  phase: ConnectionPhase
  userId: string | null
  roomId: string | null
  reconnectAttempts: number
}

export function createConnectionState(): ConnectionState {
  return {
    phase: 'idle',
    userId: null,
    roomId: null,
    reconnectAttempts: 0
  }
}
