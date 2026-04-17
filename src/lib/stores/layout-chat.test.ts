import { beforeEach, describe, expect, it } from 'vite-plus/test'
import { chat } from '$lib/stores/chat.svelte'
import { layout } from '$lib/stores/layout.svelte'

describe('layout and chat stores', () => {
  beforeEach(() => {
    layout.reset()
    chat.reset()
  })

  it('toggles between gallery and speaker layout', () => {
    expect(layout.mode).toBe('gallery')
    layout.toggleMode()
    expect(layout.mode).toBe('speaker')
  })

  it('opens chat and roster mutually exclusively', () => {
    layout.toggleChat()
    expect(layout.chatOpen).toBe(true)
    expect(layout.rosterOpen).toBe(false)

    layout.toggleRoster()
    expect(layout.chatOpen).toBe(false)
    expect(layout.rosterOpen).toBe(true)
  })

  it('tracks unread chat count only when chat is closed', () => {
    chat.addMessage({
      id: 'message-1',
      fromId: 'peer-1',
      displayName: 'Peer',
      text: 'hello',
      timestamp: Date.now()
    })

    expect(chat.unreadCount).toBe(1)

    layout.toggleChat()
    chat.addMessage({
      id: 'message-2',
      fromId: 'peer-1',
      displayName: 'Peer',
      text: 'still here',
      timestamp: Date.now()
    })

    expect(chat.unreadCount).toBe(1)
    chat.clearUnread()
    expect(chat.unreadCount).toBe(0)
  })
})
