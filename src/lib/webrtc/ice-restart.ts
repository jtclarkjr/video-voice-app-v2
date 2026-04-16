import { sendOffer } from '$lib/signaling/connection'
import { disconnectTimers, peerConnections } from '$lib/webrtc/shared'

export async function attemptIceRestart(peerId: string) {
  const pc = peerConnections.get(peerId)
  if (!pc) {
    return
  }

  try {
    pc.restartIce()
    const offer = await pc.createOffer({ iceRestart: true })
    await pc.setLocalDescription(offer)
    sendOffer(peerId, pc.localDescription!)
  } catch {
    // ICE restart failed — peer may have left
  }
}

export function clearDisconnectTimer(peerId: string) {
  const timer = disconnectTimers.get(peerId)
  if (timer) {
    clearTimeout(timer)
    disconnectTimers.delete(peerId)
  }
}
