<script lang="ts">
  import {
    ArrowLeftRight,
    Languages,
    MessageCircle,
    Mic,
    Square,
    Trash2
  } from 'lucide-svelte'
  import { getTranslationLanguageLabel } from '$lib/translation/config/languages'
  import type {
    ConversationTurn,
    TranslationLanguageCode
  } from '$lib/translation/types'

  type TranslationLanguageOption = {
    code: TranslationLanguageCode
    label: string
  }

  type Action = () => void | Promise<void>

  let {
    sourceLanguage = $bindable<TranslationLanguageCode>('en'),
    targetLanguage = $bindable<TranslationLanguageCode>('ja'),
    translationLanguages,
    turns,
    running,
    starting,
    sessionPending,
    statusLabel,
    error,
    warning,
    startDisabled,
    languagesValid,
    onStart,
    onStop,
    onClearConversation,
    onSwapLanguages
  } = $props<{
    sourceLanguage: TranslationLanguageCode
    targetLanguage: TranslationLanguageCode
    translationLanguages: readonly TranslationLanguageOption[]
    turns: readonly ConversationTurn[]
    running: boolean
    starting: boolean
    sessionPending: boolean
    statusLabel: string
    error: string | null
    warning: string | null
    startDisabled: boolean
    languagesValid: boolean
    onStart: Action
    onStop: Action
    onClearConversation: Action
    onSwapLanguages: Action
  }>()

  const selectedLanguageLabel = $derived(
    `${getTranslationLanguageLabel(sourceLanguage)} / ${getTranslationLanguageLabel(targetLanguage)}`
  )

  function isSourceSpeaker(turn: ConversationTurn) {
    return turn.speakerLanguage === sourceLanguage
  }
</script>

<div class="grid gap-3 sm:gap-4">
  <div class="surface-card p-3 sm:p-5">
    <div class="grid gap-3">
      <div class="flex items-center justify-between gap-3">
        <div class="flex min-w-0 items-center gap-2">
          <Languages class="size-5 shrink-0 text-primary" aria-hidden="true" />
          <h2 class="m-0 truncate text-lg font-semibold text-foreground">
            {selectedLanguageLabel}
          </h2>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <span
            class="hidden rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground sm:inline-flex"
          >
            {statusLabel}
          </span>
          <button
            type="button"
            class="inline-flex size-10 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
            disabled={turns.length === 0}
            onclick={() => void onClearConversation()}
            aria-label="Clear conversation"
            title="Clear"
          >
            <Trash2 class="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div class="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-2">
        <label class="grid gap-1.5">
          <span class="text-xs font-semibold text-muted-foreground"
            >Person 1</span
          >
          <select
            bind:value={sourceLanguage}
            disabled={running || starting}
            name="conversation-source-language"
            class="min-h-11 w-full rounded-md border border-border bg-background px-3 py-2 transition focus:border-primary disabled:opacity-60"
          >
            {#each translationLanguages as language}
              <option value={language.code}>{language.label}</option>
            {/each}
          </select>
        </label>

        <button
          type="button"
          class="mt-6 inline-flex size-11 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          disabled={running || starting}
          onclick={() => void onSwapLanguages()}
          aria-label="Swap conversation languages"
          title="Swap"
        >
          <ArrowLeftRight class="size-4" aria-hidden="true" />
        </button>

        <label class="grid gap-1.5">
          <span class="text-xs font-semibold text-muted-foreground"
            >Person 2</span
          >
          <select
            bind:value={targetLanguage}
            disabled={running || starting}
            name="conversation-target-language"
            class="min-h-11 w-full rounded-md border border-border bg-background px-3 py-2 transition focus:border-primary disabled:opacity-60"
          >
            {#each translationLanguages as language}
              <option value={language.code}>{language.label}</option>
            {/each}
          </select>
        </label>
      </div>

      {#if error}
        <p
          class="m-0 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </p>
      {:else if warning}
        <p
          class="m-0 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning"
          role="status"
          aria-live="polite"
        >
          {warning}
        </p>
      {/if}
    </div>
  </div>

  <div class="surface-card min-h-[30rem] p-3 sm:p-5">
    <div
      class="max-h-[calc(100svh-20rem)] min-h-[22rem] overflow-y-auto rounded-2xl border border-border/70 bg-background/80 p-3 overscroll-contain sm:min-h-[26rem] sm:p-5 lg:max-h-none"
      role="log"
      aria-label="Live translated conversation"
      aria-live="polite"
      aria-relevant="additions text"
    >
      {#if turns.length > 0}
        <div class="grid gap-3">
          {#each turns as turn (turn.id)}
            <article
              class={`flex ${isSourceSpeaker(turn) ? 'justify-start' : 'justify-end'}`}
            >
              <div
                class={`max-w-[min(34rem,88%)] rounded-2xl px-4 py-3 shadow-sm ${
                  isSourceSpeaker(turn)
                    ? 'rounded-bl-md bg-secondary text-secondary-foreground'
                    : 'rounded-br-md bg-primary text-primary-foreground'
                }`}
              >
                <p class="m-0 text-xs font-semibold opacity-75">
                  {getTranslationLanguageLabel(turn.speakerLanguage)}
                </p>
                {#if turn.sourceText}
                  <p
                    class="m-0 mt-1 break-words whitespace-pre-wrap text-lg leading-7"
                  >
                    {turn.sourceText}
                  </p>
                {/if}
                {#if turn.translatedText}
                  <div
                    class={`mt-3 rounded-xl px-3 py-2 ${
                      isSourceSpeaker(turn)
                        ? 'bg-background/75 text-foreground'
                        : 'bg-white/15 text-primary-foreground'
                    }`}
                  >
                    <p class="m-0 text-xs font-semibold opacity-75">
                      {getTranslationLanguageLabel(turn.targetLanguage)}
                    </p>
                    <p
                      class="m-0 mt-1 break-words whitespace-pre-wrap text-xl leading-8"
                    >
                      {turn.translatedText}
                    </p>
                  </div>
                {/if}
              </div>
            </article>
          {/each}
        </div>
      {:else}
        <div class="flex min-h-[20rem] items-center justify-center text-center">
          <div class="grid justify-items-center gap-3">
            <MessageCircle
              class="size-8 text-muted-foreground"
              aria-hidden="true"
            />
            <p class="m-0 text-base text-muted-foreground">
              {running || starting ? 'Listening…' : 'Ready'}
            </p>
          </div>
        </div>
      {/if}
    </div>

    <div class="mt-4 flex flex-col items-center gap-2">
      {#if running}
        <button
          type="button"
          class="inline-flex size-16 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg transition-colors hover:bg-destructive/90"
          onclick={() => void onStop()}
          aria-label="Stop conversation"
          title="Stop"
        >
          <Square class="size-6" aria-hidden="true" />
        </button>
      {:else}
        <button
          type="button"
          class="inline-flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-colors hover:bg-primary/90 disabled:opacity-50"
          disabled={sessionPending ||
            starting ||
            startDisabled ||
            !languagesValid}
          onclick={() => void onStart()}
          aria-label={starting ? 'Starting conversation' : 'Start conversation'}
          title={starting ? 'Starting' : 'Start'}
        >
          <Mic class="size-7" aria-hidden="true" />
        </button>
      {/if}
      <p class="m-0 text-sm font-medium text-muted-foreground">{statusLabel}</p>
    </div>
  </div>
</div>
