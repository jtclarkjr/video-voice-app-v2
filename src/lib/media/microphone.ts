export const noMicrophoneConnectedMessage =
  'No microphone connected. Connect a microphone to start live translation.'

export type MicrophoneAvailability = 'available' | 'unavailable' | 'unknown'

type MediaDeviceEnumerator = Pick<MediaDevices, 'enumerateDevices'>

const noMicrophoneErrorNames = new Set([
  'ConstraintNotSatisfiedError',
  'DevicesNotFoundError',
  'NotFoundError',
  'OverconstrainedError'
])

export async function getMicrophoneAvailability(
  mediaDevices: MediaDeviceEnumerator | null | undefined =
    globalThis.navigator?.mediaDevices
): Promise<MicrophoneAvailability> {
  if (!mediaDevices) {
    return 'unknown'
  }

  try {
    const devices = await mediaDevices.enumerateDevices()
    return devices.some((device) => device.kind === 'audioinput')
      ? 'available'
      : 'unavailable'
  } catch {
    return 'unknown'
  }
}

export function getNoMicrophoneMessage(error: unknown) {
  if (!isNoMicrophoneError(error)) {
    return null
  }

  return noMicrophoneConnectedMessage
}

function isNoMicrophoneError(error: unknown) {
  if (!isErrorLike(error)) {
    return false
  }

  const name = typeof error.name === 'string' ? error.name : ''
  const message = typeof error.message === 'string' ? error.message : ''

  return (
    noMicrophoneErrorNames.has(name) ||
    /invalid constraint/i.test(message) ||
    /requested device not found/i.test(message)
  )
}

function isErrorLike(error: unknown): error is {
  message?: unknown
  name?: unknown
} {
  return typeof error === 'object' && error !== null
}
