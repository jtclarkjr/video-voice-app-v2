<script lang="ts">
  import GalleryLayout from '$lib/components/layouts/GalleryLayout.svelte'
  import SpeakerLayout from '$lib/components/layouts/SpeakerLayout.svelte'
  import { layout } from '$lib/stores/layout.svelte'
  import { screenShare } from '$lib/stores/screen-share.svelte'
  import type { Participant } from '$lib/types/participant'

  let {
    localStream = null,
    participants = {},
    isCameraOn = true,
    localDisplayName = 'You',
    localSpeaking = false
  } = $props<{
    localStream?: MediaStream | null
    participants?: Record<string, Participant>
    isCameraOn?: boolean
    localDisplayName?: string
    localSpeaking?: boolean
  }>()

  const screenShareStream = $derived(
    screenShare.localActive
      ? screenShare.localStream
      : (Object.values(screenShare.remoteShares)[0] ?? null)
  )
  const effectiveMode = $derived(screenShareStream ? 'speaker' : layout.mode)
</script>

{#if effectiveMode === 'speaker'}
  <SpeakerLayout
    {localStream}
    {participants}
    {isCameraOn}
    {localDisplayName}
    {localSpeaking}
    activeSpeakerId={layout.activeSpeakerId}
    pinnedId={layout.pinnedId}
    {screenShareStream}
    onPin={(id) => layout.togglePin(id)}
  />
{:else}
  <GalleryLayout
    {localStream}
    {participants}
    {isCameraOn}
    {localDisplayName}
    {localSpeaking}
    pinnedId={layout.pinnedId}
    onPin={(id) => layout.togglePin(id)}
  />
{/if}
