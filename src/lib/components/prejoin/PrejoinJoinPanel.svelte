<script lang="ts">
  type RoomState = 'loading' | 'exists' | 'missing' | 'unknown'

  let {
    anonymousDisplayName = $bindable(''),
    pendingRoomName = $bindable(''),
    authDialogOpen = $bindable(false),
    isCreateFlow = false,
    roomState = 'loading',
    joinLabel = 'Join Call',
    isJoinDisabled = false,
    isAnonymous = false,
    resolvedDisplayName = '',
    roomMissingForAnonymous = false,
    sessionError = null,
    sessionPending = false,
    onJoin = () => {}
  } = $props<{
    anonymousDisplayName?: string
    pendingRoomName?: string
    authDialogOpen?: boolean
    isCreateFlow?: boolean
    roomState?: RoomState
    joinLabel?: string
    isJoinDisabled?: boolean
    isAnonymous?: boolean
    resolvedDisplayName?: string
    roomMissingForAnonymous?: boolean
    sessionError?: string | null
    sessionPending?: boolean
    onJoin?: () => void
  }>()
</script>

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

    {#if sessionError}
      <p class="mt-2 text-sm text-destructive">{sessionError}</p>
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
      onclick={onJoin}
    >
      {sessionPending ? 'Preparing Session...' : joinLabel}
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
