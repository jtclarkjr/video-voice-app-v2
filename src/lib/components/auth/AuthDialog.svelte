<script lang="ts">
	import Modal from '$lib/components/shared/Modal.svelte';
	import { signInWithEmail, signInWithOAuth, signUpWithEmail } from '$lib/auth/session-service';
	import type { AuthConfig } from '$lib/server/auth-config';

	type AuthMode = 'sign-in' | 'sign-up';

	let {
		open = false,
		authConfig,
		onClose = () => {}
	} = $props<{
		open?: boolean;
		authConfig: AuthConfig;
		onClose?: () => void;
	}>();

	let mode = $state<AuthMode>('sign-in');
	let name = $state('');
	let email = $state('');
	let password = $state('');
	let error = $state<string | null>(null);
	let message = $state<string | null>(null);
	let isSubmitting = $state(false);

	$effect(() => {
		if (!open) {
			mode = 'sign-in';
			name = '';
			email = '';
			password = '';
			error = null;
			message = null;
			isSubmitting = false;
		}
	});

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		if (!authConfig.configured) {
			error = 'Supabase auth is not configured.';
			return;
		}

		if (!authConfig.providers.email) {
			error = 'Email authentication is disabled.';
			return;
		}

		error = null;
		message = null;
		isSubmitting = true;

		try {
			if (mode === 'sign-in') {
				const result = await signInWithEmail(email.trim(), password);
				if (result.error) {
					error = result.error.message;
					return;
				}

				onClose();
				return;
			}

			const result = await signUpWithEmail(email.trim(), password, name.trim());
			if (result.error) {
				error = result.error.message;
				return;
			}

			if (result.data?.session) {
				onClose();
				return;
			}

			message = 'Account created. Check your email to confirm your sign-in.';
			mode = 'sign-in';
		} finally {
			isSubmitting = false;
		}
	}

	async function handleSso(provider: 'github' | 'google' | 'apple') {
		error = null;
		message = null;
		isSubmitting = true;

		try {
			const result = await signInWithOAuth(provider);
			if (result.error) {
				error = result.error.message;
			}
		} finally {
			isSubmitting = false;
		}
	}

	const showEmail = $derived(authConfig.providers.email);
	const showSso = $derived(
		authConfig.providers.github || authConfig.providers.google || authConfig.providers.apple
	);
</script>

<Modal open={open} onClose={onClose} title="Access Control" widthClass="max-w-md">
	{#if !authConfig.configured}
		<p class="text-sm text-muted-foreground">
			Supabase auth is not configured for this environment.
		</p>
	{:else}
		<div class="grid gap-4">
			{#if showSso}
				<div class="grid gap-2">
					{#if authConfig.providers.github}
						<button class="rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold transition hover:bg-secondary" onclick={() => void handleSso('github')} disabled={isSubmitting}>
							Continue with GitHub
						</button>
					{/if}
					{#if authConfig.providers.google}
						<button class="rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold transition hover:bg-secondary" onclick={() => void handleSso('google')} disabled={isSubmitting}>
							Continue with Google
						</button>
					{/if}
					{#if authConfig.providers.apple}
						<button class="rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold transition hover:bg-secondary" onclick={() => void handleSso('apple')} disabled={isSubmitting}>
							Continue with Apple
						</button>
					{/if}
				</div>
			{/if}

			{#if showSso && showEmail}
				<div class="flex items-center gap-3">
					<div class="h-px flex-1 bg-border"></div>
					<span class="text-xs uppercase tracking-[0.2em] text-muted-foreground">or</span>
					<div class="h-px flex-1 bg-border"></div>
				</div>
			{/if}

			{#if showEmail}
				<div class="inline-flex w-fit rounded-full border border-border bg-secondary p-1">
					<button
						type="button"
						class={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === 'sign-in' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
						onclick={() => (mode = 'sign-in')}
					>
						Sign In
					</button>
					<button
						type="button"
						class={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === 'sign-up' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
						onclick={() => (mode = 'sign-up')}
					>
						Create Account
					</button>
				</div>

				<form class="grid gap-3" onsubmit={handleSubmit}>
					{#if mode === 'sign-up'}
						<label class="grid gap-2">
							<span class="text-sm font-medium text-foreground">Name</span>
							<input bind:value={name} class="rounded-2xl border border-input bg-card px-4 py-3 outline-none focus:border-primary" placeholder="Jane Doe" autocomplete="name" />
						</label>
					{/if}

					<label class="grid gap-2">
						<span class="text-sm font-medium text-foreground">Email</span>
						<input bind:value={email} class="rounded-2xl border border-input bg-card px-4 py-3 outline-none focus:border-primary" placeholder="you@example.com" autocomplete="email" type="email" />
					</label>

					<label class="grid gap-2">
						<span class="text-sm font-medium text-foreground">Password</span>
						<input bind:value={password} class="rounded-2xl border border-input bg-card px-4 py-3 outline-none focus:border-primary" placeholder="At least 8 characters" autocomplete={mode === 'sign-in' ? 'current-password' : 'new-password'} type="password" />
					</label>

					<button
						type="submit"
						class="rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
						disabled={isSubmitting}
					>
						{#if isSubmitting}
							{mode === 'sign-in' ? 'Signing In...' : 'Creating Account...'}
						{:else}
							{mode === 'sign-in' ? 'Sign In' : 'Create Account'}
						{/if}
					</button>
				</form>
			{/if}

			{#if error}
				<p class="text-sm text-destructive">{error}</p>
			{/if}
			{#if message}
				<p class="text-sm text-muted-foreground">{message}</p>
			{/if}
			{#if !showEmail && !showSso}
				<p class="text-sm text-muted-foreground">No interactive sign-in providers are enabled.</p>
			{/if}
		</div>
	{/if}
</Modal>
