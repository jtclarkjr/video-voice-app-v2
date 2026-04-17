<script lang="ts">
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'
  import { tick } from 'svelte'
  import CallControls from '$lib/components/call/CallControls.svelte'
  import LayoutContainer from '$lib/components/layouts/LayoutContainer.svelte'
  import ChatPanel from '$lib/components/other/ChatPanel.svelte'
  import ConnectionBanner from '$lib/components/other/ConnectionBanner.svelte'
  import ParticipantRoster from '$lib/components/other/ParticipantRoster.svelte'
  import { audioLevels } from '$lib/audio-levels.svelte'
  import { startQualityMonitor, stopQualityMonitor } from '$lib/quality-monitor'
  import { connect, disconnect, sendMediaState } from '$lib/signaling/connection'
  import { participants } from '$lib/stores/participants.svelte'
  import { chat } from '$lib/stores/chat.svelte'
  import { connection } from '$lib/stores/connection.svelte'
  import { layout } from '$lib/stores/layout.svelte'
  import { media } from '$lib/stores/media.svelte'
  import { screenShare } from '$lib/stores/screen-share.svelte'
  import { closeAll, closePeerConnection } from '$lib/webrtc/cleanup'
  import {
    createOffer,
    handleAnswer,
    handleIceCandidate,
    handleOffer
  } from '$lib/webrtc/negotiation'
  import { markPeerScreenSharing } from '$lib/webrtc/screen-share-tracks'
  import {
    acquireUserMedia,
    getLocalStream,
    getUserMedia,
    replaceLocalTracks,
    streamHasLiveTrack
  } from '$lib/webrtc/shared'
  import type { SignalHandlers } from '$lib/signaling/types'

  let {
    roomId,
    displayName = 'Guest',
    initialMicOn = true,
    initialCameraOn = true
  } = $props<{
    roomId: string
    displayName?: string
    initialMicOn?: boolean
    initialCameraOn?: boolean
  }>()

  let error = $state<string | null>(null)
  let layoutHost = $state<HTMLDivElement | null>(null)
  let sidePanelHeight = $state<number | null>(null)
  let isMounted = false
  let reconnectAttemptToken = 0

  function logMediaError(context: string, cause: unknown) {
    console.warn(`[call-room] ${context}`, cause)
  }

  function shouldReconnectLocalMedia() {
    const stream = getLocalStream()
    if (!stream) {
      return true
    }

    return !streamHasLiveTrack(stream, 'audio') || !streamHasLiveTrack(stream, 'video')
  }

  onMount(() => {
    let destroyed = false
    isMounted = true

    const handleDeviceChange = async () => {
      await media.enumerateDevices()

      if (!shouldReconnectLocalMedia()) {
        return
      }

      const attemptToken = ++reconnectAttemptToken

      try {
        const stream = await acquireUserMedia()
        if (!isMounted || destroyed || attemptToken !== reconnectAttemptToken) {
          for (const track of stream.getTracks()) {
            track.stop()
          }
          return
        }

        await replaceLocalTracks(stream)
        media.setLocalStream(stream)
      } catch (cause) {
        logMediaError('Failed to recover local media after device change.', cause)
      }
    }

    const init = async () => {
      connection.setPhase('connecting')
      media.setMicEnabled(initialMicOn)
      media.setCameraEnabled(initialCameraOn)

      try {
        const stream = await getUserMedia()
        media.setLocalStream(stream)
        await media.enumerateDevices()
      } catch (cause) {
        logMediaError('Failed to acquire initial local media.', cause)
        error = 'Could not access camera or microphone. Please check permissions.'
        return
      }

      if (destroyed) {
        return
      }

      const handlers: SignalHandlers = {
        onJoined(userId, joinedRoomId, peers) {
          connection.setConnected(userId, joinedRoomId)
          audioLevels.start(userId)
          startQualityMonitor()

          for (const peer of peers) {
            participants.add(peer.id, peer.displayName)
            participants.setMediaState(peer.id, {
              audioEnabled: peer.audioEnabled,
              videoEnabled: peer.videoEnabled
            })
            void createOffer(peer.id)
          }
        },
        onPeerJoined(peerId, peerDisplayName, audioEnabled, videoEnabled) {
          participants.add(peerId, peerDisplayName)
          participants.setMediaState(peerId, { audioEnabled, videoEnabled })
        },
        onPeerMediaState(peerId, audioEnabled, videoEnabled) {
          participants.setMediaState(peerId, { audioEnabled, videoEnabled })
        },
        onPeerLeft(peerId) {
          closePeerConnection(peerId)
          participants.remove(peerId)
          audioLevels.untrack(peerId)
        },
        onOffer(fromId, sdp) {
          void handleOffer(fromId, sdp)
        },
        onAnswer(fromId, sdp) {
          void handleAnswer(fromId, sdp)
        },
        onIceCandidate(fromId, candidate) {
          void handleIceCandidate(fromId, candidate)
        },
        onScreenShareStart(peerId) {
          markPeerScreenSharing(peerId, true)
          participants.setScreenSharing(peerId, true)
        },
        onScreenShareStop(peerId) {
          markPeerScreenSharing(peerId, false)
          participants.setScreenSharing(peerId, false)
        },
        onError(message) {
          error = message
        },
        onReconnected() {
          connection.setPhase('connected')
        }
      }

      connect(roomId, displayName, handlers)
    }

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange)
    void init()

    return () => {
      destroyed = true
      isMounted = false
      reconnectAttemptToken += 1
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange)
      disconnect()
      closeAll()
      audioLevels.stop()
      stopQualityMonitor()
      connection.setDisconnected()
      media.reset()
      participants.clear()
      layout.reset()
      chat.reset()
      screenShare.reset()
      chat.clearUnread()
    }
  })

  $effect(() => {
    if (connection.phase === 'connected') {
      sendMediaState(media.isMicOn, media.isCameraOn)
    }
  })

  $effect(() => {
    if (media.localStream && connection.userId) {
      audioLevels.track(connection.userId, media.localStream)
    }
  })

  $effect(() => {
    for (const [id, participant] of Object.entries(participants.byId)) {
      if (participant.stream) {
        audioLevels.track(id, participant.stream)
      }
    }
  })

  function handleLeave() {
    disconnect()
    closeAll()
    audioLevels.stop()
    stopQualityMonitor()
    connection.setDisconnected()
    media.reset()
    participants.clear()
    layout.reset()
    chat.reset()
    screenShare.reset()
    void goto('/')
  }

  $effect(() => {
    const panelDeps = {
      mode: layout.mode,
      chatOpen: layout.chatOpen,
      rosterOpen: layout.rosterOpen,
      screenShareActive: screenShare.localActive,
      participantCount: Object.keys(participants.byId).length,
      localStream: media.localStream
    }
    void panelDeps

    let observer: ResizeObserver | null = null
    let cancelled = false

    void tick().then(() => {
      if (cancelled || !layoutHost) {
        return
      }

      const primaryFrame = layoutHost.querySelector(
        '[data-primary-call-frame]'
      ) as HTMLElement | null
      if (!primaryFrame) {
        sidePanelHeight = null
        return
      }

      const syncHeight = () => {
        sidePanelHeight = primaryFrame.getBoundingClientRect().height
      }

      syncHeight()
      observer = new ResizeObserver(syncHeight)
      observer.observe(primaryFrame)
    })

    return () => {
      cancelled = true
      observer?.disconnect()
    }
  })
</script>

{#if error}
  <div class="flex min-h-[60vh] items-center justify-center">
    <div class="grid gap-4">
      <p class="text-lg text-destructive">{error}</p>
      <a href="/" class="text-sm text-primary underline">Back to lobby</a>
    </div>
  </div>
{:else}
  <div class="grid gap-4">
    <ConnectionBanner />

    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-foreground">Room: {roomId}</h2>
      <span class="text-sm text-muted-foreground">
        {Object.keys(participants.byId).length + 1} participant{Object.keys(participants.byId)
          .length === 0
          ? ''
          : 's'}
      </span>
    </div>

    <div class="flex items-start gap-4">
      <div bind:this={layoutHost} class="min-w-0 flex-1">
        <LayoutContainer
          localStream={media.localStream}
          participants={participants.byId}
          isCameraOn={media.isCameraOn}
          localDisplayName={displayName}
          localSpeaking={audioLevels.localSpeaking}
        />
      </div>

      {#if layout.chatOpen}
        <div
          class="w-80 shrink-0 self-start overflow-hidden"
          style:height={sidePanelHeight ? `${sidePanelHeight}px` : undefined}
        >
          <ChatPanel />
        </div>
      {:else if layout.rosterOpen}
        <div
          class="w-80 shrink-0 self-start overflow-hidden"
          style:height={sidePanelHeight ? `${sidePanelHeight}px` : undefined}
        >
          <ParticipantRoster localDisplayName={displayName} />
        </div>
      {/if}
    </div>

    <CallControls onLeave={handleLeave} />
  </div>
{/if}
