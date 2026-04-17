import {
  createChatState,
  type ChatMessage,
  type ChatState
} from '$lib/types/chat'
import { layout } from '$lib/stores/layout.svelte'

let state = $state<ChatState>(createChatState())

export const chat = {
  get messages() {
    return state.messages
  },
  get unreadCount() {
    return state.unreadCount
  },
  addMessage(message: ChatMessage) {
    state.messages = [...state.messages, message]
    if (!layout.chatOpen) {
      state.unreadCount += 1
    }
  },
  clearUnread() {
    state.unreadCount = 0
  },
  reset() {
    state = createChatState()
  }
}
