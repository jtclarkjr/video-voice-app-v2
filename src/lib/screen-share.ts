import {
  sendScreenShareStart,
  sendScreenShareStop
} from '$lib/signaling/connection'
import {
  clearLocalScreenShare,
  setLocalScreenShare
} from '$lib/stores/screen-share'
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
    setLocalScreenShare(stream)
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
  clearLocalScreenShare()
}

export function isScreenSharing() {
  return activeStream !== null
}
