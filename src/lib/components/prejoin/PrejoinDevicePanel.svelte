<script lang="ts">
  import MicLevelMeter from '$lib/components/prejoin/MicLevelMeter.svelte'
  import { media } from '$lib/stores/media.svelte'

  let { stream = null } = $props<{ stream?: MediaStream | null }>()
</script>

{#if stream && media.isMicOn}
  <MicLevelMeter {stream} />
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
