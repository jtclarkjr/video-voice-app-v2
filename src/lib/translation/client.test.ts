import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { getAccessToken } from '$lib/auth/session-service'
import {
  createTranslationClientSecret,
  fetchTranslationClientSecret,
  startLiveTranslationSession
} from '$lib/translation/client'

vi.mock('$lib/auth/session-service', () => ({
  getAccessToken: vi.fn()
}))

describe('translation client secret requests', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.mocked(getAccessToken).mockReset()
  })

  it('posts the selected language with the bearer token', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ value: 'client-secret' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const secret = await fetchTranslationClientSecret(
      'es',
      'access-token',
      'http://localhost:8080'
    )

    expect(secret).toBe('client-secret')
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/translation/client-secret',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer access-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ targetLanguage: 'es' })
      }
    )
  })

  it('handles nested client secret response shapes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({ client_secret: { value: 'nested-secret' } }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      )
    )

    await expect(
      fetchTranslationClientSecret('fr', 'access-token', 'http://localhost:8080')
    ).resolves.toBe('nested-secret')
  })

  it('requires an authenticated access token', async () => {
    vi.mocked(getAccessToken).mockResolvedValue(null)

    await expect(createTranslationClientSecret('es')).rejects.toThrow(
      'Sign in to start translation.'
    )
  })

  it('maps backend errors to user-facing messages', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 503 }))
    )

    await expect(
      fetchTranslationClientSecret('es', 'access-token', 'http://localhost:8080')
    ).rejects.toThrow('Live translation is not configured.')
  })

  it('passes translated remote audio streams to the caller and cleans them up', async () => {
    const localTrackStop = vi.fn()
    const remoteTrackStop = vi.fn()
    const dataChannelClose = vi.fn()
    const localTrack = createMockTrack(localTrackStop)
    const remoteTrack = createMockTrack(remoteTrackStop)
    const localStream = createMockStream([localTrack])
    const remoteStream = createMockStream([remoteTrack])
    const dataChannel = createMockDataChannel(dataChannelClose)
    const peerConnections: MockPeerConnection[] = []

    vi.mocked(getAccessToken).mockResolvedValue('access-token')
    vi.stubGlobal('window', {
      location: {
        hostname: 'localhost',
        protocol: 'http:'
      }
    })
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn(async () => localStream)
      }
    })
    vi.stubGlobal(
      'RTCPeerConnection',
      createMockPeerConnectionConstructor(peerConnections, [dataChannel], [
        [remoteTrack]
      ])
    )
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = getFetchURL(input)
        if (url.endsWith('/translation/client-secret')) {
          return new Response(JSON.stringify({ value: 'client-secret' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        return new Response('answer-sdp', {
          status: 200,
          headers: { 'Content-Type': 'application/sdp' }
        })
      })
    )

    const onTranslatedAudioStream = vi.fn()
    const session = await startLiveTranslationSession({
      targetLanguage: 'es',
      onTranscriptDelta: vi.fn(),
      onTranslatedAudioStream
    })

    peerConnections[0].ontrack?.({
      streams: [remoteStream],
      track: remoteTrack
    } as unknown as RTCTrackEvent)

    expect(onTranslatedAudioStream).toHaveBeenCalledWith(remoteStream)

    session.stop()

    expect(dataChannelClose).toHaveBeenCalled()
    expect(peerConnections[0].close).toHaveBeenCalled()
    expect(localTrackStop).toHaveBeenCalled()
    expect(remoteTrackStop).toHaveBeenCalled()
  })

  it('renews with the existing microphone stream and replaces the connection', async () => {
    const localTrackStop = vi.fn()
    const firstRemoteTrackStop = vi.fn()
    const secondRemoteTrackStop = vi.fn()
    const firstDataChannelClose = vi.fn()
    const secondDataChannelClose = vi.fn()
    const localTrack = createMockTrack(localTrackStop)
    const firstRemoteTrack = createMockTrack(firstRemoteTrackStop)
    const secondRemoteTrack = createMockTrack(secondRemoteTrackStop)
    const localStream = createMockStream([localTrack])
    const firstRemoteStream = createMockStream([firstRemoteTrack])
    const secondRemoteStream = createMockStream([secondRemoteTrack])
    const firstDataChannel = createMockDataChannel(firstDataChannelClose)
    const secondDataChannel = createMockDataChannel(secondDataChannelClose)
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
      createMockPeerConnectionConstructor(
        peerConnections,
        [firstDataChannel, secondDataChannel],
        [[firstRemoteTrack], [secondRemoteTrack]]
      )
    )
    vi.stubGlobal('fetch', createTranslationFetchMock())

    const onTranslatedAudioStream = vi.fn()
    const onStatus = vi.fn()
    const session = await startLiveTranslationSession({
      targetLanguage: 'es',
      onTranscriptDelta: vi.fn(),
      onTranslatedAudioStream,
      onStatus
    })

    peerConnections[0].ontrack?.({
      streams: [firstRemoteStream],
      track: firstRemoteTrack
    } as unknown as RTCTrackEvent)

    await session.renew()

    peerConnections[1].ontrack?.({
      streams: [secondRemoteStream],
      track: secondRemoteTrack
    } as unknown as RTCTrackEvent)

    expect(getUserMedia).toHaveBeenCalledTimes(1)
    expect(peerConnections).toHaveLength(2)
    expect(peerConnections[0].addTrack).toHaveBeenCalledWith(
      localTrack,
      localStream
    )
    expect(peerConnections[1].addTrack).toHaveBeenCalledWith(
      localTrack,
      localStream
    )
    expect(firstDataChannelClose).toHaveBeenCalled()
    expect(peerConnections[0].close).toHaveBeenCalled()
    expect(firstRemoteTrackStop).toHaveBeenCalled()
    expect(localTrackStop).not.toHaveBeenCalled()
    expect(onTranslatedAudioStream).toHaveBeenLastCalledWith(secondRemoteStream)
    expect(onStatus).toHaveBeenCalledWith('renewing')
    expect(onStatus).toHaveBeenLastCalledWith('listening')

    session.stop()

    expect(secondDataChannelClose).toHaveBeenCalled()
    expect(peerConnections[1].close).toHaveBeenCalled()
    expect(secondRemoteTrackStop).toHaveBeenCalled()
    expect(localTrackStop).toHaveBeenCalled()
  })

  it('keeps the current connection alive when renewal fails', async () => {
    const localTrackStop = vi.fn()
    const firstRemoteTrackStop = vi.fn()
    const secondRemoteTrackStop = vi.fn()
    const firstDataChannelClose = vi.fn()
    const secondDataChannelClose = vi.fn()
    const localTrack = createMockTrack(localTrackStop)
    const firstRemoteTrack = createMockTrack(firstRemoteTrackStop)
    const secondRemoteTrack = createMockTrack(secondRemoteTrackStop)
    const localStream = createMockStream([localTrack])
    const firstDataChannel = createMockDataChannel(firstDataChannelClose)
    const secondDataChannel = createMockDataChannel(secondDataChannelClose)
    const peerConnections: MockPeerConnection[] = []

    vi.mocked(getAccessToken).mockResolvedValue('access-token')
    vi.stubGlobal('window', {
      location: {
        hostname: 'localhost',
        protocol: 'http:'
      }
    })
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn(async () => localStream)
      }
    })
    vi.stubGlobal(
      'RTCPeerConnection',
      createMockPeerConnectionConstructor(
        peerConnections,
        [firstDataChannel, secondDataChannel],
        [[firstRemoteTrack], [secondRemoteTrack]]
      )
    )
    vi.stubGlobal(
      'fetch',
      createTranslationFetchMock({
        failAnswerAfter: 1
      })
    )

    const onStatus = vi.fn()
    const session = await startLiveTranslationSession({
      targetLanguage: 'es',
      onTranscriptDelta: vi.fn(),
      onStatus
    })

    await expect(session.renew()).rejects.toThrow(
      'Could not connect to the translation session.'
    )

    expect(peerConnections).toHaveLength(2)
    expect(secondDataChannelClose).toHaveBeenCalled()
    expect(peerConnections[1].close).toHaveBeenCalled()
    expect(secondRemoteTrackStop).toHaveBeenCalled()
    expect(firstDataChannelClose).not.toHaveBeenCalled()
    expect(peerConnections[0].close).not.toHaveBeenCalled()
    expect(firstRemoteTrackStop).not.toHaveBeenCalled()
    expect(localTrackStop).not.toHaveBeenCalled()
    expect(onStatus).toHaveBeenLastCalledWith('listening')

    session.stop()
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
  getSenders = vi.fn(() => [] as RTCRtpSender[])
  getReceivers = vi.fn(() =>
    this.receiverTracks.map((track) => ({ track }) as RTCRtpReceiver)
  )
}

function createTranslationFetchMock({
  failAnswerAfter
}: { failAnswerAfter?: number } = {}) {
  let answerRequests = 0

  return vi.fn(async (input: RequestInfo | URL) => {
    const url = getFetchURL(input)
    if (url.endsWith('/translation/client-secret')) {
      return new Response(JSON.stringify({ value: 'client-secret' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    answerRequests += 1
    if (failAnswerAfter && answerRequests > failAnswerAfter) {
      return new Response('nope', { status: 500 })
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
