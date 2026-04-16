import type { NetworkQuality, PeerConnectionState } from './connection.ts'

export type Participant = {
  id: string
  displayName: string
  stream: MediaStream | null
  audioEnabled: boolean
  videoEnabled: boolean
  connectionState: PeerConnectionState
  isSpeaking: boolean
  audioLevel: number
  isScreenSharing: boolean
  networkQuality: NetworkQuality
}

export function createParticipant(
  id: string,
  displayName: string
): Participant {
  return {
    id,
    displayName,
    stream: null,
    audioEnabled: true,
    videoEnabled: true,
    connectionState: 'connecting',
    isSpeaking: false,
    audioLevel: 0,
    isScreenSharing: false,
    networkQuality: 'unknown'
  }
}
