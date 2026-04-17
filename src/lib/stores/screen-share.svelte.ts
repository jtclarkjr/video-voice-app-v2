import {
  createScreenShareState,
  type ScreenShareState
} from '$lib/types/screen-share'

let state = $state<ScreenShareState>(createScreenShareState())

export const screenShare = {
  get localActive() {
    return state.localActive
  },
  get localStream() {
    return state.localStream
  },
  get remoteShares() {
    return state.remoteShares
  },
  setLocal(stream: MediaStream) {
    state.localActive = true
    state.localStream = stream
  },
  clearLocal() {
    const stream = state.localStream
    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop()
      }
    }

    state.localActive = false
    state.localStream = null
  },
  setRemote(peerId: string, stream: MediaStream) {
    state.remoteShares[peerId] = stream
  },
  removeRemote(peerId: string) {
    delete state.remoteShares[peerId]
  },
  reset() {
    screenShare.clearLocal()
    state = createScreenShareState()
  }
}
