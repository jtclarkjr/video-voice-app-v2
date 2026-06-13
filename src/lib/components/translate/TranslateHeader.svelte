<script lang="ts">
  import { Languages } from 'lucide-svelte'

  let { selectedLanguageLabel, statusLabel } = $props<{
    selectedLanguageLabel: string
    statusLabel: string
  }>()
</script>

<div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
  <div class="grid gap-2 sm:gap-3">
    <p class="m-0 text-sm font-bold uppercase tracking-[0.2em] text-primary">
      Live Translation
    </p>
    <h1
      class="sr-only m-0 text-3xl leading-none font-semibold tracking-tight text-foreground sm:not-sr-only sm:text-5xl"
    >
      Translate Speech
    </h1>
  </div>

  <div
    class="hidden w-fit items-center justify-start gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-1.5 text-sm text-muted-foreground sm:inline-flex"
  >
    <Languages class="size-4 text-primary" aria-hidden="true" />
    <span>{selectedLanguageLabel}</span>
    <span class="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true"></span>
    <span>{statusLabel}</span>
  </div>
</div>
