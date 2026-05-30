<script lang="ts">
  import { Play, Square, Volume2, VolumeX } from 'lucide-svelte'

  type Action = () => void | Promise<void>

  let {
    selectedLanguageLabel,
    statusLabel,
    translatedVoiceLabel,
    running,
    starting,
    sessionPending,
    voiceControlsVisible,
    voicePlaybackBlocked,
    translatedVoiceMuted,
    onStart,
    onStop,
    onToggleTranslatedVoice,
    onEnableTranslatedVoice
  } = $props<{
    selectedLanguageLabel: string
    statusLabel: string
    translatedVoiceLabel: string
    running: boolean
    starting: boolean
    sessionPending: boolean
    voiceControlsVisible: boolean
    voicePlaybackBlocked: boolean
    translatedVoiceMuted: boolean
    onStart: Action
    onStop: Action
    onToggleTranslatedVoice: Action
    onEnableTranslatedVoice: Action
  }>()
</script>

<div
  class="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/92 px-3 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur lg:hidden"
>
  <div class="mx-auto flex max-w-5xl items-center gap-3">
    <div class="min-w-0 flex-1">
      <p class="m-0 truncate text-sm font-medium text-foreground">
        {selectedLanguageLabel}
      </p>
      <p class="m-0 text-xs text-muted-foreground">{statusLabel}</p>
    </div>
    {#if voiceControlsVisible}
      <button
        type="button"
        class="inline-flex size-11 items-center justify-center rounded-md border border-border bg-background text-muted-foreground"
        onclick={() => void onToggleTranslatedVoice()}
        aria-label={translatedVoiceLabel}
        title={translatedVoiceMuted ? 'Voice off' : 'Voice on'}
        aria-pressed={!translatedVoiceMuted}
      >
        {#if translatedVoiceMuted}
          <VolumeX class="size-4" aria-hidden="true" />
        {:else}
          <Volume2 class="size-4" aria-hidden="true" />
        {/if}
      </button>
    {/if}
    {#if voicePlaybackBlocked}
      <button
        type="button"
        class="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-medium text-primary"
        onclick={() => void onEnableTranslatedVoice()}
      >
        <Volume2 class="size-4" aria-hidden="true" />
        Enable
      </button>
    {/if}
    {#if running}
      <button
        type="button"
        class="inline-flex min-h-11 min-w-28 items-center justify-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground"
        onclick={() => void onStop()}
      >
        <Square class="size-4" aria-hidden="true" />
        Stop
      </button>
    {:else}
      <button
        type="button"
        class="inline-flex min-h-11 min-w-28 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        disabled={sessionPending || starting}
        onclick={() => void onStart()}
      >
        <Play class="size-4" aria-hidden="true" />
        {starting ? 'Starting' : 'Start'}
      </button>
    {/if}
  </div>
</div>
