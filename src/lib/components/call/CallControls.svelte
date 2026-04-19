<script lang="ts">
  import {
    ChevronDown,
    Grid2x2,
    LayoutPanelTop,
    MessageCircle,
    Mic,
    MicOff,
    MonitorUp,
    MonitorX,
    PhoneOff,
    Settings,
    Users,
    Video,
    VideoOff
  } from 'lucide-svelte'
  import Popover from '$lib/components/shared/Popover.svelte'
  import VoiceVideoSettingsDialog from '$lib/components/settings/VoiceVideoSettingsDialog.svelte'
  import { chat } from '$lib/stores/chat.svelte'
  import { layout } from '$lib/stores/layout.svelte'
  import { media } from '$lib/stores/media.svelte'
  import { screenShare } from '$lib/stores/screen-share.svelte'
  import { startScreenShare, stopScreenShare } from '$lib/screen-share'

  let { onLeave = () => {} } = $props<{ onLeave?: () => void }>()

  let micPopoverOpen = $state(false)
  let cameraPopoverOpen = $state(false)
  let settingsOpen = $state(false)
  let showInputDevices = $state(false)
  let showOutputDevices = $state(false)
  let showCameraDevices = $state(false)

  function openSettings() {
    micPopoverOpen = false
    cameraPopoverOpen = false
    settingsOpen = true
  }

  function currentInputLabel() {
    return (
      media.audioInputs.find((device) => device.deviceId === media.selectedAudioInput)?.label ??
      'Default'
    )
  }

  function currentOutputLabel() {
    return (
      media.audioOutputs.find((device) => device.deviceId === media.selectedAudioOutput)?.label ??
      'Default'
    )
  }

  function currentCameraLabel() {
    return (
      media.videoInputs.find((device) => device.deviceId === media.selectedVideoInput)?.label ??
      'Default'
    )
  }
</script>

<VoiceVideoSettingsDialog bind:open={settingsOpen} />

<div class="flex items-center justify-center gap-2">
  <div class="flex items-center gap-0.5 rounded-full bg-secondary px-1 py-1">
    <button
      type="button"
      class={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
        media.isMicOn
          ? 'text-muted-foreground hover:bg-accent hover:text-foreground'
          : 'bg-accent text-destructive'
      }`}
      onclick={() => media.toggleMic()}
      aria-label={media.isMicOn ? 'Mute' : 'Unmute'}
    >
      {#if media.isMicOn}
        <Mic class="h-5 w-5" aria-hidden="true" />
      {:else}
        <MicOff class="h-5 w-5" aria-hidden="true" />
      {/if}
    </button>

    <Popover bind:open={micPopoverOpen} align="start">
      {#snippet trigger()}
        <button
          type="button"
          class="flex h-9 w-5 items-center justify-center rounded-r-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          onclick={() => (micPopoverOpen = !micPopoverOpen)}
          aria-label="Audio settings"
        >
          <ChevronDown class="h-3 w-3" aria-hidden="true" />
        </button>
      {/snippet}

      {#snippet children()}
        <div class="grid gap-0.5">
          <button
            type="button"
            class="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent"
            onclick={() => (showInputDevices = !showInputDevices)}
          >
            <div class="grid gap-0">
              <span class="text-sm font-semibold text-foreground">Input Device</span>
              <span class="text-xs text-muted-foreground">{currentInputLabel()}</span>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
          {#if showInputDevices}
            <div class="ml-1 grid gap-0.5 border-l border-border pl-2">
              {#each media.audioInputs as device}
                <button
                  type="button"
                  class={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                    device.deviceId === media.selectedAudioInput
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                  onclick={() => {
                    media.setSelectedAudioInput(device.deviceId)
                    showInputDevices = false
                  }}
                >
                  <span class="truncate">{device.label}</span>
                  {#if device.deviceId === media.selectedAudioInput}
                    <span class="ml-2 text-xs text-[var(--success)]">✓</span>
                  {/if}
                </button>
              {/each}
            </div>
          {/if}

          <button
            type="button"
            class="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent"
            onclick={() => (showOutputDevices = !showOutputDevices)}
          >
            <div class="grid gap-0">
              <span class="text-sm font-semibold text-foreground">Output Device</span>
              <span class="text-xs text-muted-foreground">{currentOutputLabel()}</span>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
          {#if showOutputDevices}
            <div class="ml-1 grid gap-0.5 border-l border-border pl-2">
              {#each media.audioOutputs as device}
                <button
                  type="button"
                  class={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                    device.deviceId === media.selectedAudioOutput
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                  onclick={() => {
                    media.setSelectedAudioOutput(device.deviceId)
                    showOutputDevices = false
                  }}
                >
                  <span class="truncate">{device.label}</span>
                  {#if device.deviceId === media.selectedAudioOutput}
                    <span class="ml-2 text-xs text-[var(--success)]">✓</span>
                  {/if}
                </button>
              {/each}
            </div>
          {/if}

          <div class="my-1.5 h-px bg-border"></div>

          <div class="grid gap-1.5 px-2 py-1">
            <span class="text-xs font-semibold text-foreground">Input Volume</span>
            <input
              type="range"
              min="0"
              max="200"
              value={media.inputVolume}
              oninput={(event) =>
                media.setInputVolume(Number((event.currentTarget as HTMLInputElement).value))}
              class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
            />
          </div>

          <div class="grid gap-1.5 px-2 py-1">
            <span class="text-xs font-semibold text-foreground">Output Volume</span>
            <input
              type="range"
              min="0"
              max="200"
              value={media.outputVolume}
              oninput={(event) =>
                media.setOutputVolume(Number((event.currentTarget as HTMLInputElement).value))}
              class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
            />
          </div>

          <div class="my-1.5 h-px bg-border"></div>

          <button
            type="button"
            class="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent"
            onclick={() => media.toggleDeafen()}
          >
            <span class="text-sm font-semibold text-foreground">Deafen</span>
            <div
              class={`h-4 w-7 rounded-full transition-colors ${media.isDeafened ? 'bg-primary' : 'bg-muted'}`}
            >
              <div
                class={`h-4 w-4 rounded-full border-2 transition-transform ${
                  media.isDeafened
                    ? 'translate-x-3 border-primary bg-white'
                    : 'translate-x-0 border-muted bg-muted-foreground'
                }`}
              ></div>
            </div>
          </button>

          <div class="my-1.5 h-px bg-border"></div>

          <button
            type="button"
            class="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent"
            onclick={openSettings}
          >
            <span class="text-sm font-semibold text-foreground">Voice Settings</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="3" />
              <path
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 8.92 4.6H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c0 .66.39 1.26 1 1.51H21a2 2 0 0 1 0 4h-.09c-.61.25-1 .85-1 1.49Z"
              />
            </svg>
          </button>
        </div>
      {/snippet}
    </Popover>

    <div class="mx-0.5 h-5 w-px bg-border"></div>

    <button
      type="button"
      class={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
        media.isCameraOn
          ? 'text-muted-foreground hover:bg-accent hover:text-foreground'
          : 'bg-accent text-destructive'
      }`}
      onclick={() => media.toggleCamera()}
      aria-label={media.isCameraOn ? 'Turn off camera' : 'Turn on camera'}
    >
      {#if media.isCameraOn}
        <Video class="h-5 w-5" aria-hidden="true" />
      {:else}
        <VideoOff class="h-5 w-5" aria-hidden="true" />
      {/if}
    </button>

    <Popover bind:open={cameraPopoverOpen} align="start">
      {#snippet trigger()}
        <button
          type="button"
          class="flex h-9 w-5 items-center justify-center rounded-r-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          onclick={() => (cameraPopoverOpen = !cameraPopoverOpen)}
          aria-label="Video settings"
        >
          <ChevronDown class="h-3 w-3" aria-hidden="true" />
        </button>
      {/snippet}

      {#snippet children()}
        <div class="grid gap-0.5">
          <button
            type="button"
            class="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent"
            onclick={() => (showCameraDevices = !showCameraDevices)}
          >
            <div class="grid gap-0">
              <span class="text-sm font-semibold text-foreground">Camera</span>
              <span class="text-xs text-muted-foreground">{currentCameraLabel()}</span>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
          {#if showCameraDevices}
            <div class="ml-1 grid gap-0.5 border-l border-border pl-2">
              {#each media.videoInputs as device}
                <button
                  type="button"
                  class={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                    device.deviceId === media.selectedVideoInput
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                  onclick={() => {
                    media.setSelectedVideoInput(device.deviceId)
                    showCameraDevices = false
                  }}
                >
                  <span class="truncate">{device.label}</span>
                  {#if device.deviceId === media.selectedVideoInput}
                    <span class="ml-2 text-xs text-[var(--success)]">✓</span>
                  {/if}
                </button>
              {/each}
            </div>
          {/if}

          <div class="my-1.5 h-px bg-border"></div>

          <button
            type="button"
            class="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent"
          >
            <span class="text-sm font-semibold text-foreground">Preview Camera</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            >
              <path
                d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
              />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>

          <button
            type="button"
            class="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent"
            onclick={openSettings}
          >
            <span class="text-sm font-semibold text-foreground">Video Settings</span>
            <Settings class="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </button>
        </div>
      {/snippet}
    </Popover>
  </div>

  <button
    type="button"
    class={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
      screenShare.localActive
        ? 'bg-accent text-destructive'
        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
    }`}
    onclick={() => void (screenShare.localActive ? stopScreenShare() : startScreenShare())}
    aria-label={screenShare.localActive ? 'Stop sharing' : 'Share screen'}
  >
    {#if screenShare.localActive}
      <MonitorX class="h-5 w-5" aria-hidden="true" />
    {:else}
      <MonitorUp class="h-5 w-5" aria-hidden="true" />
    {/if}
  </button>

  <div class="relative">
    <button
      type="button"
      class={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
        layout.chatOpen
          ? 'bg-accent text-destructive'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      }`}
      onclick={() => layout.toggleChat()}
      aria-label="Toggle chat"
    >
      <MessageCircle class="h-5 w-5" aria-hidden="true" />
    </button>

    {#if chat.unreadCount > 0}
      <span
        class="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground"
      >
        {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
      </span>
    {/if}
  </div>

  <button
    type="button"
    class={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
      layout.rosterOpen
        ? 'bg-accent text-destructive'
        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
    }`}
    onclick={() => layout.toggleRoster()}
    aria-label="Toggle participants"
  >
    <Users class="h-5 w-5" aria-hidden="true" />
  </button>

  <button
    type="button"
    class="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    onclick={() => layout.toggleMode()}
    aria-label={layout.mode === 'gallery' ? 'Speaker view' : 'Gallery view'}
  >
    {#if layout.mode === 'gallery'}
      <LayoutPanelTop class="h-5 w-5" aria-hidden="true" />
    {:else}
      <Grid2x2 class="h-5 w-5" aria-hidden="true" />
    {/if}
  </button>

  <button
    type="button"
    class="flex h-9 items-center justify-center rounded-full bg-destructive px-5 transition-colors hover:bg-destructive/85"
    onclick={onLeave}
    aria-label="Leave call"
  >
    <PhoneOff class="h-5 w-5 text-destructive-foreground" aria-hidden="true" />
  </button>
</div>
