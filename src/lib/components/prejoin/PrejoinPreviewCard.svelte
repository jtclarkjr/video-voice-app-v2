<script lang="ts">
  import { media } from '$lib/stores/media.svelte'

  let {
    stream = null,
    displayName,
    cameraOn = true
  } = $props<{
    stream?: MediaStream | null
    displayName: string
    cameraOn?: boolean
  }>()

  let videoElement = $state<HTMLVideoElement | null>(null)

  $effect(() => {
    if (videoElement) {
      videoElement.srcObject = stream ?? null
    }
  })
</script>

<div class="relative aspect-video overflow-hidden rounded-xl bg-muted">
  <video
    bind:this={videoElement}
    autoplay
    playsinline
    muted
    class={`h-full w-full object-cover ${cameraOn ? 'scale-x-[-1]' : 'invisible'}`}
  ></video>

  {#if !cameraOn}
    <div class="absolute inset-0 flex items-center justify-center">
      <div
        class="flex h-20 w-20 items-center justify-center rounded-full bg-muted-foreground/20 text-3xl font-semibold text-muted-foreground"
      >
        {(displayName || 'A').charAt(0).toUpperCase()}
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
        cameraOn
          ? 'bg-secondary/80 text-foreground hover:bg-secondary'
          : 'bg-destructive text-destructive-foreground'
      }`}
      aria-label={cameraOn ? 'Turn off camera' : 'Turn on camera'}
    >
      {#if cameraOn}
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
