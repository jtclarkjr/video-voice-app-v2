import { browser } from '$app/environment'

export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'theme'

let current = $state<Theme>('system')
let cleanup: (() => void) | undefined

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (!browser) {
    return 'light'
  }

  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }

  return theme
}

function applyTheme(theme: Theme) {
  if (!browser) {
    return
  }

  const resolved = resolveTheme(theme)
  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')
  root.dataset.theme = theme
}

export const theme = {
  get current() {
    return current
  },
  set(nextTheme: Theme) {
    current = nextTheme
    if (browser) {
      window.localStorage.setItem(STORAGE_KEY, nextTheme)
    }

    applyTheme(nextTheme)
  },
  init() {
    cleanup?.()
    cleanup = undefined

    if (!browser) {
      return undefined
    }

    const stored = window.localStorage.getItem(STORAGE_KEY)
    const nextTheme =
      stored === 'light' || stored === 'dark' || stored === 'system'
        ? stored
        : 'system'

    current = nextTheme
    applyTheme(nextTheme)

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => {
      if (document.documentElement.dataset.theme === 'system') {
        applyTheme('system')
      }
    }

    mediaQuery.addEventListener('change', listener)
    cleanup = () => mediaQuery.removeEventListener('change', listener)
    return cleanup
  }
}

export const themeInitScript = `
(() => {
  const storageKey = "${STORAGE_KEY}";
  const stored = window.localStorage.getItem(storageKey);
  const theme = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
  const resolved = theme === "system"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    : theme;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.dataset.theme = theme;
})();
`
