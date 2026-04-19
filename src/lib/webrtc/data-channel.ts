import { chat } from '$lib/stores/chat.svelte'
import type { ChatMessage } from '$lib/types/chat'
import { dataChannels } from '$lib/webrtc/shared'

function parseChatMessage(payload: unknown): ChatMessage | null {
  if (typeof payload !== 'string') {
    return null
  }

  try {
    return JSON.parse(payload) as ChatMessage
  } catch {
    return null
  }
}

export function setupDataChannel(peerId: string, pc: RTCPeerConnection) {
  const channel = pc.createDataChannel('chat', { ordered: true })
  registerChannel(peerId, channel)

  pc.ondatachannel = (event) => {
    registerChannel(peerId, event.channel)
  }
}

function registerChannel(peerId: string, channel: RTCDataChannel) {
  channel.onopen = () => {
    dataChannels.set(peerId, channel)
  }

  channel.onmessage = (event) => {
    const msg = parseChatMessage(event.data)
    if (msg?.text) {
      chat.addMessage(msg)
    }
  }

  channel.onclose = () => {
    dataChannels.delete(peerId)
  }
}

export function broadcastChatMessage(message: ChatMessage) {
  const data = JSON.stringify(message)
  for (const [, channel] of dataChannels) {
    if (channel.readyState === 'open') {
      channel.send(data)
    }
  }
}
