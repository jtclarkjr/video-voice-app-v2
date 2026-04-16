import { get, writable } from 'svelte/store'
import {
  createMediaState,
  type MediaDeviceOption,
  type MediaState,
  type NoiseSuppression
} from '$lib/types/media'

export const media = writable<MediaState>(createMediaState())

const updateMedia = <K extends keyof MediaState>(
  key: K,
  value: MediaState[K]
) => {
  media.update((state) => ({ ...state, [key]: value }))
}

export function setLocalStream(stream: MediaStream) {
  updateMedia('localStream', stream)
}

export function clearLocalStream() {
  const stream = get(media).localStream
  if (stream) {
    for (const track of stream.getTracks()) {
      track.stop()
    }
  }
  updateMedia('localStream', null)
}

export function toggleMic() {
  const current = get(media)
  if (current.localStream) {
    for (const track of current.localStream.getAudioTracks()) {
      track.enabled = !current.isMicOn
    }
  }
  updateMedia('isMicOn', !current.isMicOn)
}

export function setMicEnabled(enabled: boolean) {
  const stream = get(media).localStream
  if (stream) {
    for (const track of stream.getAudioTracks()) {
      track.enabled = enabled
    }
  }
  updateMedia('isMicOn', enabled)
}

export function toggleCamera() {
  const current = get(media)
  if (current.localStream) {
    for (const track of current.localStream.getVideoTracks()) {
      track.enabled = !current.isCameraOn
    }
  }
  updateMedia('isCameraOn', !current.isCameraOn)
}

export function setCameraEnabled(enabled: boolean) {
  const stream = get(media).localStream
  if (stream) {
    for (const track of stream.getVideoTracks()) {
      track.enabled = enabled
    }
  }
  updateMedia('isCameraOn', enabled)
}

export function toggleDeafen() {
  updateMedia('isDeafened', !get(media).isDeafened)
}

export function setInputVolume(volume: number) {
  updateMedia('inputVolume', volume)
}

export function setOutputVolume(volume: number) {
  updateMedia('outputVolume', volume)
}

export function setDevices(
  audioInputs: MediaDeviceOption[],
  audioOutputs: MediaDeviceOption[],
  videoInputs: MediaDeviceOption[]
) {
  media.update((state) => ({
    ...state,
    audioInputs,
    audioOutputs,
    videoInputs,
    selectedAudioInput:
      state.selectedAudioInput || audioInputs[0]?.deviceId || '',
    selectedAudioOutput:
      state.selectedAudioOutput || audioOutputs[0]?.deviceId || '',
    selectedVideoInput:
      state.selectedVideoInput || videoInputs[0]?.deviceId || ''
  }))
}

export function setSelectedAudioInput(deviceId: string) {
  updateMedia('selectedAudioInput', deviceId)
}

export function setSelectedAudioOutput(deviceId: string) {
  updateMedia('selectedAudioOutput', deviceId)
}

export function setSelectedVideoInput(deviceId: string) {
  updateMedia('selectedVideoInput', deviceId)
}

export function setEchoCancellation(enabled: boolean) {
  updateMedia('echoCancellation', enabled)
}

export function setNoiseSuppression(value: NoiseSuppression) {
  updateMedia('noiseSuppression', value)
}

export function setAutoGainControl(enabled: boolean) {
  updateMedia('autoGainControl', enabled)
}

export async function enumerateDevices() {
  const devices = await navigator.mediaDevices.enumerateDevices()
  const audioInputs: MediaDeviceOption[] = []
  const audioOutputs: MediaDeviceOption[] = []
  const videoInputs: MediaDeviceOption[] = []

  for (const device of devices) {
    const option = {
      deviceId: device.deviceId,
      label: device.label || device.deviceId
    }
    if (device.kind === 'audioinput') {
      audioInputs.push(option)
    } else if (device.kind === 'audiooutput') {
      audioOutputs.push(option)
    } else if (device.kind === 'videoinput') {
      videoInputs.push(option)
    }
  }

  setDevices(audioInputs, audioOutputs, videoInputs)
}

export function resetMedia() {
  clearLocalStream()
  media.set(createMediaState())
}
