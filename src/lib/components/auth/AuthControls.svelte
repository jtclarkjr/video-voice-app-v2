<script lang="ts">
	import { get } from 'svelte/store';
	import AuthDialog from '$lib/components/auth/AuthDialog.svelte';
	import { getUserDisplayName, signOut } from '$lib/auth/session-service';
	import type { AuthConfig } from '$lib/server/auth-config';
	import { session } from '$lib/stores/session';
	import { theme, type Theme } from '$lib/stores/theme';

	let { authConfig } = $props<{ authConfig: AuthConfig }>();

	let authDialogOpen = $state(false);
	let menuOpen = $state(false);

	const themeOptions: Theme[] = ['light', 'dark', 'system'];

	function setTheme(nextTheme: Theme) {
		theme.set(nextTheme);
	}

	function displayName() {
		return getUserDisplayName(get(session).data?.user ?? null);
	}
</script>

<div class="relative">
	<div class="flex items-center gap-2">
		<button
			type="button"
			class="glass-card flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border px-3 text-sm font-semibold"
			onclick={() => (menuOpen = !menuOpen)}
			aria-label="Open account menu"
		>
			<span class="flex size-8 items-center justify-center rounded-full bg-primary/15 text-primary">
				{displayName().charAt(0).toUpperCase()}
			</span>
		</button>
	</div>

	{#if menuOpen}
		<div class="glass-card surface-border absolute right-0 top-[calc(100%+0.75rem)] z-40 grid w-72 gap-4 rounded-[1.5rem] p-4">
			<div class="grid gap-1">
				<p class="text-sm font-semibold text-foreground">
					{$session.isAnonymous ? 'Guest mode' : displayName()}
				</p>
				<p class="text-xs text-muted-foreground">
					{$session.isAnonymous
						? 'Sign in to create rooms and keep your profile.'
						: ($session.data?.user?.email ?? 'Signed in')}
				</p>
			</div>

			<div class="flex items-center justify-between gap-2 rounded-full border border-border bg-secondary/60 p-1">
				{#each themeOptions as option}
					<button
						type="button"
						class={`flex h-9 flex-1 items-center justify-center rounded-full transition ${$theme === option ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
						onclick={() => setTheme(option)}
						aria-label={`Use ${option} theme`}
						aria-pressed={$theme === option}
						title={`${option.charAt(0).toUpperCase()}${option.slice(1)} theme`}
					>
						{#if option === 'light'}
							<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
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
							<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
								<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
							</svg>
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
								<rect x="2" y="3" width="20" height="14" rx="2" />
								<line x1="8" x2="16" y1="21" y2="21" />
								<line x1="12" x2="12" y1="17" y2="21" />
							</svg>
						{/if}
					</button>
				{/each}
			</div>

			{#if $session.isAnonymous}
				<button
					type="button"
					class="rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold transition hover:bg-secondary"
					onclick={() => {
						menuOpen = false;
						authDialogOpen = true;
					}}
				>
					Sign In
				</button>
			{:else}
				<button
					type="button"
					class="rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold transition hover:bg-secondary"
					onclick={() => {
						menuOpen = false;
						void signOut();
					}}
				>
					Sign Out
				</button>
			{/if}
		</div>
	{/if}
</div>

<AuthDialog open={authDialogOpen} {authConfig} onClose={() => (authDialogOpen = false)} />
