import { get } from 'svelte/store'
import { media } from '$lib/stores/media'

export const rtcConfig: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
}

export const peerConnections = new Map<string, RTCPeerConnection>()
export const candidateBuffers = new Map<string, RTCIceCandidateInit[]>()
export const dataChannels = new Map<string, RTCDataChannel>()
export const disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>()
export const screenSharingPeers = new Set<string>()

let localStream: MediaStream | null = null

export function getLocalStream(): MediaStream | null {
  return localStream
}

export function setLocalStreamRef(stream: MediaStream | null) {
  localStream = stream
}

function buildUserMediaConstraints(): MediaStreamConstraints {
  const currentMedia = get(media)

  const audio: MediaTrackConstraints = {
    echoCancellation: currentMedia.echoCancellation,
    noiseSuppression: currentMedia.noiseSuppression !== 'off',
    autoGainControl: currentMedia.autoGainControl
  }

  if (currentMedia.selectedAudioInput) {
    audio.deviceId = { exact: currentMedia.selectedAudioInput }
  }

  const video: MediaTrackConstraints = {}
  if (currentMedia.selectedVideoInput) {
    video.deviceId = { exact: currentMedia.selectedVideoInput }
  }

  return { audio, video }
}

export async function getUserMedia(): Promise<MediaStream> {
  const currentMedia = get(media)
  const stream = await navigator.mediaDevices.getUserMedia(
    buildUserMediaConstraints()
  )

  for (const track of stream.getAudioTracks()) {
    track.enabled = currentMedia.isMicOn
  }

  for (const track of stream.getVideoTracks()) {
    track.enabled = currentMedia.isCameraOn
  }

  localStream = stream
  return stream
}
