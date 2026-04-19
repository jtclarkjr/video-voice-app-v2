<script lang="ts">
  import CallAudioControls from '$lib/components/call/CallAudioControls.svelte'
  import CallSessionControls from '$lib/components/call/CallSessionControls.svelte'
  import CallVideoControls from '$lib/components/call/CallVideoControls.svelte'
  import VoiceVideoSettingsDialog from '$lib/components/settings/VoiceVideoSettingsDialog.svelte'

  let { onLeave = () => {} } = $props<{ onLeave?: () => void }>()

  let settingsOpen = $state(false)
</script>

<VoiceVideoSettingsDialog bind:open={settingsOpen} />

<div class="flex items-center justify-center gap-2">
  <div class="flex items-center gap-0.5 rounded-full bg-secondary px-1 py-1">
    <CallAudioControls bind:settingsOpen />

    <div class="mx-0.5 h-5 w-px bg-border"></div>

    <CallVideoControls bind:settingsOpen />
  </div>

  <CallSessionControls {onLeave} />
</div>
