export type ChatMessage = {
  id: string
  fromId: string
  displayName: string
  text: string
  timestamp: number
}

export type ChatState = {
  messages: ChatMessage[]
  unreadCount: number
}

export function createChatState(): ChatState {
  return {
    messages: [],
    unreadCount: 0
  }
}
