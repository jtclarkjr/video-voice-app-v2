<script lang="ts">
  import { tick } from 'svelte'
  import { ChevronDown, Copy, Mic, Trash2 } from 'lucide-svelte'
  import type { TranslationLanguageCode } from '$lib/translation/types'

  type TranslationLanguageOption = {
    code: TranslationLanguageCode
    label: string
  }

  type Action = () => void | Promise<void>

  const autoScrollThreshold = 48

  let {
    targetLanguage = $bindable<TranslationLanguageCode>('en'),
    translationLanguages,
    selectedLanguageLabel,
    statusLabel,
    transcript,
    copied,
    running,
    starting,
    onClearTranscript,
    onCopyTranscript
  } = $props<{
    targetLanguage: TranslationLanguageCode
    translationLanguages: readonly TranslationLanguageOption[]
    selectedLanguageLabel: string
    statusLabel: string
    transcript: string
    copied: boolean
    running: boolean
    starting: boolean
    onClearTranscript: Action
    onCopyTranscript: Action
  }>()

  let scroller = $state<HTMLDivElement | null>(null)
  let stickToBottom = $state(true)

  $effect(() => {
    const currentTranscript = transcript

    if (!currentTranscript) {
      stickToBottom = true
    }

    if (!stickToBottom) {
      return
    }

    void tick().then(() => {
      if (stickToBottom) {
        scrollTranscriptToBottom()
      }
    })
  })

  function isNearBottom(element: HTMLDivElement) {
    return element.scrollHeight - element.scrollTop - element.clientHeight <= autoScrollThreshold
  }

  function handleTranscriptScroll() {
    if (!scroller) {
      return
    }

    stickToBottom = isNearBottom(scroller)
  }

  function scrollTranscriptToBottom() {
    if (!scroller) {
      return
    }

    scroller.scrollTop = scroller.scrollHeight
  }
</script>

<div class="surface-card min-h-[20rem] min-w-0 p-4 sm:min-h-[28rem] sm:p-6">
  <div class="mb-4 flex items-center justify-between gap-3">
    <div class="flex min-w-0 items-center gap-2">
      <Mic class="size-5 shrink-0 text-primary" aria-hidden="true" />
      <div class="relative min-w-0 sm:hidden">
        <select
          id="mobile-translation-language"
          bind:value={targetLanguage}
          disabled={running || starting}
          class="m-0 w-full appearance-none truncate border-0 bg-transparent py-0 pl-0 pr-5 text-lg font-semibold text-foreground outline-none disabled:opacity-100"
          aria-label="Select translation language"
        >
          {#each translationLanguages as language}
            <option value={language.code}>{language.label}</option>
          {/each}
        </select>
        <ChevronDown
          class="pointer-events-none absolute right-0 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
      <h2 class="m-0 hidden truncate text-lg font-semibold text-foreground sm:block">
        {selectedLanguageLabel}
      </h2>
    </div>
    <div class="flex shrink-0 items-center gap-2">
      <div class="flex items-center gap-1 sm:hidden">
        <button
          type="button"
          class="inline-flex size-10 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          disabled={!transcript}
          onclick={() => void onClearTranscript()}
          aria-label="Clear translation"
          title="Clear"
        >
          <Trash2 class="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="inline-flex size-10 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          disabled={!transcript.trim()}
          onclick={() => void onCopyTranscript()}
          aria-label={copied ? 'Copied translation' : 'Copy translation'}
          title={copied ? 'Copied' : 'Copy'}
        >
          <Copy class="size-4" aria-hidden="true" />
        </button>
      </div>
      <span
        class="hidden rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground sm:inline-flex"
      >
        {statusLabel}
      </span>
    </div>
  </div>

  <div
    bind:this={scroller}
    class="max-h-[calc(100svh-22rem)] min-h-[14rem] overflow-y-auto rounded-2xl border border-border/70 bg-background/80 p-4 pb-[calc(env(safe-area-inset-bottom)+6rem)] overscroll-contain sm:max-h-[calc(100svh-18rem)] sm:min-h-[22rem] sm:p-6 sm:pb-[calc(env(safe-area-inset-bottom)+6rem)] lg:max-h-none lg:pb-6"
    onscroll={handleTranscriptScroll}
    aria-live="polite"
  >
    {#if transcript}
      <p
        class="m-0 break-words whitespace-pre-wrap text-2xl leading-relaxed text-foreground sm:text-4xl"
      >
        {transcript}
      </p>
    {:else}
      <div class="flex min-h-[12rem] items-center justify-center text-center sm:min-h-[20rem]">
        <p class="m-0 text-base text-muted-foreground">
          {running || starting ? 'Listening...' : 'Ready'}
        </p>
      </div>
    {/if}
  </div>
</div>
