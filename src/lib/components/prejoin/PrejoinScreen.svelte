<script lang="ts">
  import { onMount, untrack } from 'svelte'
  import AuthDialog from '$lib/components/auth/AuthDialog.svelte'
  import PrejoinDevicePanel from '$lib/components/prejoin/PrejoinDevicePanel.svelte'
  import PrejoinJoinPanel from '$lib/components/prejoin/PrejoinJoinPanel.svelte'
  import PrejoinPreviewCard from '$lib/components/prejoin/PrejoinPreviewCard.svelte'
  import { getUserDisplayName, hasAuthenticatedSession } from '$lib/auth/session-service'
  import { fetchActiveRooms } from '$lib/rooms/client'
  import type { AuthConfig } from '$lib/server/auth-config'
  import { session } from '$lib/stores/session.svelte'
  import { media } from '$lib/stores/media.svelte'
  import { bestEffort } from '$lib/utils'

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
    await bestEffort(media.enumerateDevices())
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
    <PrejoinPreviewCard
      stream={previewStream}
      displayName={resolvedDisplayName}
      cameraOn={media.isCameraOn}
    />

    <PrejoinDevicePanel stream={previewStream} />

    <PrejoinJoinPanel
      bind:anonymousDisplayName
      bind:pendingRoomName
      bind:authDialogOpen
      {isCreateFlow}
      {roomState}
      {joinLabel}
      {isJoinDisabled}
      {isAnonymous}
      {resolvedDisplayName}
      {roomMissingForAnonymous}
      sessionError={session.error}
      sessionPending={session.isPending}
      onJoin={handleJoin}
    />

    <a href="/" class="text-center text-sm text-muted-foreground hover:text-foreground">
      Back to lobby
    </a>
  {/if}

  <AuthDialog bind:open={authDialogOpen} {authConfig} />
</div>
