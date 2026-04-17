import { getAccessToken } from '$lib/auth/session-service'
import { connection } from '$lib/stores/connection.svelte'
import { media } from '$lib/stores/media.svelte'
import type { SignalHandlers, SignalMessage } from '$lib/signaling/types'
import { cancelReconnect, scheduleReconnect } from '$lib/signaling/reconnect'

let ws: WebSocket | null = null
let intentionalDisconnect = false
let currentRoomId: string | null = null
let currentDisplayName: string | null = null
let currentHandlers: SignalHandlers | null = null

export function connect(
  roomId: string,
  displayName: string,
  handlers: SignalHandlers
) {
  currentRoomId = roomId
  currentDisplayName = displayName
  currentHandlers = handlers
  intentionalDisconnect = false

  createConnection(roomId, displayName, handlers)
}

function createConnection(
  roomId: string,
  displayName: string,
  handlers: SignalHandlers
) {
  void (async () => {
    const authToken = await getAccessToken()
    if (
      intentionalDisconnect ||
      roomId !== currentRoomId ||
      displayName !== currentDisplayName ||
      handlers !== currentHandlers
    ) {
      return
    }

    const signalingUrl = import.meta.env.VITE_SIGNALING_URL
    const url = new URL(
      signalingUrl ??
        `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:8080/ws`
    )

    if (authToken) {
      url.searchParams.set('access_token', authToken)
    }

    const socket = new WebSocket(url.toString())
    ws = socket

    socket.onopen = () => {
      connection.resetReconnectAttempts()
      send({
        type: 'join',
        roomId,
        displayName,
        authToken: authToken ?? undefined,
        audioEnabled: media.isMicOn,
        videoEnabled: media.isCameraOn
      })
    }

    socket.onmessage = (event) => {
      const msg: SignalMessage = JSON.parse(event.data)

      switch (msg.type) {
        case 'joined':
          handlers.onJoined(msg.userId!, msg.roomId!, msg.peers ?? [])
          break
        case 'peer-joined':
          handlers.onPeerJoined(
            msg.peerId!,
            msg.displayName ?? 'Anonymous',
            msg.audioEnabled,
            msg.videoEnabled
          )
          break
        case 'media-state':
          handlers.onPeerMediaState(
            msg.peerId!,
            msg.audioEnabled,
            msg.videoEnabled
          )
          break
        case 'peer-left':
          handlers.onPeerLeft(msg.peerId!)
          break
        case 'offer':
          handlers.onOffer(msg.fromId!, msg.sdp!)
          break
        case 'answer':
          handlers.onAnswer(msg.fromId!, msg.sdp!)
          break
        case 'ice-candidate':
          handlers.onIceCandidate(msg.fromId!, msg.candidate!)
          break
        case 'screen-share-start':
          handlers.onScreenShareStart?.(msg.peerId!, msg.streamId ?? '')
          break
        case 'screen-share-stop':
          handlers.onScreenShareStop?.(msg.peerId!)
          break
        case 'error':
          handlers.onError(msg.message ?? 'Unknown error')
          break
      }
    }

    socket.onclose = () => {
      if (ws === socket) {
        ws = null
      }
      if (
        !intentionalDisconnect &&
        currentRoomId &&
        currentDisplayName &&
        currentHandlers
      ) {
        scheduleReconnect(
          createConnection,
          currentRoomId,
          currentDisplayName,
          currentHandlers
        )
      }
    }

    socket.onerror = () => {
      // onclose will fire after this
    }
  })()
}

export function disconnect() {
  intentionalDisconnect = true
  cancelReconnect()

  if (ws && ws.readyState === WebSocket.OPEN) {
    send({ type: 'leave' })
    ws.close()
  }
  ws = null
  currentRoomId = null
  currentDisplayName = null
  currentHandlers = null
}

function send(msg: SignalMessage) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg))
  }
}

export function sendOffer(targetId: string, sdp: RTCSessionDescriptionInit) {
  send({ type: 'offer', targetId, sdp })
}

export function sendAnswer(targetId: string, sdp: RTCSessionDescriptionInit) {
  send({ type: 'answer', targetId, sdp })
}

export function sendIceCandidate(
  targetId: string,
  candidate: RTCIceCandidateInit
) {
  send({ type: 'ice-candidate', targetId, candidate })
}

export function sendScreenShareStart(streamId: string) {
  send({ type: 'screen-share-start', streamId })
}

export function sendScreenShareStop() {
  send({ type: 'screen-share-stop' })
}

export function sendMediaState(audioEnabled: boolean, videoEnabled: boolean) {
  send({ type: 'media-state', audioEnabled, videoEnabled })
}
