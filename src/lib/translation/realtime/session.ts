import {
  closeTranslationConnection,
  createTranslationConnection
} from '$lib/translation/realtime/connection'
import type {
  LiveTranslationSession,
  StartLiveTranslationSessionOptions,
  TranslationConnection,
  TranslationConnectionStatus
} from '$lib/translation/types'

export async function startLiveTranslationSession({
  targetLanguage,
  onTranscriptDelta,
  onTranslatedAudioStream,
  onStatus,
  onError
}: StartLiveTranslationSessionOptions): Promise<LiveTranslationSession> {
  let stream: MediaStream | null = null
  let connection: TranslationConnection | null = null
  let renewPromise: Promise<void> | null = null
  let stopped = false

  const stop = () => {
    if (stopped) {
      return
    }

    stopped = true
    closeTranslationConnection(connection)
    connection = null

    for (const track of stream?.getTracks() ?? []) {
      track.stop()
    }
    stream = null
    onStatus?.('stopped')
  }

  const createConnection = async (
    connectingStatus: TranslationConnectionStatus
  ) => {
    const currentStream = stream
    if (!currentStream) {
      throw new Error('Microphone is not available.')
    }

    return createTranslationConnection({
      connectingStatus,
      isCurrentConnection: (nextConnection) => connection === nextConnection,
      isStopped: () => stopped || stream !== currentStream,
      onError,
      onStatus,
      onTranslatedAudioStream,
      onTranscriptDelta,
      stream: currentStream,
      targetLanguage
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
      let nextConnection: TranslationConnection
      try {
        nextConnection = await createConnection('renewing')
      } catch (error) {
        if (!stopped && previousConnection === connection) {
          onStatus?.('listening')
        }
        throw error
      }

      if (stopped) {
        closeTranslationConnection(nextConnection)
        return
      }

      connection = nextConnection
      closeTranslationConnection(previousConnection)
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
