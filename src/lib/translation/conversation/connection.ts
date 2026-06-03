import { openAIEventsDataChannelName } from '$lib/translation/realtime/constants'
import {
  createConversationRealtimeEventMapper,
  isConversationErrorEvent
} from '$lib/translation/conversation/events'
import {
  createAuthenticatedTranslationConversationSession,
  deleteTranslationConversationSession,
  exchangeTranslationConversationSessionOffer
} from '$lib/translation/conversation/session-api'
import type {
  ConversationLanguagePair,
  ConversationRealtimeEvent,
  TranslationConversationConnection,
  TranslationConversationStatus
} from '$lib/translation/types'

type CreateTranslationConversationConnectionOptions = {
  connectingStatus: TranslationConversationStatus
  isCurrentConnection: (connection: TranslationConversationConnection) => boolean
  isStopped: () => boolean
  languages: ConversationLanguagePair
  onError?: (message: string) => void
  onStatus?: (status: TranslationConversationStatus) => void
  onTurnEvent: (event: ConversationRealtimeEvent) => void
  stream: MediaStream
}

export async function createTranslationConversationConnection({
  connectingStatus,
  isCurrentConnection,
  isStopped,
  languages,
  onError,
  onStatus,
  onTurnEvent,
  stream
}: CreateTranslationConversationConnectionOptions): Promise<TranslationConversationConnection> {
  onStatus?.(connectingStatus)
  const { accessToken, session } =
    await createAuthenticatedTranslationConversationSession(languages)
  const cleanupConversationSession = () => {
    void deleteTranslationConversationSession(session.id, accessToken)
  }
  const mapConversationEvent = createConversationRealtimeEventMapper(languages)
  let connection: TranslationConversationConnection | null = null

  try {
    if (isStopped()) {
      throw new Error('Conversation stopped.')
    }

    const peerConnection = new RTCPeerConnection()
    connection = {
      cleanupConversationSession,
      events: null,
      peerConnection
    }

    for (const track of stream.getAudioTracks()) {
      peerConnection.addTrack(track, stream)
    }

    peerConnection.ontrack = ({ track }) => {
      track.stop()
    }

    peerConnection.onconnectionstatechange = () => {
      if (isStopped() || !connection || !isCurrentConnection(connection)) {
        return
      }

      if (peerConnection.connectionState === 'connected') {
        onStatus?.('listening')
      } else if (peerConnection.connectionState === 'failed') {
        onError?.('The conversation connection failed.')
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
      const event = parseConversationEvent(data)
      const conversationEvent = mapConversationEvent(event)
      if (conversationEvent) {
        onTurnEvent(conversationEvent)
      }
      if (isConversationErrorEvent(event)) {
        onError?.('The conversation session returned an error.')
      }
    }

    const offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)

    const answerSdp = await exchangeTranslationConversationSessionOffer(
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
      closeTranslationConversationConnection(connection)
    } else {
      cleanupConversationSession()
    }
    throw error
  }
}

export function closeTranslationConversationConnection(
  connection: TranslationConversationConnection | null
) {
  if (!connection) {
    return
  }

  connection.events?.close()
  connection.events = null
  connection.cleanupConversationSession?.()
  connection.cleanupConversationSession = null

  connection.peerConnection
    .getReceivers()
    .forEach((receiver) => receiver.track?.stop())
  connection.peerConnection.close()
}

function parseConversationEvent(data: unknown): unknown {
  if (typeof data !== 'string') {
    return data
  }

  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}
