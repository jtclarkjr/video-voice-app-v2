<script lang="ts">
  import { ChevronDown, Settings, Video, VideoOff } from 'lucide-svelte'
  import Popover from '$lib/components/shared/Popover.svelte'
  import { media } from '$lib/stores/media.svelte'

  let { settingsOpen = $bindable(false) } = $props<{ settingsOpen?: boolean }>()

  let cameraPopoverOpen = $state(false)
  let showCameraDevices = $state(false)

  function openSettings() {
    cameraPopoverOpen = false
    settingsOpen = true
  }

  function currentCameraLabel() {
    return (
      media.videoInputs.find((device) => device.deviceId === media.selectedVideoInput)?.label ??
      'Default'
    )
  }
</script>

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
