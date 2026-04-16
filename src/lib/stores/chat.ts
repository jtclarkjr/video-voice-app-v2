import { get, writable } from 'svelte/store'
import {
  createChatState,
  type ChatMessage,
  type ChatState
} from '$lib/types/chat'
import { layout } from '$lib/stores/layout'

export const chat = writable<ChatState>(createChatState())

export function addChatMessage(message: ChatMessage) {
  chat.update((state) => ({
    messages: [...state.messages, message],
    unreadCount: get(layout).chatOpen
      ? state.unreadCount
      : state.unreadCount + 1
  }))
}

export function clearUnread() {
  chat.update((state) => ({ ...state, unreadCount: 0 }))
}

export function resetChat() {
  chat.set(createChatState())
}
