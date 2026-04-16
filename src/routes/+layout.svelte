<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import AuthControls from '$lib/components/auth/AuthControls.svelte';
	import { initSessionStore } from '$lib/stores/session';
	import { theme } from '$lib/stores/theme';
	import type { AuthConfig } from '$lib/server/auth-config';

	let { children, data } = $props<{
		children: () => unknown;
		data: {
			authConfig: AuthConfig;
		};
	}>();

	onMount(() => {
		void initSessionStore();
		return theme.init();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Video Voice</title>
</svelte:head>

<div class="min-h-screen">
	<header class="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
		<div class="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
			<a href="/" class="flex items-center gap-3">
				<div class="glass-card flex size-10 items-center justify-center rounded-2xl border border-white/20 bg-primary text-sm font-black text-primary-foreground">
					VV
				</div>
				<div class="grid gap-0">
					<span class="text-sm font-black uppercase tracking-[0.18em] text-primary">Video Voice</span>
					<span class="text-xs text-muted-foreground">SvelteKit WebRTC cockpit</span>
				</div>
			</a>

			<div class="flex items-center gap-3">
				<nav class="hidden items-center gap-3 text-sm text-muted-foreground sm:flex">
					<a href="/" class="rounded-full px-3 py-1.5 transition hover:bg-secondary hover:text-foreground">Lobby</a>
					<a href="/call/new" class="rounded-full px-3 py-1.5 transition hover:bg-secondary hover:text-foreground">Create</a>
				</nav>
				<AuthControls authConfig={data.authConfig} />
			</div>
		</div>
	</header>

	<main class="px-4 py-8 sm:px-6 sm:py-10">
		<div class="mx-auto max-w-6xl">
			{@render children()}
		</div>
	</main>
</div>
