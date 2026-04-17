import {
  sendScreenShareStart,
  sendScreenShareStop
} from '$lib/signaling/connection'
import { screenShare } from '$lib/stores/screen-share.svelte'
import {
  addScreenShareTracks,
  removeScreenShareTracks
} from '$lib/webrtc/screen-share-tracks'

let activeStream: MediaStream | null = null

export async function startScreenShare() {
  if (activeStream) {
    return
  }

  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true
    })

    activeStream = stream
    screenShare.setLocal(stream)
    sendScreenShareStart(stream.id)

    await addScreenShareTracks(stream)

    const videoTrack = stream.getVideoTracks()[0]
    if (videoTrack) {
      videoTrack.onended = () => {
        void stopScreenShare()
      }
    }
  } catch {
    // User cancelled or getDisplayMedia not supported.
  }
}

export async function stopScreenShare() {
  if (!activeStream) {
    return
  }

  const stream = activeStream
  activeStream = null

  sendScreenShareStop()
  await removeScreenShareTracks(stream)
  screenShare.clearLocal()
}

export function isScreenSharing() {
  return activeStream !== null
}
