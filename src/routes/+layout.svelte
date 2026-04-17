<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import AuthControls from '$lib/components/auth/AuthControls.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { theme } from '$lib/stores/theme.svelte';
	import type { AuthConfig } from '$lib/server/auth-config';

	let { children, data } = $props<{
		children: () => unknown;
		data: {
			authConfig: AuthConfig;
		};
	}>();

	onMount(() => {
		void session.init();
		return theme.init();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Video Voice</title>
</svelte:head>

<div class="min-h-screen">
	<header class="relative z-20 border-b border-border/70 bg-background/85 backdrop-blur">
		<div class="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
			<a href="/" class="text-sm font-bold tracking-[0.02em] text-foreground">Home</a>
			<AuthControls authConfig={data.authConfig} />
		</div>
	</header>

	<main class="px-4 py-10 sm:px-6 sm:py-14">
		<div class="mx-auto w-full max-w-5xl">
			{@render children()}
		</div>
	</main>
</div>
