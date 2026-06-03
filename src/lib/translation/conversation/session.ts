import {
  closeTranslationConversationConnection,
  createTranslationConversationConnection
} from '$lib/translation/conversation/connection'
import type {
  LiveTranslationConversationSession,
  StartTranslationConversationSessionOptions,
  TranslationConversationConnection,
  TranslationConversationStatus
} from '$lib/translation/types'

export async function startTranslationConversationSession({
  languages,
  onError,
  onStatus,
  onTurnEvent
}: StartTranslationConversationSessionOptions): Promise<LiveTranslationConversationSession> {
  let stream: MediaStream | null = null
  let connection: TranslationConversationConnection | null = null
  let renewPromise: Promise<void> | null = null
  let stopped = false

  const stop = () => {
    if (stopped) {
      return
    }

    stopped = true
    closeTranslationConversationConnection(connection)
    connection = null

    for (const track of stream?.getTracks() ?? []) {
      track.stop()
    }
    stream = null
    onStatus?.('stopped')
  }

  const createConnection = async (
    connectingStatus: TranslationConversationStatus
  ) => {
    const currentStream = stream
    if (!currentStream) {
      throw new Error('Microphone is not available.')
    }

    return createTranslationConversationConnection({
      connectingStatus,
      isCurrentConnection: (nextConnection) => connection === nextConnection,
      isStopped: () => stopped || stream !== currentStream,
      languages,
      onError,
      onStatus,
      onTurnEvent,
      stream: currentStream
    })
  }

  const renew = async () => {
    if (stopped) {
      return
    }

    if (renewPromise) {
      return renewPromise
    }

    renewPromise = (async () => {
      const previousConnection = connection
      let nextConnection: TranslationConversationConnection
      try {
        nextConnection = await createConnection('renewing')
      } catch (error) {
        if (!stopped && previousConnection === connection) {
          onStatus?.('listening')
        }
        throw error
      }

      if (stopped) {
        closeTranslationConversationConnection(nextConnection)
        return
      }

      connection = nextConnection
      closeTranslationConversationConnection(previousConnection)
      onStatus?.('listening')
    })().finally(() => {
      renewPromise = null
    })

    return renewPromise
  }

  try {
    onStatus?.('requesting-microphone')
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    if (stopped) {
      stop()
      return { renew, stop }
    }

    connection = await createConnection('connecting')

    if (!stopped) {
      onStatus?.('listening')
    }

    return { renew, stop }
  } catch (error) {
    stop()
    throw error
  }
}
