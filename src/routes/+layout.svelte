<script lang="ts">
  import '../app.css'
  import favicon from '$lib/assets/favicon.svg'
  import { onMount } from 'svelte'
  import AuthControls from '$lib/components/auth/AuthControls.svelte'
  import { session } from '$lib/stores/session.svelte'
  import { theme } from '$lib/stores/theme.svelte'
  import type { AuthConfig } from '$lib/server/auth-config'

  let { children, data } = $props<{
    children: () => unknown
    data: {
      authConfig: AuthConfig
    }
  }>()

  onMount(() => {
    void session.init()
    return theme.init()
  })
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <title>Video Voice</title>
</svelte:head>

<div class="min-h-screen">
  <header class="relative z-20 border-b border-border/70 bg-background/85 backdrop-blur">
    <div class="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
      <nav class="flex min-w-0 items-center gap-3 text-sm font-bold tracking-[0.02em] text-foreground sm:gap-4">
        <a href="/">Home</a>
        <a href="/translate">Translate</a>
      </nav>
      <AuthControls authConfig={data.authConfig} />
    </div>
  </header>

  <main class="px-3 py-6 sm:px-6 sm:py-14">
    <div class="mx-auto w-full max-w-5xl">
      {@render children()}
    </div>
  </main>
</div>
