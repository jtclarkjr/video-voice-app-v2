<script lang="ts">
  import { Copy, Mic, Trash2 } from 'lucide-svelte'

  type Action = () => void | Promise<void>

  let {
    selectedLanguageLabel,
    statusLabel,
    transcript,
    copied,
    running,
    starting,
    onClearTranscript,
    onCopyTranscript
  } = $props<{
    selectedLanguageLabel: string
    statusLabel: string
    transcript: string
    copied: boolean
    running: boolean
    starting: boolean
    onClearTranscript: Action
    onCopyTranscript: Action
  }>()
</script>

<div class="surface-card min-h-[24rem] min-w-0 p-4 sm:min-h-[28rem] sm:p-6">
  <div class="mb-4 flex items-center justify-between gap-3">
    <div class="flex min-w-0 items-center gap-2">
      <Mic class="size-5 shrink-0 text-primary" aria-hidden="true" />
      <h2 class="m-0 truncate text-lg font-semibold text-foreground">
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
    class="max-h-[calc(100svh-18rem)] min-h-[18rem] overflow-y-auto rounded-2xl border border-border/70 bg-background/80 p-4 overscroll-contain sm:min-h-[22rem] sm:p-6 lg:max-h-none"
    aria-live="polite"
  >
    {#if transcript}
      <p
        class="m-0 break-words whitespace-pre-wrap text-2xl leading-relaxed text-foreground sm:text-4xl"
      >
        {transcript}
      </p>
    {:else}
      <div class="flex min-h-[16rem] items-center justify-center text-center sm:min-h-[20rem]">
        <p class="m-0 text-base text-muted-foreground">
          {running || starting ? 'Listening...' : 'Ready'}
        </p>
      </div>
    {/if}
  </div>
</div>
