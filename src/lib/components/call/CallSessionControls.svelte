<script lang="ts">
  import {
    Grid2x2,
    LayoutPanelTop,
    MessageCircle,
    MonitorUp,
    MonitorX,
    PhoneOff,
    Users
  } from 'lucide-svelte'
  import { startScreenShare, stopScreenShare } from '$lib/screen-share'
  import { chat } from '$lib/stores/chat.svelte'
  import { layout } from '$lib/stores/layout.svelte'
  import { screenShare } from '$lib/stores/screen-share.svelte'

  let { onLeave = () => {} } = $props<{ onLeave?: () => void }>()
</script>

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
