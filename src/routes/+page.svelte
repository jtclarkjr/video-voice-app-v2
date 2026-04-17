<script lang="ts">
  import { onMount } from 'svelte'
  import { createActiveRoomsEventSource, fetchActiveRooms } from '$lib/rooms/client'
  import { session } from '$lib/stores/session.svelte'
  import type { RoomInfo } from '$lib/rooms/client'

  let rooms = $state<RoomInfo[]>([])
  let isLoading = $state(true)

  onMount(() => {
    let cancelled = false
    let source: EventSource | null = null

    void (async () => {
      try {
        rooms = await fetchActiveRooms()
      } catch {
        rooms = []
      } finally {
        isLoading = false
      }

      if (cancelled) {
        return
      }

      source = await createActiveRoomsEventSource()
      source.onmessage = (event) => {
        rooms = JSON.parse(event.data as string)
        isLoading = false
      }
      source.onerror = () => {
        isLoading = false
      }
    })()

    return () => {
      cancelled = true
      source?.close()
    }
  })
</script>

<section class="grid gap-6">
  <div class="grid gap-4">
    <p class="m-0 text-sm font-bold uppercase tracking-[0.2em] text-primary">Voice &amp; Video</p>
    <h1 class="m-0 text-4xl leading-none font-semibold tracking-tight text-foreground sm:text-5xl">
      Video Call
    </h1>
    <p class="m-0 max-w-3xl text-lg leading-8 text-muted-foreground">
      Join or create a room to start a video call with others.
    </p>
  </div>

  <div class="surface-card p-6">
    <div class="grid gap-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="grid gap-1">
          <h2 class="m-0 text-lg font-semibold">Active Rooms</h2>
          {#if !session.isPending && session.isAnonymous}
            <p class="m-0 text-sm text-muted-foreground">
              Sign in from the header to create a room.
            </p>
          {/if}
        </div>

        {#if !session.isAnonymous}
          <a
            href="/call/new"
            class="inline-flex items-center gap-2 self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-4 w-4 shrink-0"
              aria-hidden="true"
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            Create
          </a>
        {/if}
      </div>

      {#if isLoading}
        <div class="grid gap-2">
          {#each [1, 2, 3] as item}
            <div class="h-14 animate-pulse rounded-xl bg-muted/50"></div>
          {/each}
        </div>
      {:else if rooms.length === 0}
        <div class="rounded-xl border border-dashed border-border/70 px-6 py-10 text-center">
          <p class="m-0 text-sm text-muted-foreground">No active rooms</p>
        </div>
      {:else}
        <div class="grid gap-2">
          {#each rooms as room (room.id)}
            <a
              href={`/call/${encodeURIComponent(room.id)}`}
              class="flex items-center justify-between rounded-xl border border-border/70 bg-card/50 px-4 py-3 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <span class="font-medium">{room.id}</span>
              <span class="flex items-center gap-1.5 text-sm text-muted-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-4 w-4 shrink-0"
                  aria-hidden="true"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                {room.participantCount}
              </span>
            </a>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</section>
