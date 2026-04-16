import { beforeEach, describe, expect, it } from 'vite-plus/test'
import { get } from 'svelte/store'
import { addChatMessage, chat, clearUnread, resetChat } from '$lib/stores/chat'
import {
  getLayoutSnapshot,
  layout,
  resetLayout,
  toggleChat,
  toggleLayoutMode,
  toggleRoster
} from '$lib/stores/layout'

describe('layout and chat stores', () => {
  beforeEach(() => {
    resetLayout()
    resetChat()
  })

  it('toggles between gallery and speaker layout', () => {
    expect(getLayoutSnapshot().mode).toBe('gallery')
    toggleLayoutMode()
    expect(getLayoutSnapshot().mode).toBe('speaker')
  })

  it('opens chat and roster mutually exclusively', () => {
    toggleChat()
    expect(get(layout).chatOpen).toBe(true)
    expect(get(layout).rosterOpen).toBe(false)

    toggleRoster()
    expect(get(layout).chatOpen).toBe(false)
    expect(get(layout).rosterOpen).toBe(true)
  })

  it('tracks unread chat count only when chat is closed', () => {
    addChatMessage({
      id: 'message-1',
      fromId: 'peer-1',
      displayName: 'Peer',
      text: 'hello',
      timestamp: Date.now()
    })

    expect(get(chat).unreadCount).toBe(1)

    toggleChat()
    addChatMessage({
      id: 'message-2',
      fromId: 'peer-1',
      displayName: 'Peer',
      text: 'still here',
      timestamp: Date.now()
    })

    expect(get(chat).unreadCount).toBe(1)
    clearUnread()
    expect(get(chat).unreadCount).toBe(0)
  })
})
