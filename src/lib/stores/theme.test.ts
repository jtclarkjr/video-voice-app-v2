import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'

type StorageMap = Map<string, string>

function createStorage(map: StorageMap) {
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value)
    },
    removeItem: (key: string) => {
      map.delete(key)
    }
  }
}

describe('theme controller', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.doUnmock('$app/environment')
    vi.unstubAllGlobals()
  })

  it('initializes from local storage and applies the stored theme', async () => {
    vi.doMock('$app/environment', () => ({ browser: true }))

    const localStorageValues = new Map<string, string>([['theme', 'dark']])
    const classSet = new Set<string>()

    vi.stubGlobal('window', {
      localStorage: createStorage(localStorageValues),
      matchMedia: () => ({
        matches: false,
        addEventListener: () => {},
        removeEventListener: () => {}
      })
    })
    vi.stubGlobal('document', {
      documentElement: {
        dataset: {} as Record<string, string>,
        classList: {
          toggle(name: string, enabled: boolean) {
            if (enabled) {
              classSet.add(name)
            } else {
              classSet.delete(name)
            }
          }
        }
      }
    })

    const { theme } = await import('$lib/stores/theme.svelte')

    theme.init()

    expect(theme.current).toBe('dark')
    expect(classSet.has('dark')).toBe(true)
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('persists explicit theme changes', async () => {
    vi.doMock('$app/environment', () => ({ browser: true }))

    const localStorageValues = new Map<string, string>()

    vi.stubGlobal('window', {
      localStorage: createStorage(localStorageValues),
      matchMedia: () => ({
        matches: true,
        addEventListener: () => {},
        removeEventListener: () => {}
      })
    })
    vi.stubGlobal('document', {
      documentElement: {
        dataset: {} as Record<string, string>,
        classList: {
          toggle: () => {}
        }
      }
    })

    const { theme } = await import('$lib/stores/theme.svelte')

    theme.set('light')

    expect(theme.current).toBe('light')
    expect(localStorageValues.get('theme')).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
  })
})
