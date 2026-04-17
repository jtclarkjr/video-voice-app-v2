import {
  createLayoutState,
  type LayoutMode,
  type LayoutState
} from '$lib/types/layout'

let state = $state<LayoutState>(createLayoutState())

export const layout = {
  get mode() {
    return state.mode
  },
  get activeSpeakerId() {
    return state.activeSpeakerId
  },
  get pinnedId() {
    return state.pinnedId
  },
  get chatOpen() {
    return state.chatOpen
  },
  get rosterOpen() {
    return state.rosterOpen
  },
  setMode(mode: LayoutMode) {
    state.mode = mode
  },
  toggleMode() {
    state.mode = state.mode === 'gallery' ? 'speaker' : 'gallery'
  },
  setActiveSpeaker(id: string | null) {
    state.activeSpeakerId = id
  },
  setPinnedParticipant(id: string | null) {
    state.pinnedId = id
  },
  togglePin(id: string) {
    state.pinnedId = state.pinnedId === id ? null : id
  },
  toggleChat() {
    state.chatOpen = !state.chatOpen
    state.rosterOpen = false
  },
  toggleRoster() {
    state.rosterOpen = !state.rosterOpen
    state.chatOpen = false
  },
  reset() {
    state = createLayoutState()
  }
}
