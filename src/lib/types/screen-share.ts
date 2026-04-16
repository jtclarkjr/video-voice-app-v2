export type ScreenShareState = {
  localActive: boolean
  localStream: MediaStream | null
  remoteShares: Record<string, MediaStream>
}

export function createScreenShareState(): ScreenShareState {
  return {
    localActive: false,
    localStream: null,
    remoteShares: {}
  }
}
