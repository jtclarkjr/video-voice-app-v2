import { sendOffer } from '$lib/signaling/connection'
import { bestEffort } from '$lib/utils'
import { disconnectTimers, peerConnections } from '$lib/webrtc/shared'

export async function attemptIceRestart(peerId: string) {
  const pc = peerConnections.get(peerId)
  if (!pc) {
    return
  }

  const localDescription = await bestEffort(
    (async () => {
      pc.restartIce()
      const offer = await pc.createOffer({ iceRestart: true })
      await pc.setLocalDescription(offer)
      return pc.localDescription
    })()
  )
  if (!localDescription) {
    return
  }

  sendOffer(peerId, localDescription)
}

export function clearDisconnectTimer(peerId: string) {
  const timer = disconnectTimers.get(peerId)
  if (timer) {
    clearTimeout(timer)
    disconnectTimers.delete(peerId)
  }
}
