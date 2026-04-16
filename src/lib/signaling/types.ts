export type SignalMessage = {
  type: string
  roomId?: string
  displayName?: string
  authToken?: string
  audioEnabled?: boolean
  videoEnabled?: boolean
  targetId?: string
  fromId?: string
  sdp?: RTCSessionDescriptionInit
  candidate?: RTCIceCandidateInit
  peers?: Array<{
    id: string
    displayName: string
    audioEnabled?: boolean
    videoEnabled?: boolean
  }>
  userId?: string
  peerId?: string
  message?: string
  streamId?: string
}

export type SignalHandlers = {
  onJoined: (
    userId: string,
    roomId: string,
    peers: Array<{
      id: string
      displayName: string
      audioEnabled?: boolean
      videoEnabled?: boolean
    }>
  ) => void
  onPeerJoined: (
    peerId: string,
    displayName: string,
    audioEnabled?: boolean,
    videoEnabled?: boolean
  ) => void
  onPeerMediaState: (
    peerId: string,
    audioEnabled?: boolean,
    videoEnabled?: boolean
  ) => void
  onPeerLeft: (peerId: string) => void
  onOffer: (fromId: string, sdp: RTCSessionDescriptionInit) => void
  onAnswer: (fromId: string, sdp: RTCSessionDescriptionInit) => void
  onIceCandidate: (fromId: string, candidate: RTCIceCandidateInit) => void
  onError: (message: string) => void
  onScreenShareStart?: (peerId: string, streamId: string) => void
  onScreenShareStop?: (peerId: string) => void
  onReconnected?: () => void
}
