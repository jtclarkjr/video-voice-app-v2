import { get, writable } from 'svelte/store'
import {
  createLayoutState,
  type LayoutMode,
  type LayoutState
} from '$lib/types/layout'

export const layout = writable<LayoutState>(createLayoutState())

export function setLayoutMode(mode: LayoutMode) {
  layout.update((state) => ({ ...state, mode }))
}

export function toggleLayoutMode() {
  layout.update((state) => ({
    ...state,
    mode: state.mode === 'gallery' ? 'speaker' : 'gallery'
  }))
}

export function setActiveSpeaker(id: string | null) {
  layout.update((state) => ({ ...state, activeSpeakerId: id }))
}

export function setPinnedParticipant(id: string | null) {
  layout.update((state) => ({ ...state, pinnedId: id }))
}

export function togglePin(id: string) {
  layout.update((state) => ({
    ...state,
    pinnedId: state.pinnedId === id ? null : id
  }))
}

export function toggleChat() {
  layout.update((state) => ({
    ...state,
    chatOpen: !state.chatOpen,
    rosterOpen: false
  }))
}

export function toggleRoster() {
  layout.update((state) => ({
    ...state,
    rosterOpen: !state.rosterOpen,
    chatOpen: false
  }))
}

export function resetLayout() {
  layout.set(createLayoutState())
}

export const getLayoutSnapshot = () => get(layout)
