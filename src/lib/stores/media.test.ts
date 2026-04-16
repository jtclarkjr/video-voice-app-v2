import { beforeEach, describe, expect, it } from 'vite-plus/test'
import { get } from 'svelte/store'
import {
  enumerateDevices,
  media,
  resetMedia,
  setDevices,
  setSelectedAudioInput,
  setSelectedVideoInput,
  toggleCamera,
  toggleMic
} from '$lib/stores/media'

describe('media store', () => {
  beforeEach(() => {
    resetMedia()
  })

  it('toggles microphone and camera flags', () => {
    expect(get(media).isMicOn).toBe(true)
    expect(get(media).isCameraOn).toBe(true)

    toggleMic()
    toggleCamera()

    expect(get(media).isMicOn).toBe(false)
    expect(get(media).isCameraOn).toBe(false)
  })

  it('keeps selected devices when explicitly updated', () => {
    setDevices(
      [{ deviceId: 'mic-1', label: 'Mic 1' }],
      [{ deviceId: 'speaker-1', label: 'Speaker 1' }],
      [{ deviceId: 'camera-1', label: 'Camera 1' }]
    )

    setSelectedAudioInput('mic-1')
    setSelectedVideoInput('camera-1')

    expect(get(media).selectedAudioInput).toBe('mic-1')
    expect(get(media).selectedVideoInput).toBe('camera-1')
  })

  it('enumerates devices into categorized lists', async () => {
    const originalNavigator = globalThis.navigator
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        mediaDevices: {
          enumerateDevices: async () => [
            { kind: 'audioinput', deviceId: 'mic-a', label: 'Mic A' },
            { kind: 'audiooutput', deviceId: 'speaker-a', label: 'Speaker A' },
            { kind: 'videoinput', deviceId: 'camera-a', label: 'Camera A' }
          ]
        }
      },
      configurable: true
    })

    await enumerateDevices()

    expect(get(media).audioInputs).toHaveLength(1)
    expect(get(media).audioOutputs).toHaveLength(1)
    expect(get(media).videoInputs).toHaveLength(1)

    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true
    })
  })
})
