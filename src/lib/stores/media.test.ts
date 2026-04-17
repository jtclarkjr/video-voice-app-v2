import { beforeEach, describe, expect, it } from 'vite-plus/test'
import { media } from '$lib/stores/media.svelte'

describe('media store', () => {
  beforeEach(() => {
    media.reset()
  })

  it('toggles microphone and camera flags', () => {
    expect(media.isMicOn).toBe(true)
    expect(media.isCameraOn).toBe(true)

    media.toggleMic()
    media.toggleCamera()

    expect(media.isMicOn).toBe(false)
    expect(media.isCameraOn).toBe(false)
  })

  it('keeps selected devices when explicitly updated', () => {
    media.setDevices(
      [{ deviceId: 'mic-1', label: 'Mic 1' }],
      [{ deviceId: 'speaker-1', label: 'Speaker 1' }],
      [{ deviceId: 'camera-1', label: 'Camera 1' }]
    )

    media.setSelectedAudioInput('mic-1')
    media.setSelectedVideoInput('camera-1')

    expect(media.selectedAudioInput).toBe('mic-1')
    expect(media.selectedVideoInput).toBe('camera-1')
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

    await media.enumerateDevices()

    expect(media.audioInputs).toHaveLength(1)
    expect(media.audioOutputs).toHaveLength(1)
    expect(media.videoInputs).toHaveLength(1)

    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true
    })
  })
})
