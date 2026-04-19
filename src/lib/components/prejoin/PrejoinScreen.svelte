<script lang="ts">
  import { onMount, untrack } from 'svelte'
  import AuthDialog from '$lib/components/auth/AuthDialog.svelte'
  import MicLevelMeter from '$lib/components/prejoin/MicLevelMeter.svelte'
  import { getUserDisplayName, hasAuthenticatedSession } from '$lib/auth/session-service'
  import { fetchActiveRooms } from '$lib/rooms/client'
  import type { AuthConfig } from '$lib/server/auth-config'
  import { session } from '$lib/stores/session.svelte'
  import { media } from '$lib/stores/media.svelte'

  const ACCESS_ERROR_MESSAGE = 'Could not access camera/microphone. Please check permissions.'

  let {
    authConfig,
    roomId,
    isCreateFlow = false,
    onJoin = (_displayName: string, _roomId?: string) => {}
  } = $props<{
    authConfig: AuthConfig
    roomId: string
    isCreateFlow?: boolean
    onJoin?: (displayName: string, roomId?: string) => void
  }>()

  type RoomState = 'loading' | 'exists' | 'missing' | 'unknown'

  let anonymousDisplayName = $state('')
  let pendingRoomName = $state('')
  let previewStream = $state<MediaStream | null>(null)
  let previewVideo = $state<HTMLVideoElement | null>(null)
  let permissionError = $state<string | null>(null)
  let needsGesture = $state(false)
  let roomState = $state<RoomState>(untrack(() => isCreateFlow) ? 'missing' : 'loading')
  let authDialogOpen = $state(false)
  let isMounted = false
  let previewRequestToken = 0

  const isAnonymous = $derived(session.isAnonymous)
  const resolvedDisplayName = $derived.by(() => {
    const fallback = getUserDisplayName(session.data?.user ?? null)
    return session.isAnonymous ? anonymousDisplayName.trim() || fallback : fallback
  })

  $effect(() => {
    if (previewVideo) {
      previewVideo.srcObject = previewStream
    }
  })

  $effect(() => {
    if (!previewStream) {
      return
    }

    for (const track of previewStream.getAudioTracks()) {
      track.enabled = media.isMicOn
    }
    for (const track of previewStream.getVideoTracks()) {
      track.enabled = media.isCameraOn
    }
  })

  $effect(() => {
    if (session.isPending) {
      return
    }

    if (!session.isAnonymous) {
      anonymousDisplayName = ''
    }
  })

  function isPermissionDenied(error: unknown) {
    return (
      error instanceof DOMException &&
      (error.name === 'NotAllowedError' || error.name === 'SecurityError')
    )
  }

  async function syncDevices() {
    try {
      await media.enumerateDevices()
    } catch {
      // Ignore device enumeration failures and keep the current UI state.
    }
  }

  function hasLiveTrack(kind: 'audio' | 'video') {
    if (!previewStream) {
      return false
    }

    const tracks =
      kind === 'audio' ? previewStream.getAudioTracks() : previewStream.getVideoTracks()

    return tracks.some((track) => track.readyState === 'live')
  }

  function shouldReconnectPreview() {
    if (permissionError || !previewStream) {
      return true
    }

    return !hasLiveTrack('audio') || !hasLiveTrack('video')
  }

  async function refreshPreview() {
    const requestToken = ++previewRequestToken

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      if (!isMounted || requestToken !== previewRequestToken) {
        for (const track of stream.getTracks()) {
          track.stop()
        }
        return
      }

      stopPreview()
      previewStream = stream
      needsGesture = false
      permissionError = null
      await syncDevices()
    } catch (error) {
      if (!isMounted || requestToken !== previewRequestToken) {
        return
      }

      stopPreview()
      await syncDevices()

      if (isPermissionDenied(error)) {
        needsGesture = true
        permissionError = null
        return
      }

      needsGesture = false
      permissionError = ACCESS_ERROR_MESSAGE
    }
  }

  onMount(() => {
    isMounted = true

    const handleDeviceChange = async () => {
      await syncDevices()

      if (shouldReconnectPreview()) {
        await refreshPreview()
      }
    }

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange)
    void refreshPreview()

    if (!isCreateFlow) {
      void (async () => {
        try {
          const rooms = await fetchActiveRooms()
          if (isMounted) {
            roomState = rooms.some((room) => room.id === roomId) ? 'exists' : 'missing'
          }
        } catch {
          if (isMounted) {
            roomState = 'unknown'
          }
        }
      })()
    }

    return () => {
      isMounted = false
      previewRequestToken += 1
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange)
      stopPreview()
    }
  })

  function stopPreview() {
    if (!previewStream) {
      return
    }

    for (const track of previewStream.getTracks()) {
      track.stop()
    }
    previewStream = null
  }

  function generateRoomId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }

    return `room-${Math.random().toString(36).slice(2, 10)}`
  }

  async function requestPermissions() {
    await refreshPreview()
  }

  function handleJoin() {
    if (session.isPending) {
      return
    }

    const nextRoomId = isCreateFlow ? pendingRoomName.trim() || generateRoomId() : roomId
    if (!nextRoomId) {
      return
    }

    if (
      (isCreateFlow && isAnonymous) ||
      (roomState === 'missing' &&
        !isCreateFlow &&
        !hasAuthenticatedSession(session.data?.session ?? null))
    ) {
      authDialogOpen = true
      return
    }

    stopPreview()
    onJoin(resolvedDisplayName, nextRoomId)
  }

  const roomMissingForAnonymous = $derived((roomState === 'missing' || isCreateFlow) && isAnonymous)
  const isJoinDisabled = $derived(
    session.isPending ||
      (isAnonymous && anonymousDisplayName.trim() === '') ||
      (!isCreateFlow && roomState === 'loading') ||
      Boolean(session.error)
  )
  const joinLabel = $derived.by(() => {
    if (isCreateFlow) {
      return 'Create and Join Call'
    }
    if (roomState === 'loading') {
      return 'Checking Room...'
    }
    if (roomState === 'missing' && !isAnonymous) {
      return 'Create and Join Call'
    }
    return 'Join Call'
  })
</script>

<div class="mx-auto grid max-w-2xl gap-6 py-8">
  <div class="text-center">
    <h1 class="text-2xl font-bold text-foreground">
      {isCreateFlow ? 'Create Room' : 'Join Room'}
    </h1>
    <p class="mt-1 text-sm text-muted-foreground">
      {isCreateFlow ? 'Pick your room name before you join.' : roomId}
    </p>
  </div>

  {#if needsGesture}
    <div class="rounded-xl border border-border/30 bg-muted/50 px-6 py-10 text-center">
      <p class="text-sm text-muted-foreground">
        Your browser needs permission to use the camera and microphone.
      </p>
      <button
        type="button"
        class="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        onclick={() => void requestPermissions()}
      >
        Allow Camera &amp; Microphone
      </button>
    </div>
  {:else if permissionError}
    <div class="rounded-xl border border-destructive/30 bg-destructive/10 px-6 py-10 text-center">
      <p class="text-sm text-destructive">{permissionError}</p>
      <a href="/" class="mt-4 inline-block text-sm text-primary underline">Back to lobby</a>
    </div>
  {:else}
    <div class="relative aspect-video overflow-hidden rounded-xl bg-muted">
      <video
        bind:this={previewVideo}
        autoplay
        playsinline
        muted
        class={`h-full w-full object-cover ${media.isCameraOn ? 'scale-x-[-1]' : 'invisible'}`}
      ></video>

      {#if !media.isCameraOn}
        <div class="absolute inset-0 flex items-center justify-center">
          <div
            class="flex h-20 w-20 items-center justify-center rounded-full bg-muted-foreground/20 text-3xl font-semibold text-muted-foreground"
          >
            {(resolvedDisplayName || 'A').charAt(0).toUpperCase()}
          </div>
        </div>
      {/if}

      <div class="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        <button
          type="button"
          onclick={() => media.toggleMic()}
          class={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
            media.isMicOn
              ? 'bg-secondary/80 text-foreground hover:bg-secondary'
              : 'bg-destructive text-destructive-foreground'
          }`}
          aria-label={media.isMicOn ? 'Mute' : 'Unmute'}
        >
          {#if media.isMicOn}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          {:else}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-5 w-5"
              aria-hidden="true"
            >
              <line x1="2" x2="22" y1="2" y2="22" />
              <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
              <path d="M5 10v2a7 7 0 0 0 12 5.29" />
              <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          {/if}
        </button>
        <button
          type="button"
          onclick={() => media.toggleCamera()}
          class={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
            media.isCameraOn
              ? 'bg-secondary/80 text-foreground hover:bg-secondary'
              : 'bg-destructive text-destructive-foreground'
          }`}
          aria-label={media.isCameraOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {#if media.isCameraOn}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-5 w-5"
              aria-hidden="true"
            >
              <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
              <rect x="2" y="6" width="14" height="12" rx="2" />
            </svg>
          {:else}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M10.66 6H14a2 2 0 0 1 2 2v2.5l5.248-3.062A.5.5 0 0 1 22 7.87v8.196" />
              <path d="M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2" />
              <line x1="2" x2="22" y1="2" y2="22" />
            </svg>
          {/if}
        </button>
      </div>
    </div>

    {#if previewStream && media.isMicOn}
      <MicLevelMeter stream={previewStream} />
    {/if}

    <div class="grid gap-4">
      {#if media.audioInputs.length > 0}
        <label class="grid gap-2">
          <span class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Microphone
          </span>
          <select
            class="w-full rounded-xl border border-border/70 bg-card/60 px-4 py-3 outline-none"
            value={media.selectedAudioInput}
            onchange={(event) =>
              media.setSelectedAudioInput((event.currentTarget as HTMLSelectElement).value)}
          >
            {#each media.audioInputs as device}
              <option value={device.deviceId}>{device.label}</option>
            {/each}
          </select>
        </label>
      {/if}

      {#if media.audioOutputs.length > 0}
        <label class="grid gap-2">
          <span class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Speaker
          </span>
          <select
            class="w-full rounded-xl border border-border/70 bg-card/60 px-4 py-3 outline-none"
            value={media.selectedAudioOutput}
            onchange={(event) =>
              media.setSelectedAudioOutput((event.currentTarget as HTMLSelectElement).value)}
          >
            {#each media.audioOutputs as device}
              <option value={device.deviceId}>{device.label}</option>
            {/each}
          </select>
        </label>
      {/if}

      {#if media.videoInputs.length > 0}
        <label class="grid gap-2">
          <span class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Camera
          </span>
          <select
            class="w-full rounded-xl border border-border/70 bg-card/60 px-4 py-3 outline-none"
            value={media.selectedVideoInput}
            onchange={(event) =>
              media.setSelectedVideoInput((event.currentTarget as HTMLSelectElement).value)}
          >
            {#each media.videoInputs as device}
              <option value={device.deviceId}>{device.label}</option>
            {/each}
          </select>
        </label>
      {/if}
    </div>

    <div class="grid gap-3">
      {#if isCreateFlow}
        <div class="rounded-2xl border border-border/70 bg-card/60 px-4 py-3">
          <label
            for="prejoin-room-name"
            class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
          >
            Room name (optional)
          </label>
          <input
            id="prejoin-room-name"
            bind:value={pendingRoomName}
            placeholder="Leave blank to auto-generate"
            class="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-primary"
          />
          <p class="mt-2 text-sm text-muted-foreground">
            If you leave this empty, a unique room id will be generated for you.
          </p>
        </div>
      {/if}

      <div class="rounded-2xl border border-border/70 bg-card/60 px-4 py-3">
        <p class="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Joining as
        </p>
        {#if isAnonymous}
          <div class="mt-3 grid gap-2">
            <label for="anonymous-display-name" class="text-sm font-medium text-foreground">
              Display name
            </label>
            <input
              id="anonymous-display-name"
              bind:value={anonymousDisplayName}
              placeholder="Enter your name"
              maxlength="40"
              class="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-primary"
            />
            <p class="m-0 text-sm text-muted-foreground">Add a display name to join the call.</p>
          </div>
        {:else}
          <p class="mt-1 text-base font-medium text-foreground">{resolvedDisplayName}</p>
        {/if}

        {#if session.error}
          <p class="mt-2 text-sm text-destructive">{session.error}</p>
        {:else if roomMissingForAnonymous}
          <p class="mt-2 text-sm text-muted-foreground">
            Sign in to create a new room. Guests can join existing rooms.
          </p>
        {:else if roomState === 'unknown'}
          <p class="mt-2 text-sm text-muted-foreground">
            Room availability will be verified when you join.
          </p>
        {/if}
      </div>

      <div class="grid gap-2">
        <button
          type="button"
          class="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          disabled={isJoinDisabled}
          onclick={handleJoin}
        >
          {session.isPending ? 'Preparing Session...' : joinLabel}
        </button>

        {#if roomMissingForAnonymous}
          <button
            type="button"
            class="inline-flex w-full items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            onclick={() => (authDialogOpen = true)}
          >
            Sign In to Create Room
          </button>
        {/if}
      </div>
    </div>

    <a href="/" class="text-center text-sm text-muted-foreground hover:text-foreground">
      Back to lobby
    </a>
  {/if}

  <AuthDialog bind:open={authDialogOpen} {authConfig} />
</div>
