<script lang="ts">
  import { onDestroy } from 'svelte'
  import {
    Copy,
    Languages,
    LogIn,
    Mic,
    Play,
    Square,
    Trash2,
    Volume2,
    VolumeX
  } from 'lucide-svelte'
  import AuthDialog from '$lib/components/auth/AuthDialog.svelte'
  import type { AuthConfig } from '$lib/server/auth-config'
  import { session } from '$lib/stores/session.svelte'
  import {
    defaultTranslationLanguage,
    getTranslationLanguageLabel,
    translationLanguages
  } from '$lib/translation/config/languages'
  import { startLiveTranslationSession } from '$lib/translation/realtime/session'
  import {
    formatTranslationSessionTime,
    getTranslationSessionTiming
  } from '$lib/translation/timing/session-timing'
  import {
    translationSessionMaxRenewAttempts,
    translationSessionRenewRetryMs
  } from '$lib/translation/timing/constants'
  import type {
    LiveTranslationSession,
    TranslationConnectionStatus,
    TranslationLanguageCode
  } from '$lib/translation/types'

  let { data } = $props<{ data: { authConfig: AuthConfig } }>()

  let targetLanguage = $state<TranslationLanguageCode>(defaultTranslationLanguage)
  let transcript = $state('')
  let error = $state<string | null>(null)
  let copied = $state(false)
  let authDialogOpen = $state(false)
  let status = $state<TranslationConnectionStatus>('idle')
  let translationSession = $state<LiveTranslationSession | null>(null)
  let translatedAudioElement = $state<HTMLAudioElement | null>(null)
  let translatedAudioStream = $state<MediaStream | null>(null)
  let translatedVoiceMuted = $state(false)
  let voicePlaybackBlocked = $state(false)
  let sessionStartedAt = $state<number | null>(null)
  let sessionTimingNow = $state(Date.now())
  let sessionTimer = $state<ReturnType<typeof window.setInterval> | null>(null)
  let renewalRetryTimer = $state<ReturnType<typeof window.setTimeout> | null>(
    null
  )
  let renewalAttempts = $state(0)
  let renewalInProgress = $state(false)

  const starting = $derived(status === 'requesting-microphone' || status === 'connecting')
  const renewing = $derived(status === 'renewing')
  const active = $derived(translationSession !== null && status === 'listening')
  const running = $derived(active || renewing)
  const voiceControlsVisible = $derived(running || starting)
  const sessionTiming = $derived(
    sessionStartedAt === null
      ? null
      : getTranslationSessionTiming(sessionStartedAt, sessionTimingNow)
  )
  const sessionWarningVisible = $derived(
    running && sessionTiming?.shouldWarn === true
  )
  const selectedLanguageLabel = $derived(getTranslationLanguageLabel(targetLanguage))

  onDestroy(() => {
    translationSession?.stop()
    clearSessionTimers()
    resetTranslatedAudio()
  })

  async function startSession() {
    if (session.isPending) {
      return
    }

    if (session.isAnonymous) {
      authDialogOpen = true
      return
    }

    translationSession?.stop()
    translationSession = null
    clearSessionTimers()
    resetTranslatedAudio()
    transcript = ''
    copied = false
    error = null

    try {
      translationSession = await startLiveTranslationSession({
        targetLanguage,
        onTranscriptDelta(delta) {
          transcript += delta
        },
        onTranslatedAudioStream(stream) {
          void attachTranslatedAudioStream(stream)
        },
        onStatus(nextStatus) {
          status = nextStatus
          if (nextStatus === 'stopped') {
            translationSession = null
            clearSessionTimers()
            resetTranslatedAudio()
          }
        },
        onError(message) {
          error = message
        }
      })
      startSessionTimers()
    } catch (cause) {
      translationSession = null
      status = 'idle'
      clearSessionTimers()
      resetTranslatedAudio()
      error = cause instanceof Error ? cause.message : 'Could not start live translation.'
    }
  }

  function stopSession() {
    translationSession?.stop()
    translationSession = null
    status = 'stopped'
    clearSessionTimers()
    resetTranslatedAudio()
  }

  function clearTranscript() {
    transcript = ''
    copied = false
  }

  async function copyTranscript() {
    if (!transcript.trim() || !navigator.clipboard) {
      return
    }

    await navigator.clipboard.writeText(transcript)
    copied = true
    window.setTimeout(() => {
      copied = false
    }, 1500)
  }

  function startSessionTimers() {
    clearSessionTimers()
    sessionStartedAt = Date.now()
    sessionTimingNow = Date.now()
    sessionTimer = window.setInterval(handleSessionTimerTick, 1000)
  }

  function clearSessionTimers() {
    if (sessionTimer) {
      window.clearInterval(sessionTimer)
      sessionTimer = null
    }
    if (renewalRetryTimer) {
      window.clearTimeout(renewalRetryTimer)
      renewalRetryTimer = null
    }
    sessionStartedAt = null
    sessionTimingNow = Date.now()
    renewalAttempts = 0
    renewalInProgress = false
  }

  function handleSessionTimerTick() {
    if (!translationSession || sessionStartedAt === null) {
      return
    }

    const now = Date.now()
    const timing = getTranslationSessionTiming(sessionStartedAt, now)
    sessionTimingNow = now

    if (timing.hardCutoffReached) {
      error = 'Session reached its time limit. Start again to continue.'
      stopSession()
      return
    }

    if (
      timing.shouldRenew &&
      !renewalRetryTimer &&
      renewalAttempts < translationSessionMaxRenewAttempts
    ) {
      void renewTranslationSession()
    }
  }

  async function renewTranslationSession() {
    if (
      !translationSession ||
      renewalInProgress ||
      renewalAttempts >= translationSessionMaxRenewAttempts
    ) {
      return
    }

    renewalInProgress = true
    renewalAttempts += 1

    try {
      await translationSession.renew()
      sessionStartedAt = Date.now()
      sessionTimingNow = Date.now()
      renewalAttempts = 0
      error = null
    } catch {
      if (!translationSession) {
        return
      }

      if (renewalAttempts < translationSessionMaxRenewAttempts) {
        error = 'Could not renew translation session. Retrying...'
        scheduleRenewalRetry()
      } else {
        error =
          'Could not renew translation session. Translation will stop before the session limit.'
      }
    } finally {
      renewalInProgress = false
    }
  }

  function scheduleRenewalRetry() {
    if (renewalRetryTimer) {
      window.clearTimeout(renewalRetryTimer)
    }

    renewalRetryTimer = window.setTimeout(() => {
      renewalRetryTimer = null
      void renewTranslationSession()
    }, translationSessionRenewRetryMs)
  }

  async function attachTranslatedAudioStream(stream: MediaStream) {
    translatedAudioStream = stream

    if (!translatedAudioElement) {
      return
    }

    translatedAudioElement.srcObject = stream
    translatedAudioElement.muted = translatedVoiceMuted
    await playTranslatedAudio()
  }

  async function playTranslatedAudio() {
    if (!translatedAudioElement || !translatedAudioStream || translatedVoiceMuted) {
      return
    }

    try {
      await translatedAudioElement.play()
      voicePlaybackBlocked = false
    } catch {
      voicePlaybackBlocked = true
    }
  }

  function toggleTranslatedVoice() {
    translatedVoiceMuted = !translatedVoiceMuted
    voicePlaybackBlocked = false

    if (!translatedAudioElement) {
      return
    }

    translatedAudioElement.muted = translatedVoiceMuted
    if (translatedVoiceMuted) {
      translatedAudioElement.pause()
      return
    }

    void playTranslatedAudio()
  }

  function enableTranslatedVoice() {
    translatedVoiceMuted = false
    if (translatedAudioElement) {
      translatedAudioElement.muted = false
    }
    void playTranslatedAudio()
  }

  function resetTranslatedAudio() {
    translatedAudioStream = null
    voicePlaybackBlocked = false

    if (!translatedAudioElement) {
      return
    }

    translatedAudioElement.pause()
    translatedAudioElement.srcObject = null
  }

  function translatedVoiceLabel() {
    return translatedVoiceMuted ? 'Unmute translated voice' : 'Mute translated voice'
  }

  function sessionLimitLabel() {
    if (!sessionTiming) {
      return ''
    }

    if (renewing) {
      return 'Renewing translation session...'
    }

    if (renewalAttempts > 0) {
      return `Session time limit in ${formatTranslationSessionTime(
        sessionTiming.timeUntilHardCutoffMs
      )}`
    }

    if (sessionTiming.shouldRenew) {
      return 'Renewing translation session...'
    }

    return `Auto-renew in ${formatTranslationSessionTime(
      sessionTiming.timeUntilRenewMs
    )}`
  }

  function statusLabel() {
    if (status === 'requesting-microphone') {
      return 'Microphone'
    }
    if (status === 'connecting') {
      return 'Connecting'
    }
    if (status === 'listening') {
      return 'Listening'
    }
    if (status === 'renewing') {
      return 'Renewing'
    }
    if (status === 'stopped') {
      return 'Stopped'
    }
    return 'Ready'
  }
</script>

<section class="grid gap-4 pb-24 sm:gap-6 lg:pb-0">
  <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div class="grid gap-2 sm:gap-3">
      <p class="m-0 text-sm font-bold uppercase tracking-[0.2em] text-primary">Live Translation</p>
      <h1
        class="m-0 text-3xl leading-none font-semibold tracking-tight text-foreground sm:text-5xl"
      >
        Translate Speech
      </h1>
    </div>

    <div
      class="hidden w-fit items-center justify-start gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-1.5 text-sm text-muted-foreground sm:inline-flex"
    >
      <Languages class="size-4 text-primary" aria-hidden="true" />
      <span>{selectedLanguageLabel}</span>
      <span class="h-1.5 w-1.5 rounded-full bg-success"></span>
      <span>{statusLabel()}</span>
    </div>
  </div>

  {#if session.isAnonymous}
    <div
      class="surface-card grid min-h-[22rem] place-items-center p-5 text-center sm:min-h-[28rem] sm:p-6"
    >
      <div class="grid max-w-md gap-4">
        <div
          class="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          <Languages class="size-7" aria-hidden="true" />
        </div>
        <div class="grid gap-2">
          <h2 class="m-0 text-2xl font-semibold text-foreground">Sign In Required</h2>
          <p class="m-0 text-sm leading-6 text-muted-foreground">
            Live translation sessions are available to signed-in users.
          </p>
        </div>
        <button
          type="button"
          class="mx-auto inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          onclick={() => (authDialogOpen = true)}
        >
          <LogIn class="size-4" aria-hidden="true" />
          Sign In
        </button>
      </div>
    </div>
  {:else}
    <audio
      bind:this={translatedAudioElement}
      class="hidden"
      autoplay
      playsinline
      aria-hidden="true"
      oncanplay={() => void playTranslatedAudio()}
    ></audio>

    {#if sessionWarningVisible}
      <div
        class="flex items-center justify-between gap-3 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary sm:px-4"
        role="status"
      >
        <span class="min-w-0">{sessionLimitLabel()}</span>
        <span class="shrink-0 font-medium">{statusLabel()}</span>
      </div>
    {/if}

    <div class="grid gap-3 sm:gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
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
              <p
                class="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
              >
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
                onclick={stopSession}
              >
                <Square class="size-4" aria-hidden="true" />
                Stop
              </button>
            {:else}
              <button
                type="button"
                class="hidden min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 lg:col-span-2 lg:inline-flex"
                disabled={session.isPending || starting}
                onclick={() => void startSession()}
              >
                <Play class="size-4" aria-hidden="true" />
                {starting ? 'Starting' : 'Start'}
              </button>
            {/if}

            {#if voiceControlsVisible}
              <button
                type="button"
                class="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                onclick={toggleTranslatedVoice}
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
                onclick={() => void enableTranslatedVoice()}
              >
                <Volume2 class="size-4" aria-hidden="true" />
                Enable Voice
              </button>
            {/if}

            <button
              type="button"
              class="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
              disabled={!transcript}
              onclick={clearTranscript}
            >
              <Trash2 class="size-4" aria-hidden="true" />
              Clear
            </button>
            <button
              type="button"
              class="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
              disabled={!transcript.trim()}
              onclick={() => void copyTranscript()}
            >
              <Copy class="size-4" aria-hidden="true" />
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          {#if error}
            <p
              class="m-0 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          {/if}
        </div>
      </div>

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
                onclick={clearTranscript}
                aria-label="Clear translation"
                title="Clear"
              >
                <Trash2 class="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                class="inline-flex size-10 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                disabled={!transcript.trim()}
                onclick={() => void copyTranscript()}
                aria-label={copied ? 'Copied translation' : 'Copy translation'}
                title={copied ? 'Copied' : 'Copy'}
              >
                <Copy class="size-4" aria-hidden="true" />
              </button>
            </div>
            <span
              class="hidden rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground sm:inline-flex"
            >
              {statusLabel()}
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
            <div
              class="flex min-h-[16rem] items-center justify-center text-center sm:min-h-[20rem]"
            >
              <p class="m-0 text-base text-muted-foreground">
                {running || starting ? 'Listening...' : 'Ready'}
              </p>
            </div>
          {/if}
        </div>
      </div>
    </div>

    <div
      class="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/92 px-3 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur lg:hidden"
    >
      <div class="mx-auto flex max-w-5xl items-center gap-3">
        <div class="min-w-0 flex-1">
          <p class="m-0 truncate text-sm font-medium text-foreground">
            {selectedLanguageLabel}
          </p>
          <p class="m-0 text-xs text-muted-foreground">{statusLabel()}</p>
        </div>
        {#if voiceControlsVisible}
          <button
            type="button"
            class="inline-flex size-11 items-center justify-center rounded-md border border-border bg-background text-muted-foreground"
            onclick={toggleTranslatedVoice}
            aria-label={translatedVoiceLabel()}
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
            onclick={() => void enableTranslatedVoice()}
          >
            <Volume2 class="size-4" aria-hidden="true" />
            Enable
          </button>
        {/if}
        {#if running}
          <button
            type="button"
            class="inline-flex min-h-11 min-w-28 items-center justify-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground"
            onclick={stopSession}
          >
            <Square class="size-4" aria-hidden="true" />
            Stop
          </button>
        {:else}
          <button
            type="button"
            class="inline-flex min-h-11 min-w-28 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            disabled={session.isPending || starting}
            onclick={() => void startSession()}
          >
            <Play class="size-4" aria-hidden="true" />
            {starting ? 'Starting' : 'Start'}
          </button>
        {/if}
      </div>
    </div>
  {/if}
</section>

<AuthDialog bind:open={authDialogOpen} authConfig={data.authConfig} />
