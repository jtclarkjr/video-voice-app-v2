<script lang="ts">
  import { Copy, Play, Square, Trash2, Volume2, VolumeX } from 'lucide-svelte'
  import type { TranslationLanguageCode } from '$lib/translation/types'

  type TranslationLanguageOption = {
    code: TranslationLanguageCode
    label: string
  }

  type Action = () => void | Promise<void>

  let {
    targetLanguage = $bindable<TranslationLanguageCode>('en'),
    translationLanguages,
    running,
    starting,
    sessionPending,
    voiceControlsVisible,
    voicePlaybackBlocked,
    translatedVoiceMuted,
    copied,
    transcript,
    error,
    warning,
    startDisabled,
    onStart,
    onStop,
    onClearTranscript,
    onCopyTranscript,
    onToggleTranslatedVoice,
    onEnableTranslatedVoice
  } = $props<{
    targetLanguage: TranslationLanguageCode
    translationLanguages: readonly TranslationLanguageOption[]
    running: boolean
    starting: boolean
    sessionPending: boolean
    voiceControlsVisible: boolean
    voicePlaybackBlocked: boolean
    translatedVoiceMuted: boolean
    copied: boolean
    transcript: string
    error: string | null
    warning: string | null
    startDisabled: boolean
    onStart: Action
    onStop: Action
    onClearTranscript: Action
    onCopyTranscript: Action
    onToggleTranslatedVoice: Action
    onEnableTranslatedVoice: Action
  }>()
</script>

<div
  class={`surface-card self-start p-3 sm:p-5 lg:sticky lg:top-24 ${
    running || starting ? 'hidden sm:block' : ''
  }`}
>
  <div class="grid gap-3 sm:gap-5">
    <div
      class="grid gap-2 rounded-2xl border border-border/70 bg-background/70 p-3 sm:grid-cols-2 sm:gap-3 sm:border-0 sm:bg-transparent sm:p-0 lg:grid-cols-1"
    >
      <div class="grid gap-1.5 sm:gap-2">
        <div class="flex items-center justify-between gap-2">
          <label
            for="translation-language"
            class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
          >
            Translate To
          </label>
          <span
            class="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground sm:hidden"
          >
            Auto source
          </span>
        </div>
        <select
          id="translation-language"
          bind:value={targetLanguage}
          disabled={running || starting}
          class="min-h-10 w-full rounded-md border border-border bg-background px-3 py-2 outline-none transition focus:border-primary disabled:opacity-60 sm:min-h-11"
        >
          {#each translationLanguages as language}
            <option value={language.code}>{language.label}</option>
          {/each}
        </select>
      </div>

      <div class="hidden gap-2 sm:grid">
        <p class="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Source
        </p>
        <div
          class="flex min-h-11 items-center rounded-md border border-border/70 bg-background px-3 py-2 text-sm text-foreground"
        >
          Auto-detect
        </div>
      </div>
    </div>

    <div class="hidden grid-cols-2 gap-2 sm:grid">
      {#if running}
        <button
          type="button"
          class="hidden min-h-11 items-center justify-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 lg:col-span-2 lg:inline-flex"
          onclick={() => void onStop()}
        >
          <Square class="size-4" aria-hidden="true" />
          Stop
        </button>
      {:else}
        <button
          type="button"
          class="hidden min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 lg:col-span-2 lg:inline-flex"
          disabled={sessionPending || starting || startDisabled}
          onclick={() => void onStart()}
        >
          <Play class="size-4" aria-hidden="true" />
          {starting ? 'Starting' : 'Start'}
        </button>
      {/if}

      {#if voiceControlsVisible}
        <button
          type="button"
          class="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          onclick={() => void onToggleTranslatedVoice()}
          aria-pressed={!translatedVoiceMuted}
        >
          {#if translatedVoiceMuted}
            <VolumeX class="size-4" aria-hidden="true" />
            Voice Off
          {:else}
            <Volume2 class="size-4" aria-hidden="true" />
            Voice On
          {/if}
        </button>
      {/if}

      {#if voicePlaybackBlocked}
        <button
          type="button"
          class="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
          onclick={() => void onEnableTranslatedVoice()}
        >
          <Volume2 class="size-4" aria-hidden="true" />
          Enable Voice
        </button>
      {/if}

      <button
        type="button"
        class="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
        disabled={!transcript}
        onclick={() => void onClearTranscript()}
      >
        <Trash2 class="size-4" aria-hidden="true" />
        Clear
      </button>
      <button
        type="button"
        class="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
        disabled={!transcript.trim()}
        onclick={() => void onCopyTranscript()}
      >
        <Copy class="size-4" aria-hidden="true" />
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>

    {#if error}
      <p
        class="m-0 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        role="alert"
      >
        {error}
      </p>
    {:else if warning}
      <p
        class="m-0 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning"
        role="status"
      >
        {warning}
      </p>
    {/if}
  </div>
</div>
