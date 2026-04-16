import { sendOffer } from '$lib/signaling/connection'
import { removeRemoteScreenShare } from '$lib/stores/screen-share'
import { peerConnections, screenSharingPeers } from '$lib/webrtc/shared'

export function markPeerScreenSharing(peerId: string, sharing: boolean) {
  if (sharing) {
    screenSharingPeers.add(peerId)
  } else {
    screenSharingPeers.delete(peerId)
    removeRemoteScreenShare(peerId)
  }
}

export async function addScreenShareTracks(screenStream: MediaStream) {
  for (const [peerId, pc] of peerConnections) {
    for (const track of screenStream.getTracks()) {
      pc.addTrack(track, screenStream)
    }
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    sendOffer(peerId, pc.localDescription!)
  }
}

export async function removeScreenShareTracks(screenStream: MediaStream) {
  for (const [peerId, pc] of peerConnections) {
    const senders = pc.getSenders()
    for (const sender of senders) {
      if (sender.track && screenStream.getTracks().includes(sender.track)) {
        pc.removeTrack(sender)
      }
    }
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    sendOffer(peerId, pc.localDescription!)
  }
}
