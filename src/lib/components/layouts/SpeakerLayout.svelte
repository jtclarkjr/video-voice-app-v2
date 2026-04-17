<script lang="ts">
  import VideoTile from '$lib/components/layouts/VideoTile.svelte'
  import type { Participant } from '$lib/types/participant'

  let {
    localStream = null,
    participants = {},
    isCameraOn = true,
    localDisplayName = 'You',
    localSpeaking = false,
    activeSpeakerId = null,
    pinnedId = null,
    screenShareStream = null,
    onPin = (_id: string) => {}
  } = $props<{
    localStream?: MediaStream | null
    participants?: Record<string, Participant>
    isCameraOn?: boolean
    localDisplayName?: string
    localSpeaking?: boolean
    activeSpeakerId?: string | null
    pinnedId?: string | null
    screenShareStream?: MediaStream | null
    onPin?: (id: string) => void
  }>()

  const remoteParticipants = $derived(Object.values(participants) as Participant[])
  const mainId = $derived(pinnedId ?? activeSpeakerId ?? remoteParticipants[0]?.id ?? null)
  const mainParticipant = $derived(mainId ? participants[mainId] : null)
  const showScreenShare = $derived(!!screenShareStream)
  const stripParticipants = $derived(
    showScreenShare
      ? remoteParticipants
      : remoteParticipants.filter((participant) => participant.id !== mainId)
  )
</script>

<div class="min-w-0 grid gap-3">
  <div data-primary-call-frame>
    <VideoTile
      stream={showScreenShare ? screenShareStream : (mainParticipant?.stream ?? null)}
      label={showScreenShare
        ? `${mainParticipant?.displayName ?? 'Screen'} screen`
        : (mainParticipant?.displayName ?? 'Waiting')}
      cameraOff={showScreenShare ? false : !mainParticipant?.videoEnabled}
      isSpeaking={mainParticipant?.isSpeaking}
      networkQuality={mainParticipant?.networkQuality}
      className="min-h-[26rem]"
    />
  </div>

  <div class="min-w-0 flex gap-3 overflow-x-auto pb-1">
    <VideoTile
      stream={localStream}
      label={localDisplayName}
      muted
      mirrored
      cameraOff={!isCameraOn}
      isSpeaking={localSpeaking}
      className="h-32 w-40 shrink-0"
    />
    {#each stripParticipants as participant (participant.id)}
      <VideoTile
        stream={participant.stream}
        label={participant.displayName}
        cameraOff={!participant.videoEnabled}
        isSpeaking={participant.isSpeaking}
        networkQuality={participant.networkQuality}
        isPinned={pinnedId === participant.id}
        onPin={() => onPin(participant.id)}
        className="h-32 w-40 shrink-0"
      />
    {/each}
  </div>
</div>
