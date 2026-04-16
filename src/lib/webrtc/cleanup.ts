import {
  candidateBuffers,
  dataChannels,
  disconnectTimers,
  getLocalStream,
  peerConnections,
  screenSharingPeers,
  setLocalStreamRef
} from '$lib/webrtc/shared'
import { clearDisconnectTimer } from '$lib/webrtc/ice-restart'

export function closePeerConnection(peerId: string) {
  const pc = peerConnections.get(peerId)
  if (pc) {
    pc.close()
    peerConnections.delete(peerId)
  }
  candidateBuffers.delete(peerId)
  dataChannels.delete(peerId)
  screenSharingPeers.delete(peerId)
  clearDisconnectTimer(peerId)
}

export function closeAll() {
  for (const [, pc] of peerConnections) {
    pc.close()
  }
  peerConnections.clear()
  candidateBuffers.clear()
  dataChannels.clear()
  screenSharingPeers.clear()

  for (const [, timer] of disconnectTimers) {
    clearTimeout(timer)
  }
  disconnectTimers.clear()

  const localStream = getLocalStream()
  if (localStream) {
    for (const track of localStream.getTracks()) {
      track.stop()
    }
    setLocalStreamRef(null)
  }
}
