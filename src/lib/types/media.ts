export type NoiseSuppression = 'off' | 'low' | 'high'

export type MediaDeviceOption = {
  deviceId: string
  label: string
}

export type MediaState = {
  localStream: MediaStream | null
  isMicOn: boolean
  isCameraOn: boolean
  isDeafened: boolean
  inputVolume: number
  outputVolume: number
  audioInputs: MediaDeviceOption[]
  audioOutputs: MediaDeviceOption[]
  videoInputs: MediaDeviceOption[]
  selectedAudioInput: string
  selectedAudioOutput: string
  selectedVideoInput: string
  echoCancellation: boolean
  noiseSuppression: NoiseSuppression
  autoGainControl: boolean
}

export function createMediaState(): MediaState {
  return {
    localStream: null,
    isMicOn: true,
    isCameraOn: true,
    isDeafened: false,
    inputVolume: 100,
    outputVolume: 100,
    audioInputs: [],
    audioOutputs: [],
    videoInputs: [],
    selectedAudioInput: '',
    selectedAudioOutput: '',
    selectedVideoInput: '',
    echoCancellation: true,
    noiseSuppression: 'high',
    autoGainControl: true
  }
}
