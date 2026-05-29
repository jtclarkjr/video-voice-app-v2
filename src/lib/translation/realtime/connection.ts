import { getTranslationDelta } from '$lib/translation/transcript/events'
import type {
  TranslationConnection,
  TranslationConnectionStatus,
  TranslationLanguageCode
} from '$lib/translation/types'
import { createTranslationClientSecret } from '$lib/translation/realtime/client-secret'
import {
  openAIEventsDataChannelName,
  openAITranslationCallsUrl
} from '$lib/translation/realtime/constants'

type CreateTranslationConnectionOptions = {
  connectingStatus: TranslationConnectionStatus
  isCurrentConnection: (connection: TranslationConnection) => boolean
  isStopped: () => boolean
  onError?: (message: string) => void
  onStatus?: (status: TranslationConnectionStatus) => void
  onTranslatedAudioStream?: (stream: MediaStream) => void
  onTranscriptDelta: (delta: string) => void
  stream: MediaStream
  targetLanguage: TranslationLanguageCode
}

export async function createTranslationConnection({
  connectingStatus,
  isCurrentConnection,
  isStopped,
  onError,
  onStatus,
  onTranslatedAudioStream,
  onTranscriptDelta,
  stream,
  targetLanguage
}: CreateTranslationConnectionOptions): Promise<TranslationConnection> {
  onStatus?.(connectingStatus)
  const clientSecret = await createTranslationClientSecret(targetLanguage)
  if (isStopped()) {
    throw new Error('Translation session stopped.')
  }

  const peerConnection = new RTCPeerConnection()
  const connection: TranslationConnection = {
    events: null,
    peerConnection,
    translatedAudioStream: null
  }

  for (const track of stream.getAudioTracks()) {
    peerConnection.addTrack(track, stream)
  }

  peerConnection.ontrack = ({ streams, track }) => {
    if (isStopped()) {
      track.stop()
      return
    }

    const [remoteStream] = streams
    if (remoteStream) {
      connection.translatedAudioStream = remoteStream
    } else {
      connection.translatedAudioStream ??= new MediaStream()
      connection.translatedAudioStream.addTrack(track)
    }

    onTranslatedAudioStream?.(connection.translatedAudioStream)
  }

  peerConnection.onconnectionstatechange = () => {
    if (isStopped() || !isCurrentConnection(connection)) {
      return
    }

    if (peerConnection.connectionState === 'connected') {
      onStatus?.('listening')
    } else if (peerConnection.connectionState === 'failed') {
      onError?.('The translation connection failed.')
    }
  }

  const events = peerConnection.createDataChannel(openAIEventsDataChannelName)
  connection.events = events
  events.onopen = () => {
    if (!isStopped() && isCurrentConnection(connection)) {
      onStatus?.('listening')
    }
  }
  events.onmessage = ({ data }) => {
    const event = parseRealtimeEvent(data)
    const delta = getTranslationDelta(event)
    if (delta) {
      onTranscriptDelta(delta)
    }
    if (isRealtimeErrorEvent(event)) {
      onError?.('The translation session returned an error.')
    }
  }

  try {
    const offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)

    const answerResponse = await fetch(openAITranslationCallsUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${clientSecret}`,
        'Content-Type': 'application/sdp'
      },
      body: offer.sdp ?? ''
    })

    if (!answerResponse.ok) {
      throw new Error('Could not connect to the translation session.')
    }

    await peerConnection.setRemoteDescription({
      type: 'answer',
      sdp: await answerResponse.text()
    })

    return connection
  } catch (error) {
    closeTranslationConnection(connection)
    throw error
  }
}

export function closeTranslationConnection(
  connection: TranslationConnection | null
) {
  if (!connection) {
    return
  }

  connection.events?.close()
  connection.events = null

  connection.peerConnection
    .getReceivers()
    .forEach((receiver) => receiver.track?.stop())
  connection.peerConnection.close()

  for (const track of connection.translatedAudioStream?.getTracks() ?? []) {
    track.stop()
  }
  connection.translatedAudioStream = null
}

function parseRealtimeEvent(data: unknown): unknown {
  if (typeof data !== 'string') {
    return data
  }

  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

function isRealtimeErrorEvent(event: unknown): boolean {
  return (
    !!event &&
    typeof event === 'object' &&
    (event as { type?: unknown }).type === 'error'
  )
}
