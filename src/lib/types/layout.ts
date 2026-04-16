export type LayoutMode = 'gallery' | 'speaker'

export type LayoutState = {
  mode: LayoutMode
  activeSpeakerId: string | null
  pinnedId: string | null
  chatOpen: boolean
  rosterOpen: boolean
}

export function createLayoutState(): LayoutState {
  return {
    mode: 'gallery',
    activeSpeakerId: null,
    pinnedId: null,
    chatOpen: false,
    rosterOpen: false
  }
}
