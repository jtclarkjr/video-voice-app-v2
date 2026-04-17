import {
  sendAnswer,
  sendIceCandidate,
  sendOffer
} from '$lib/signaling/connection'
import { participants } from '$lib/stores/participants.svelte'
import { screenShare } from '$lib/stores/screen-share.svelte'
import {
  candidateBuffers,
  disconnectTimers,
  getLocalStream,
  peerConnections,
  rtcConfig,
  screenSharingPeers
} from '$lib/webrtc/shared'
import { setupDataChannel } from '$lib/webrtc/data-channel'
import {
  attemptIceRestart,
  clearDisconnectTimer
} from '$lib/webrtc/ice-restart'

export function createPeerConnection(peerId: string): RTCPeerConnection {
  const existing = peerConnections.get(peerId)
  if (existing) {
    existing.close()
  }

  const pc = new RTCPeerConnection(rtcConfig)
  peerConnections.set(peerId, pc)
  candidateBuffers.set(peerId, [])

  const localStream = getLocalStream()
  if (localStream) {
    for (const track of localStream.getTracks()) {
      pc.addTrack(track, localStream)
    }
  }

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      sendIceCandidate(peerId, event.candidate.toJSON())
    }
  }

  let cameraStreamId: string | null = null

  pc.ontrack = (event) => {
    const [stream] = event.streams
    if (!stream) {
      return
    }

    if (
      screenSharingPeers.has(peerId) &&
      cameraStreamId &&
      stream.id !== cameraStreamId
    ) {
      screenShare.setRemote(peerId, stream)
    } else {
      if (!cameraStreamId) {
        cameraStreamId = stream.id
      }
      participants.setStream(peerId, stream)
    }
  }

  pc.onconnectionstatechange = () => {
    const state = pc.connectionState

    if (state === 'connected') {
      participants.setConnectionState(peerId, 'connected')
      clearDisconnectTimer(peerId)
    } else if (state === 'disconnected') {
      participants.setConnectionState(peerId, 'disconnected')
      clearDisconnectTimer(peerId)
      disconnectTimers.set(
        peerId,
        setTimeout(() => {
          const currentPc = peerConnections.get(peerId)
          if (currentPc && currentPc.connectionState === 'disconnected') {
            void attemptIceRestart(peerId)
          }
        }, 5000)
      )
    } else if (state === 'failed') {
      participants.setConnectionState(peerId, 'failed')
      void attemptIceRestart(peerId)
    } else if (state === 'connecting' || state === 'new') {
      participants.setConnectionState(peerId, 'connecting')
    }
  }

  setupDataChannel(peerId, pc)

  return pc
}

export async function createOffer(peerId: string) {
  const pc = createPeerConnection(peerId)
  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)
  sendOffer(peerId, pc.localDescription!)
}

export async function handleOffer(
  fromId: string,
  sdp: RTCSessionDescriptionInit
) {
  const pc = createPeerConnection(fromId)
  await pc.setRemoteDescription(sdp)
  await flushCandidates(fromId)
  const answer = await pc.createAnswer()
  await pc.setLocalDescription(answer)
  sendAnswer(fromId, pc.localDescription!)
}

export async function handleAnswer(
  fromId: string,
  sdp: RTCSessionDescriptionInit
) {
  const pc = peerConnections.get(fromId)
  if (!pc) {
    return
  }
  await pc.setRemoteDescription(sdp)
  await flushCandidates(fromId)
}

export async function handleIceCandidate(
  fromId: string,
  candidate: RTCIceCandidateInit
) {
  const pc = peerConnections.get(fromId)
  if (!pc || !pc.remoteDescription) {
    const buffer = candidateBuffers.get(fromId) ?? []
    buffer.push(candidate)
    candidateBuffers.set(fromId, buffer)
    return
  }
  await pc.addIceCandidate(candidate)
}

async function flushCandidates(peerId: string) {
  const pc = peerConnections.get(peerId)
  const buffer = candidateBuffers.get(peerId)
  if (!pc || !buffer) {
    return
  }

  for (const candidate of buffer) {
    await pc.addIceCandidate(candidate)
  }
  candidateBuffers.set(peerId, [])
}
