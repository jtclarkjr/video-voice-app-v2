import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'

describe('pending join store', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('$app/environment', () => ({ browser: true }))

    const session = new Map<string, string>()
    const sessionStorage = {
      getItem: (key: string) => session.get(key) ?? null,
      setItem: (key: string, value: string) => {
        session.set(key, value)
      },
      removeItem: (key: string) => {
        session.delete(key)
      }
    }

    vi.stubGlobal('window', { sessionStorage })
  })

  afterEach(() => {
    vi.doUnmock('$app/environment')
    vi.unstubAllGlobals()
  })

  it('persists and consumes a room-specific payload', async () => {
    const pendingJoin = await import('$lib/stores/pending-join')

    pendingJoin.savePendingJoin({
      roomId: 'room-1',
      displayName: 'Guest',
      isMicOn: true,
      isCameraOn: false,
      createdAt: Date.now()
    })

    expect(pendingJoin.consumePendingJoin('room-1')).toEqual({
      roomId: 'room-1',
      displayName: 'Guest',
      isMicOn: true,
      isCameraOn: false,
      createdAt: expect.any(Number)
    })
    expect(pendingJoin.consumePendingJoin('room-1')).toBeNull()
  })

  it('clears expired payloads', async () => {
    const pendingJoin = await import('$lib/stores/pending-join')

    pendingJoin.savePendingJoin({
      roomId: 'room-2',
      displayName: 'Guest',
      isMicOn: true,
      isCameraOn: true,
      createdAt: Date.now() - 120_000
    })

    expect(pendingJoin.consumePendingJoin('room-2')).toBeNull()
  })
})
