import {
  createMediaState,
  type MediaDeviceOption,
  type MediaState,
  type NoiseSuppression
} from '$lib/types/media'

let state = $state<MediaState>(createMediaState())

function resolveSelectedDevice(
  selectedDeviceId: string,
  devices: MediaDeviceOption[]
) {
  if (selectedDeviceId && devices.some((device) => device.deviceId === selectedDeviceId)) {
    return selectedDeviceId
  }

  return devices[0]?.deviceId || ''
}

export const media = {
  get localStream() {
    return state.localStream
  },
  get isMicOn() {
    return state.isMicOn
  },
  get isCameraOn() {
    return state.isCameraOn
  },
  get isDeafened() {
    return state.isDeafened
  },
  get inputVolume() {
    return state.inputVolume
  },
  get outputVolume() {
    return state.outputVolume
  },
  get audioInputs() {
    return state.audioInputs
  },
  get audioOutputs() {
    return state.audioOutputs
  },
  get videoInputs() {
    return state.videoInputs
  },
  get selectedAudioInput() {
    return state.selectedAudioInput
  },
  get selectedAudioOutput() {
    return state.selectedAudioOutput
  },
  get selectedVideoInput() {
    return state.selectedVideoInput
  },
  get echoCancellation() {
    return state.echoCancellation
  },
  get noiseSuppression() {
    return state.noiseSuppression
  },
  get autoGainControl() {
    return state.autoGainControl
  },
  setLocalStream(stream: MediaStream) {
    state.localStream = stream
  },
  clearLocalStream() {
    const stream = state.localStream
    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop()
      }
    }

    state.localStream = null
  },
  toggleMic() {
    if (state.localStream) {
      for (const track of state.localStream.getAudioTracks()) {
        track.enabled = !state.isMicOn
      }
    }

    state.isMicOn = !state.isMicOn
  },
  setMicEnabled(enabled: boolean) {
    if (state.localStream) {
      for (const track of state.localStream.getAudioTracks()) {
        track.enabled = enabled
      }
    }

    state.isMicOn = enabled
  },
  toggleCamera() {
    if (state.localStream) {
      for (const track of state.localStream.getVideoTracks()) {
        track.enabled = !state.isCameraOn
      }
    }

    state.isCameraOn = !state.isCameraOn
  },
  setCameraEnabled(enabled: boolean) {
    if (state.localStream) {
      for (const track of state.localStream.getVideoTracks()) {
        track.enabled = enabled
      }
    }

    state.isCameraOn = enabled
  },
  toggleDeafen() {
    state.isDeafened = !state.isDeafened
  },
  setInputVolume(volume: number) {
    state.inputVolume = volume
  },
  setOutputVolume(volume: number) {
    state.outputVolume = volume
  },
  setDevices(
    audioInputs: MediaDeviceOption[],
    audioOutputs: MediaDeviceOption[],
    videoInputs: MediaDeviceOption[]
  ) {
    state.audioInputs = audioInputs
    state.audioOutputs = audioOutputs
    state.videoInputs = videoInputs
    state.selectedAudioInput = resolveSelectedDevice(state.selectedAudioInput, audioInputs)
    state.selectedAudioOutput = resolveSelectedDevice(state.selectedAudioOutput, audioOutputs)
    state.selectedVideoInput = resolveSelectedDevice(state.selectedVideoInput, videoInputs)
  },
  setSelectedAudioInput(deviceId: string) {
    state.selectedAudioInput = deviceId
  },
  setSelectedAudioOutput(deviceId: string) {
    state.selectedAudioOutput = deviceId
  },
  setSelectedVideoInput(deviceId: string) {
    state.selectedVideoInput = deviceId
  },
  setEchoCancellation(enabled: boolean) {
    state.echoCancellation = enabled
  },
  setNoiseSuppression(value: NoiseSuppression) {
    state.noiseSuppression = value
  },
  setAutoGainControl(enabled: boolean) {
    state.autoGainControl = enabled
  },
  async enumerateDevices() {
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

    media.setDevices(audioInputs, audioOutputs, videoInputs)
  },
  reset() {
    media.clearLocalStream()
    state = createMediaState()
  }
}
