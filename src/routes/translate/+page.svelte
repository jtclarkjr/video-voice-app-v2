<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import AuthDialog from '$lib/components/auth/AuthDialog.svelte'
  import TranslateAuthGate from '$lib/components/translate/TranslateAuthGate.svelte'
  import TranslateHeader from '$lib/components/translate/TranslateHeader.svelte'
  import TranslateMobileControls from '$lib/components/translate/TranslateMobileControls.svelte'
  import TranslateSettingsPanel from '$lib/components/translate/TranslateSettingsPanel.svelte'
  import TranslateTranscriptPanel from '$lib/components/translate/TranslateTranscriptPanel.svelte'
  import type { AuthConfig } from '$lib/server/auth-config'
  import {
    getMicrophoneAvailability,
    getNoMicrophoneMessage,
    noMicrophoneConnectedMessage,
    type MicrophoneAvailability
  } from '$lib/media/microphone'
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
  let sessionTimer = $state<number | null>(null)
  let renewalRetryTimer = $state<number | null>(null)
  let renewalAttempts = $state(0)
  let renewalInProgress = $state(false)
  let microphoneAvailability = $state<MicrophoneAvailability>('unknown')
  let microphoneCheckPending = $state(false)

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
  const sessionWarningVisible = $derived(running && sessionTiming?.shouldWarn === true)
  const selectedLanguageLabel = $derived(getTranslationLanguageLabel(targetLanguage))
  const currentSessionLimitLabel = $derived(sessionLimitLabel())
  const currentStatusLabel = $derived(statusLabel())
  const currentTranslatedVoiceLabel = $derived(translatedVoiceLabel())
  const microphoneUnavailable = $derived(microphoneAvailability === 'unavailable')
  const microphoneWarning = $derived(
    microphoneUnavailable && !running && !starting ? noMicrophoneConnectedMessage : null
  )
  const startDisabled = $derived(microphoneUnavailable)
  const settingsWarning = $derived(error ? null : microphoneWarning)

  onMount(() => {
    let destroyed = false

    const mediaDevices = navigator.mediaDevices
    const syncMicrophoneAvailability = async () => {
      microphoneCheckPending = true
      const nextAvailability = await getMicrophoneAvailability(mediaDevices)
      if (destroyed) {
        return
      }

      microphoneAvailability = nextAvailability
      microphoneCheckPending = false
    }
    const handleDeviceChange = () => {
      void syncMicrophoneAvailability()
    }

    mediaDevices?.addEventListener('devicechange', handleDeviceChange)
    void syncMicrophoneAvailability()

    return () => {
      destroyed = true
      mediaDevices?.removeEventListener('devicechange', handleDeviceChange)
    }
  })

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

    if ((await refreshMicrophoneAvailability()) === 'unavailable') {
      error = null
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
      const noMicrophoneMessage = getNoMicrophoneMessage(cause)
      if (noMicrophoneMessage) {
        microphoneAvailability = 'unavailable'
        error = null
        return
      }

      error = cause instanceof Error ? cause.message : 'Could not start live translation.'
    }
  }

  async function refreshMicrophoneAvailability() {
    microphoneCheckPending = true
    const nextAvailability = await getMicrophoneAvailability()
    microphoneAvailability = nextAvailability
    microphoneCheckPending = false
    return nextAvailability
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

    return `Auto-renew in ${formatTranslationSessionTime(sessionTiming.timeUntilRenewMs)}`
  }

  function statusLabel() {
    if (!running && !starting) {
      if (microphoneUnavailable) {
        return 'No microphone'
      }
      if (microphoneCheckPending) {
        return 'Checking microphone'
      }
    }

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
  <TranslateHeader {selectedLanguageLabel} statusLabel={currentStatusLabel} />

  {#if session.isAnonymous}
    <TranslateAuthGate onSignIn={() => (authDialogOpen = true)} />
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
        <span class="min-w-0">{currentSessionLimitLabel}</span>
        <span class="shrink-0 font-medium">{currentStatusLabel}</span>
      </div>
    {/if}

    <div class="grid gap-3 sm:gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <TranslateSettingsPanel
        bind:targetLanguage
        {translationLanguages}
        {running}
        {starting}
        sessionPending={session.isPending}
        {voiceControlsVisible}
        {voicePlaybackBlocked}
        {translatedVoiceMuted}
        {copied}
        {transcript}
        {error}
        warning={settingsWarning}
        {startDisabled}
        onStart={startSession}
        onStop={stopSession}
        onClearTranscript={clearTranscript}
        onCopyTranscript={copyTranscript}
        onToggleTranslatedVoice={toggleTranslatedVoice}
        onEnableTranslatedVoice={enableTranslatedVoice}
      />

      <TranslateTranscriptPanel
        {transcript}
        {copied}
        {running}
        {starting}
        {selectedLanguageLabel}
        statusLabel={currentStatusLabel}
        onClearTranscript={clearTranscript}
        onCopyTranscript={copyTranscript}
      />
    </div>

    <TranslateMobileControls
      {running}
      {starting}
      sessionPending={session.isPending}
      {voiceControlsVisible}
      {voicePlaybackBlocked}
      {translatedVoiceMuted}
      {selectedLanguageLabel}
      statusLabel={currentStatusLabel}
      translatedVoiceLabel={currentTranslatedVoiceLabel}
      {startDisabled}
      onStart={startSession}
      onStop={stopSession}
      onToggleTranslatedVoice={toggleTranslatedVoice}
      onEnableTranslatedVoice={enableTranslatedVoice}
    />
  {/if}
</section>

<AuthDialog bind:open={authDialogOpen} authConfig={data.authConfig} />
