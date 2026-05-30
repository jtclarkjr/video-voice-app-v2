import { getTranslationDelta } from '$lib/translation/transcript/events'
import type {
  TranslationConnection,
  TranslationConnectionStatus,
  TranslationLanguageCode
} from '$lib/translation/types'
import { openAIEventsDataChannelName } from '$lib/translation/realtime/constants'
import {
  createAuthenticatedTranslationSession,
  deleteTranslationSession,
  exchangeTranslationSessionOffer
} from '$lib/translation/realtime/session-api'

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
  const { accessToken, session } =
    await createAuthenticatedTranslationSession(targetLanguage)
  const cleanupTranslationSession = () => {
    void deleteTranslationSession(session.id, accessToken)
  }
  let connection: TranslationConnection | null = null

  try {
    if (isStopped()) {
      throw new Error('Translation session stopped.')
    }

    const peerConnection = new RTCPeerConnection()
    connection = {
      cleanupTranslationSession,
      events: null,
      peerConnection,
      translatedAudioStream: null
    }

    for (const track of stream.getAudioTracks()) {
      peerConnection.addTrack(track, stream)
    }

    peerConnection.ontrack = ({ streams, track }) => {
      if (isStopped() || !connection) {
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
      if (isStopped() || !connection || !isCurrentConnection(connection)) {
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
      if (!isStopped() && connection && isCurrentConnection(connection)) {
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

    const offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)

    const answerSdp = await exchangeTranslationSessionOffer(
      session.id,
      offer.sdp ?? '',
      accessToken
    )

    await peerConnection.setRemoteDescription({
      type: 'answer',
      sdp: answerSdp
    })

    return connection
  } catch (error) {
    if (connection) {
      closeTranslationConnection(connection)
    } else {
      cleanupTranslationSession()
    }
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
  connection.cleanupTranslationSession?.()
  connection.cleanupTranslationSession = null

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
