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

function getTrackByKind(stream: MediaStream | null, kind: 'audio' | 'video') {
  if (!stream) {
    return null
  }

  return kind === 'audio'
    ? (stream.getAudioTracks()[0] ?? null)
    : (stream.getVideoTracks()[0] ?? null)
}

export function streamHasLiveTrack(
  stream: MediaStream | null,
  kind: 'audio' | 'video'
) {
  if (!stream) {
    return false
  }

  const tracks =
    kind === 'audio' ? stream.getAudioTracks() : stream.getVideoTracks()

  return tracks.some((track) => track.readyState === 'live')
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

export async function acquireUserMedia(): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia(buildUserMediaConstraints())

  for (const track of stream.getAudioTracks()) {
    track.enabled = media.isMicOn
  }

  for (const track of stream.getVideoTracks()) {
    track.enabled = media.isCameraOn
  }

  return stream
}

export async function getUserMedia(): Promise<MediaStream> {
  const stream = await acquireUserMedia()
  localStream = stream
  return stream
}

export async function replaceLocalTracks(stream: MediaStream) {
  const previousStream = localStream

  for (const [, pc] of peerConnections) {
    for (const kind of ['audio', 'video'] as const) {
      const nextTrack = getTrackByKind(stream, kind)
      const sender = pc.getSenders().find((candidate) => candidate.track?.kind === kind)

      if (sender) {
        await sender.replaceTrack(nextTrack)
      } else if (nextTrack) {
        pc.addTrack(nextTrack, stream)
      }
    }
  }

  localStream = stream

  if (previousStream) {
    for (const track of previousStream.getTracks()) {
      track.stop()
    }
  }
}
