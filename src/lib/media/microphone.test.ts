import { describe, expect, it } from 'vite-plus/test'
import {
  getMicrophoneAvailability,
  getNoMicrophoneMessage,
  noMicrophoneConnectedMessage
} from '$lib/media/microphone'

describe('microphone availability', () => {
  it('detects an available audio input', async () => {
    await expect(
      getMicrophoneAvailability(
        createMediaDevices([createDevice('audioinput')])
      )
    ).resolves.toBe('available')
  })

  it('detects when no audio input is connected', async () => {
    await expect(
      getMicrophoneAvailability(
        createMediaDevices([createDevice('videoinput')])
      )
    ).resolves.toBe('unavailable')
  })

  it('does not hard-block when media devices cannot be checked', async () => {
    await expect(getMicrophoneAvailability(undefined)).resolves.toBe('unknown')
    await expect(
      getMicrophoneAvailability({
        enumerateDevices: async () => {
          throw new Error('Could not enumerate devices.')
        }
      })
    ).resolves.toBe('unknown')
  })

  it('maps no-microphone startup failures to a user-facing warning', () => {
    expect(getNoMicrophoneMessage({ name: 'NotFoundError' })).toBe(
      noMicrophoneConnectedMessage
    )
    expect(getNoMicrophoneMessage({ name: 'OverconstrainedError' })).toBe(
      noMicrophoneConnectedMessage
    )
    expect(getNoMicrophoneMessage(new Error('Invalid constraint'))).toBe(
      noMicrophoneConnectedMessage
    )
  })

  it('does not treat permission denial as a disconnected microphone', () => {
    expect(getNoMicrophoneMessage({ name: 'NotAllowedError' })).toBeNull()
  })
})

function createMediaDevices(
  devices: MediaDeviceInfo[]
): Pick<MediaDevices, 'enumerateDevices'> {
  return {
    enumerateDevices: async () => devices
  }
}

function createDevice(kind: MediaDeviceKind) {
  return {
    deviceId: `${kind}-1`,
    kind,
    label: kind
  } as MediaDeviceInfo
}
