<script lang="ts">
  import AuthDialog from '$lib/components/auth/AuthDialog.svelte'
  import { getUserDisplayName, signOut } from '$lib/auth/session-service'
  import type { AuthConfig } from '$lib/server/auth-config'
  import { session } from '$lib/stores/session.svelte'
  import { theme, type Theme } from '$lib/stores/theme.svelte'
  import Popover from '$lib/components/shared/Popover.svelte'

  let { authConfig } = $props<{ authConfig: AuthConfig }>()

  let authDialogOpen = $state(false)
  let popoverOpen = $state(false)

  const themeOptions: Theme[] = ['light', 'dark', 'system']

  function setTheme(nextTheme: Theme) {
    theme.set(nextTheme)
  }

  function displayName() {
    return getUserDisplayName(session.data?.user ?? null)
  }

  function avatarUrl() {
    const user = session.data?.user
    const metadata = user?.user_metadata
    if (!metadata || typeof metadata !== 'object') {
      return null
    }

    const maybeUrl = (metadata as Record<string, unknown>).avatar_url
    return typeof maybeUrl === 'string' ? maybeUrl : null
  }

  function labelFor(option: Theme) {
    return `${option.charAt(0).toUpperCase()}${option.slice(1)}`
  }
</script>

<Popover open={popoverOpen} onOpenChange={(nextOpen) => (popoverOpen = nextOpen)} align="end">
  {#snippet trigger()}
    <button
      type="button"
      class="flex size-10 items-center justify-center rounded-full border border-border/70 bg-card/80 shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
      aria-label={session.isAnonymous ? 'Open account menu' : `${displayName()} account menu`}
      onclick={() => (popoverOpen = !popoverOpen)}
    >
      {#if !session.isAnonymous && avatarUrl()}
        <img
          src={avatarUrl() ?? undefined}
          alt={displayName()}
          class="size-full rounded-full object-cover"
        />
      {:else if session.isAnonymous}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="size-5 text-muted-foreground"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="10" r="3" />
          <path d="M7 18.2a6.2 6.2 0 0 1 10 0" />
        </svg>
      {:else}
        <div
          class="flex size-full items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
        >
          {displayName().charAt(0).toUpperCase() || 'U'}
        </div>
      {/if}
    </button>
  {/snippet}

  {#snippet children()}
    <div class="grid gap-4">
      <div class="grid gap-1">
        <p class="m-0 text-sm font-medium text-foreground">
          {session.isAnonymous ? 'Guest mode' : displayName()}
        </p>
        <p class="m-0 text-xs text-muted-foreground">
          {session.isAnonymous
            ? 'Sign in to create rooms and use your account profile.'
            : (session.data?.user?.email ?? 'Signed in')}
        </p>
      </div>

      <div class="grid gap-2">
        <p class="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Theme
        </p>
        <div
          class="inline-flex w-fit items-center gap-1 rounded-full border border-border/70 bg-card/80 p-1"
        >
          {#each themeOptions as option}
            <button
              type="button"
              class={`flex h-8 w-8 items-center justify-center rounded-full p-0 transition ${
                theme.current === option
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
              onclick={() => setTheme(option)}
              aria-label={`Use ${option} theme`}
              aria-pressed={theme.current === option}
              title={labelFor(option)}
            >
              {#if option === 'light'}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="size-4"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="m4.93 4.93 1.41 1.41" />
                  <path d="m17.66 17.66 1.41 1.41" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="m6.34 17.66-1.41 1.41" />
                  <path d="m19.07 4.93-1.41 1.41" />
                </svg>
              {:else if option === 'dark'}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="size-4"
                  aria-hidden="true"
                >
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
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
                  class="size-4"
                  aria-hidden="true"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" x2="16" y1="21" y2="21" />
                  <line x1="12" x2="12" y1="17" y2="21" />
                </svg>
              {/if}
            </button>
          {/each}
        </div>
      </div>

      <div class="h-px bg-border/70"></div>

      {#if session.isAnonymous}
        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          onclick={() => {
            popoverOpen = false
            authDialogOpen = true
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="size-4"
            aria-hidden="true"
          >
            <path d="M15 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" />
            <path d="M10 17l5-5-5-5" />
            <path d="M15 12H4" />
          </svg>
          Sign In
        </button>
      {:else}
        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          onclick={() => {
            popoverOpen = false
            void signOut()
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="size-4"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
          Sign Out
        </button>
      {/if}
    </div>
  {/snippet}
</Popover>

<AuthDialog open={authDialogOpen} {authConfig} onClose={() => (authDialogOpen = false)} />
