import {
  sendScreenShareStart,
  sendScreenShareStop
} from '$lib/signaling/connection'
import { screenShare } from '$lib/stores/screen-share.svelte'
import { bestEffort } from '$lib/utils'
import {
  addScreenShareTracks,
  removeScreenShareTracks
} from '$lib/webrtc/screen-share-tracks'

let activeStream: MediaStream | null = null

export async function startScreenShare() {
  if (activeStream) {
    return
  }

  const stream = await bestEffort(
    navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true
    })
  )
  if (!stream) {
    return
  }

  if ((await bestEffort(addScreenShareTracks(stream))) === null) {
    for (const track of stream.getTracks()) {
      track.stop()
    }
    return
  }

  activeStream = stream
  screenShare.setLocal(stream)
  sendScreenShareStart(stream.id)

  const videoTrack = stream.getVideoTracks()[0]
  if (videoTrack) {
    videoTrack.onended = () => {
      void stopScreenShare()
    }
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
