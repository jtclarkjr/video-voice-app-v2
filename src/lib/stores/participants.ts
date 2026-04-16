import { get, writable } from 'svelte/store'
import { createParticipant, type Participant } from '$lib/types/participant'
import type { NetworkQuality, PeerConnectionState } from '$lib/types/connection'

export const participants = writable<Record<string, Participant>>({})

export function addParticipant(id: string, displayName: string) {
  participants.update((state) => ({
    ...state,
    [id]: createParticipant(id, displayName)
  }))
}

export function removeParticipant(id: string) {
  participants.update((state) => {
    const next = { ...state }
    delete next[id]
    return next
  })
}

const updateParticipant = (
  id: string,
  updater: (participant: Participant) => Participant
) => {
  participants.update((state) => {
    const participant = state[id]
    if (!participant) {
      return state
    }
    return { ...state, [id]: updater(participant) }
  })
}

export function setParticipantStream(id: string, stream: MediaStream) {
  updateParticipant(id, (participant) => ({ ...participant, stream }))
}

export function setParticipantMediaState(
  id: string,
  mediaState: {
    audioEnabled?: boolean
    videoEnabled?: boolean
  }
) {
  updateParticipant(id, (participant) => ({
    ...participant,
    ...(mediaState.audioEnabled === undefined
      ? {}
      : { audioEnabled: mediaState.audioEnabled }),
    ...(mediaState.videoEnabled === undefined
      ? {}
      : { videoEnabled: mediaState.videoEnabled })
  }))
}

export function setParticipantConnectionState(
  id: string,
  connectionState: PeerConnectionState
) {
  updateParticipant(id, (participant) => ({ ...participant, connectionState }))
}

export function setParticipantSpeaking(
  id: string,
  isSpeaking: boolean,
  audioLevel: number
) {
  updateParticipant(id, (participant) => ({
    ...participant,
    isSpeaking,
    audioLevel
  }))
}

export function setParticipantNetworkQuality(
  id: string,
  networkQuality: NetworkQuality
) {
  updateParticipant(id, (participant) => ({ ...participant, networkQuality }))
}

export function setParticipantScreenSharing(
  id: string,
  isScreenSharing: boolean
) {
  updateParticipant(id, (participant) => ({ ...participant, isScreenSharing }))
}

export function clearParticipants() {
  participants.set({})
}

export const getParticipantsSnapshot = () => get(participants)
