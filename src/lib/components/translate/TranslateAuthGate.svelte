<script lang="ts">
  import { Languages, LogIn } from 'lucide-svelte'

  let { onSignIn } = $props<{
    onSignIn: () => void
  }>()
</script>

<div
  class="surface-card grid min-h-[22rem] place-items-center p-5 text-center sm:min-h-[28rem] sm:p-6"
>
  <div class="grid max-w-md gap-4">
    <div
      class="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary"
    >
      <Languages class="size-7" aria-hidden="true" />
    </div>
    <div class="grid gap-2">
      <h2 class="m-0 text-2xl font-semibold text-foreground">
        Sign In Required
      </h2>
      <p class="m-0 text-sm leading-6 text-muted-foreground">
        Live translation sessions are available to signed-in users.
      </p>
    </div>
    <button
      type="button"
      class="mx-auto inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      onclick={onSignIn}
    >
      <LogIn class="size-4" aria-hidden="true" />
      Sign In
    </button>
  </div>
</div>
