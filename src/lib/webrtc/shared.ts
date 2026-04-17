import { media } from '$lib/stores/media.svelte'

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
  const audio: MediaTrackConstraints = {
    echoCancellation: media.echoCancellation,
    noiseSuppression: media.noiseSuppression !== 'off',
    autoGainControl: media.autoGainControl
  }

  if (media.selectedAudioInput) {
    audio.deviceId = { exact: media.selectedAudioInput }
  }

  const video: MediaTrackConstraints = {}
  if (media.selectedVideoInput) {
    video.deviceId = { exact: media.selectedVideoInput }
  }

  return { audio, video }
}

export async function getUserMedia(): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia(
    buildUserMediaConstraints()
  )

  for (const track of stream.getAudioTracks()) {
    track.enabled = media.isMicOn
  }

  for (const track of stream.getVideoTracks()) {
    track.enabled = media.isCameraOn
  }

  localStream = stream
  return stream
}
