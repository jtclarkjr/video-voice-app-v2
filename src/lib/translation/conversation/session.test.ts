import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { getAccessToken } from '$lib/auth/session-service'
import { translationConversationSessionsPath } from '$lib/translation/conversation/constants'
import { startTranslationConversationSession } from '$lib/translation/conversation/session'

vi.mock('$lib/auth/session-service', () => ({
  getAccessToken: vi.fn()
}))

describe('translation conversation session', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.mocked(getAccessToken).mockReset()
  })

  it('streams conversation events over data channel and cleans up without translated audio playback', async () => {
    const localTrackStop = vi.fn()
    const remoteTrackStop = vi.fn()
    const receiverTrackStop = vi.fn()
    const dataChannelClose = vi.fn()
    const localTrack = createMockTrack(localTrackStop)
    const remoteTrack = createMockTrack(remoteTrackStop)
    const receiverTrack = createMockTrack(receiverTrackStop)
    const localStream = createMockStream([localTrack])
    const dataChannel = createMockDataChannel(dataChannelClose)
    const peerConnections: MockPeerConnection[] = []
    const getUserMedia = vi.fn(async () => localStream)

    vi.mocked(getAccessToken).mockResolvedValue('access-token')
    vi.stubGlobal('window', {
      location: {
        hostname: 'localhost',
        protocol: 'http:'
      }
    })
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia
      }
    })
    vi.stubGlobal(
      'RTCPeerConnection',
      createMockPeerConnectionConstructor(peerConnections, [dataChannel], [
        [receiverTrack]
      ])
    )
    vi.stubGlobal('fetch', createConversationFetchMock())

    const onTurnEvent = vi.fn()
    const onStatus = vi.fn()
    const session = await startTranslationConversationSession({
      languages: ['en', 'ja'],
      onStatus,
      onTurnEvent
    })

    dataChannel.onmessage?.({
      data: JSON.stringify({
        delta: 'Hello',
        type: 'session.input_transcript.delta'
      })
    } as MessageEvent)
    peerConnections[0].ontrack?.({
      streams: [],
      track: remoteTrack
    } as unknown as RTCTrackEvent)

    expect(getUserMedia).toHaveBeenCalledTimes(1)
    expect(peerConnections).toHaveLength(1)
    expect(peerConnections[0].addTrack).toHaveBeenCalledWith(
      localTrack,
      localStream
    )
    expect(onTurnEvent).toHaveBeenCalledWith({
      delta: 'Hello',
      language: 'en',
      turnId: 'openai-turn-1',
      type: 'conversation.transcript.delta'
    })
    expect(remoteTrackStop).toHaveBeenCalled()
    expect(onStatus).toHaveBeenCalledWith('requesting-microphone')
    expect(onStatus).toHaveBeenCalledWith('connecting')
    expect(onStatus).toHaveBeenLastCalledWith('listening')

    session.stop()

    expect(dataChannelClose).toHaveBeenCalled()
    expect(peerConnections[0].close).toHaveBeenCalled()
    expect(localTrackStop).toHaveBeenCalled()
    expect(receiverTrackStop).toHaveBeenCalled()
  })
})

function getFetchURL(input: RequestInfo | URL) {
  if (typeof input === 'string') {
    return input
  }
  if (input instanceof URL) {
    return input.href
  }
  return input.url
}

function createMockTrack(stop: ReturnType<typeof vi.fn>) {
  return {
    stop
  } as unknown as MediaStreamTrack
}

function createMockStream(tracks: MediaStreamTrack[]) {
  return {
    getAudioTracks: vi.fn(() => tracks),
    getTracks: vi.fn(() => tracks)
  } as unknown as MediaStream
}

function createMockDataChannel(close: ReturnType<typeof vi.fn>) {
  return {
    close,
    onmessage: null,
    onopen: null
  } as unknown as RTCDataChannel
}

class MockPeerConnection {
  onconnectionstatechange: (() => void) | null = null
  ontrack: ((event: RTCTrackEvent) => void) | null = null
  connectionState: RTCPeerConnectionState = 'new'
  addTrack = vi.fn()
  close = vi.fn()
  createOffer = vi.fn(async () => ({ sdp: 'offer-sdp', type: 'offer' }))
  setLocalDescription = vi.fn(async () => undefined)
  setRemoteDescription = vi.fn(async () => undefined)

  constructor(
    private readonly dataChannel: RTCDataChannel,
    private readonly receiverTracks: MediaStreamTrack[]
  ) {}

  createDataChannel = vi.fn(() => this.dataChannel)
  getReceivers = vi.fn(() =>
    this.receiverTracks.map((track) => ({ track }) as RTCRtpReceiver)
  )
}

function createConversationFetchMock() {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = getFetchURL(input)
    if (url.endsWith(translationConversationSessionsPath)) {
      return new Response(
        JSON.stringify({
          expiresAt: '2026-05-30T12:10:00Z',
          id: 'conversation-1'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    if (url.endsWith(`${translationConversationSessionsPath}/conversation-1`)) {
      return new Response(null, { status: 204 })
    }

    return new Response('answer-sdp', {
      status: 200,
      headers: { 'Content-Type': 'application/sdp' }
    })
  })
}

function createMockPeerConnectionConstructor(
  peerConnections: MockPeerConnection[],
  dataChannels: RTCDataChannel[],
  receiverTrackGroups: MediaStreamTrack[][]
) {
  return class extends MockPeerConnection {
    constructor() {
      const index = peerConnections.length
      super(dataChannels[index], receiverTrackGroups[index] ?? [])
      peerConnections.push(this)
    }
  } as unknown as typeof RTCPeerConnection
}
