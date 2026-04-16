import { browser } from '$app/environment'
import { writable } from 'svelte/store'

export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'theme'

const themeStore = writable<Theme>('system')

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
  subscribe: themeStore.subscribe,
  set(nextTheme: Theme) {
    themeStore.set(nextTheme)
    if (browser) {
      window.localStorage.setItem(STORAGE_KEY, nextTheme)
    }
    applyTheme(nextTheme)
  },
  init() {
    if (!browser) {
      return
    }

    const stored = window.localStorage.getItem(STORAGE_KEY)
    const nextTheme =
      stored === 'light' || stored === 'dark' || stored === 'system'
        ? stored
        : 'system'
    themeStore.set(nextTheme)
    applyTheme(nextTheme)

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => {
      if (document.documentElement.dataset.theme === 'system') {
        applyTheme('system')
      }
    }
    mediaQuery.addEventListener('change', listener)
    return () => mediaQuery.removeEventListener('change', listener)
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
