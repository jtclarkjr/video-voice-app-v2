<script lang="ts">
  import Modal from '$lib/components/shared/Modal.svelte'
  import PlatformIcons from '$lib/components/shared/PlatformIcons.svelte'
  import { signInWithEmail, signInWithOAuth, signUpWithEmail } from '$lib/auth/session-service'
  import type { AuthConfig } from '$lib/server/auth-config'

  type AuthMode = 'sign-in' | 'sign-up'

  let { open = $bindable(false), authConfig } = $props<{
    open?: boolean
    authConfig: AuthConfig
  }>()

  let mode = $state<AuthMode>('sign-in')
  let name = $state('')
  let email = $state('')
  let password = $state('')
  let error = $state<string | null>(null)
  let message = $state<string | null>(null)
  let isSubmitting = $state(false)
  let nameInput = $state<HTMLInputElement | null>(null)
  let emailInput = $state<HTMLInputElement | null>(null)
  let passwordInput = $state<HTMLInputElement | null>(null)

  const emailSignUpDisabledMessage = 'Create account via email is currently disabled.'

  const selectSignUpMode = () => {
    if (!authConfig.emailSignUpEnabled) {
      return
    }

    mode = 'sign-up'
  }

  $effect(() => {
    if (!open) {
      mode = 'sign-in'
      name = ''
      email = ''
      password = ''
      error = null
      message = null
      isSubmitting = false
    }
  })

  $effect(() => {
    if (mode === 'sign-up' && !authConfig.emailSignUpEnabled) {
      mode = 'sign-in'
    }
  })

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault()

    if (!authConfig.configured) {
      error = 'Supabase auth is not configured.'
      return
    }

    if (!authConfig.providers.email) {
      error = 'Email authentication is disabled.'
      return
    }

    const trimmedEmail = email.trim()
    const trimmedName = name.trim()

    error = null
    message = null

    if (!trimmedEmail) {
      error = 'Enter your email address.'
      emailInput?.focus()
      return
    }

    if (!password) {
      error = 'Enter your password.'
      passwordInput?.focus()
      return
    }

    if (mode === 'sign-up' && !trimmedName) {
      error = 'Enter your name.'
      nameInput?.focus()
      return
    }

    isSubmitting = true

    try {
      if (mode === 'sign-in') {
        const result = await signInWithEmail(trimmedEmail, password)
        if (result.error) {
          error = result.error.message
          return
        }

        open = false
        return
      }

      if (!authConfig.emailSignUpEnabled) {
        return
      }

      const result = await signUpWithEmail(trimmedEmail, password, trimmedName)
      if (result.error) {
        error = result.error.message
        return
      }

      if (result.data?.session) {
        open = false
        return
      }

      message = 'Account created. Check your email to confirm your sign-in.'
      mode = 'sign-in'
    } finally {
      isSubmitting = false
    }
  }

  async function handleSso(provider: 'github' | 'google' | 'apple') {
    error = null
    message = null
    isSubmitting = true

    try {
      const result = await signInWithOAuth(provider)
      if (result.error) {
        error = result.error.message
      }
    } finally {
      isSubmitting = false
    }
  }

  const showEmail = $derived(authConfig.providers.email)
  const isEmailSignUpDisabled = $derived(showEmail && !authConfig.emailSignUpEnabled)
  const showSso = $derived(
    authConfig.providers.github || authConfig.providers.google || authConfig.providers.apple
  )
</script>

<Modal bind:open title="Sign in" eyebrow="" widthClass="max-w-md">
  {#if !authConfig.configured}
    <p class="text-sm text-muted-foreground">
      Supabase auth is not configured for this environment.
    </p>
  {:else}
    <div class="grid gap-4">
      {#if showSso}
        <div class="grid gap-2">
          {#if authConfig.providers.github}
            <button
              type="button"
              class="flex items-center justify-center gap-2.5 rounded-xl border border-border/80 bg-card/70 px-4 py-3 text-sm font-medium text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
              onclick={() => void handleSso('github')}
              disabled={isSubmitting}
            >
              <PlatformIcons provider="github" size="sm" />
              <span>Continue with GitHub</span>
            </button>
          {/if}
          {#if authConfig.providers.google}
            <button
              type="button"
              class="flex items-center justify-center gap-2.5 rounded-xl border border-border/80 bg-card/70 px-4 py-3 text-sm font-medium text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
              onclick={() => void handleSso('google')}
              disabled={isSubmitting}
            >
              <PlatformIcons provider="google" size="sm" />
              <span>Continue with Google</span>
            </button>
          {/if}
          {#if authConfig.providers.apple}
            <button
              type="button"
              class="flex items-center justify-center gap-2.5 rounded-xl border border-border/80 bg-card/70 px-4 py-3 text-sm font-medium text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
              onclick={() => void handleSso('apple')}
              disabled={isSubmitting}
            >
              <PlatformIcons provider="apple" size="sm" />
              <span>Continue with Apple</span>
            </button>
          {/if}
        </div>
      {/if}

      {#if showSso && showEmail}
        <div class="flex items-center gap-3">
          <div class="h-px flex-1 bg-border/70"></div>
          <span class="text-xs text-muted-foreground">or</span>
          <div class="h-px flex-1 bg-border/70"></div>
        </div>
      {/if}

      {#if showEmail}
        <div class="inline-flex w-fit rounded-full border border-border bg-secondary p-1">
          <button
            type="button"
            class={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === 'sign-in' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            onclick={() => (mode = 'sign-in')}
            aria-pressed={mode === 'sign-in'}
          >
            Sign In
          </button>
          <span class="group relative inline-flex">
            <button
              type="button"
              class={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === 'sign-up' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'} ${isEmailSignUpDisabled ? 'cursor-not-allowed opacity-50' : ''}`}
              aria-disabled={isEmailSignUpDisabled}
              aria-describedby={isEmailSignUpDisabled ? 'email-signup-disabled-tooltip' : undefined}
              aria-pressed={mode === 'sign-up'}
              onclick={selectSignUpMode}
            >
              Create Account
            </button>
            {#if isEmailSignUpDisabled}
              <span
                id="email-signup-disabled-tooltip"
                class="pointer-events-none absolute bottom-[calc(100%+0.5rem)] left-1/2 z-50 hidden w-56 -translate-x-1/2 rounded-lg border border-border bg-popover px-3 py-2 text-left text-xs font-medium text-popover-foreground shadow-lg group-hover:block group-focus-within:block"
                role="tooltip"
              >
                {emailSignUpDisabledMessage}
              </span>
            {/if}
          </span>
        </div>

        <form class="grid gap-3" onsubmit={handleSubmit}>
          {#if mode === 'sign-up'}
            <label class="grid gap-2">
              <span class="text-sm font-medium text-foreground">Name</span>
              <input
                bind:this={nameInput}
                bind:value={name}
                class="rounded-2xl border border-input bg-card px-4 py-3 focus:border-primary"
                placeholder="Jane Doe…"
                name="name"
                autocomplete="name"
                aria-invalid={error === 'Enter your name.'}
                aria-describedby={error === 'Enter your name.' ? 'auth-feedback' : undefined}
              />
            </label>
          {/if}

          <label class="grid gap-2">
            <span class="text-sm font-medium text-foreground">Email</span>
            <input
              bind:this={emailInput}
              bind:value={email}
              class="rounded-2xl border border-input bg-card px-4 py-3 focus:border-primary"
              placeholder="you@example.com"
              name="email"
              autocomplete="email"
              inputmode="email"
              spellcheck="false"
              type="email"
              aria-invalid={error === 'Enter your email address.'}
              aria-describedby={error === 'Enter your email address.' ? 'auth-feedback' : undefined}
            />
          </label>

          <label class="grid gap-2">
            <span class="text-sm font-medium text-foreground">Password</span>
            <input
              bind:this={passwordInput}
              bind:value={password}
              class="rounded-2xl border border-input bg-card px-4 py-3 focus:border-primary"
              placeholder="At least 8 characters…"
              name="password"
              autocomplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
              type="password"
              aria-invalid={error === 'Enter your password.'}
              aria-describedby={error === 'Enter your password.' ? 'auth-feedback' : undefined}
            />
          </label>

          <button
            type="submit"
            class="rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
            disabled={isSubmitting}
          >
            <span>{mode === 'sign-in' ? 'Sign In' : 'Create Account'}</span>
            {#if isSubmitting}
              <span aria-hidden="true">…</span>
              <span class="sr-only">{mode === 'sign-in' ? 'Signing in…' : 'Creating account…'}</span
              >
            {/if}
          </button>
        </form>
      {/if}

      {#if error}
        <p id="auth-feedback" class="text-sm text-destructive" role="alert" aria-live="assertive">
          {error}
        </p>
      {/if}
      {#if message}
        <p class="text-sm text-muted-foreground" role="status" aria-live="polite">{message}</p>
      {/if}
      {#if !showEmail && !showSso}
        <p class="text-sm text-muted-foreground">No interactive sign-in providers are enabled.</p>
      {/if}
    </div>
  {/if}
</Modal>
