import { get, writable } from 'svelte/store'
import {
  createScreenShareState,
  type ScreenShareState
} from '$lib/types/screen-share'

export const screenShare = writable<ScreenShareState>(createScreenShareState())

export function setLocalScreenShare(stream: MediaStream) {
  screenShare.update((state) => ({
    ...state,
    localActive: true,
    localStream: stream
  }))
}

export function clearLocalScreenShare() {
  const stream = get(screenShare).localStream
  if (stream) {
    for (const track of stream.getTracks()) {
      track.stop()
    }
  }
  screenShare.update((state) => ({
    ...state,
    localActive: false,
    localStream: null
  }))
}

export function setRemoteScreenShare(peerId: string, stream: MediaStream) {
  screenShare.update((state) => ({
    ...state,
    remoteShares: { ...state.remoteShares, [peerId]: stream }
  }))
}

export function removeRemoteScreenShare(peerId: string) {
  screenShare.update((state) => {
    const remoteShares = { ...state.remoteShares }
    delete remoteShares[peerId]
    return { ...state, remoteShares }
  })
}

export function resetScreenShare() {
  clearLocalScreenShare()
  screenShare.set(createScreenShareState())
}
