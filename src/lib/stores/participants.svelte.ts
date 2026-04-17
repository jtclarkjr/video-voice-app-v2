import { createParticipant, type Participant } from '$lib/types/participant'
import type { NetworkQuality, PeerConnectionState } from '$lib/types/connection'

let byId = $state<Record<string, Participant>>({})

function getParticipant(id: string) {
  return byId[id]
}

export const participants = {
  get byId() {
    return byId
  },
  get list() {
    return Object.values(byId)
  },
  add(id: string, displayName: string) {
    byId[id] = createParticipant(id, displayName)
  },
  remove(id: string) {
    delete byId[id]
  },
  setStream(id: string, stream: MediaStream) {
    const participant = getParticipant(id)
    if (!participant) {
      return
    }

    participant.stream = stream
  },
  setMediaState(
    id: string,
    mediaState: {
      audioEnabled?: boolean
      videoEnabled?: boolean
    }
  ) {
    const participant = getParticipant(id)
    if (!participant) {
      return
    }

    if (mediaState.audioEnabled !== undefined) {
      participant.audioEnabled = mediaState.audioEnabled
    }

    if (mediaState.videoEnabled !== undefined) {
      participant.videoEnabled = mediaState.videoEnabled
    }
  },
  setConnectionState(id: string, connectionState: PeerConnectionState) {
    const participant = getParticipant(id)
    if (!participant) {
      return
    }

    participant.connectionState = connectionState
  },
  setSpeaking(id: string, isSpeaking: boolean, audioLevel: number) {
    const participant = getParticipant(id)
    if (!participant) {
      return
    }

    participant.isSpeaking = isSpeaking
    participant.audioLevel = audioLevel
  },
  setNetworkQuality(id: string, networkQuality: NetworkQuality) {
    const participant = getParticipant(id)
    if (!participant) {
      return
    }

    participant.networkQuality = networkQuality
  },
  setScreenSharing(id: string, isScreenSharing: boolean) {
    const participant = getParticipant(id)
    if (!participant) {
      return
    }

    participant.isScreenSharing = isScreenSharing
  },
  clear() {
    byId = {}
  }
}
