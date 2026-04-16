	<script lang="ts">
		import { onMount } from 'svelte';
		import { createActiveRoomsEventSource, fetchActiveRooms } from '$lib/rooms/client';
		import { session } from '$lib/stores/session';
		import type { RoomInfo } from '$lib/rooms/client';

	let rooms = $state<RoomInfo[]>([]);
	let isLoading = $state(true);

	onMount(() => {
		let cancelled = false;
		let source: EventSource | null = null;

		void (async () => {
			try {
				rooms = await fetchActiveRooms();
			} catch {
				rooms = [];
			} finally {
				isLoading = false;
			}

			if (cancelled) {
				return;
			}

			source = await createActiveRoomsEventSource();
			source.onmessage = (event) => {
				rooms = JSON.parse(event.data as string);
				isLoading = false;
			};
			source.onerror = () => {
				isLoading = false;
			};
		})();

		return () => {
			cancelled = true;
			source?.close();
		};
	});
</script>

<section class="grid gap-8">
	<div class="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_20rem]">
		<div class="grid gap-4">
			<p class="text-xs font-black uppercase tracking-[0.24em] text-primary">Voice + Video</p>
			<h1 class="max-w-4xl text-5xl font-black leading-none tracking-tight text-foreground sm:text-6xl">
				Run live rooms from a warmer, Svelte-native control surface.
			</h1>
			<p class="max-w-2xl text-lg leading-8 text-muted-foreground">
				Join existing rooms, create new ones when signed in, and keep your media setup dialed in before you enter the call.
			</p>
			<div class="flex flex-wrap gap-3">
				<a href="/call/new" class="rounded-full bg-primary px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-primary-foreground">
					Create Room
				</a>
				<a href="#rooms" class="rounded-full bg-secondary px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-secondary-foreground">
					View Active Rooms
				</a>
			</div>
		</div>

		<div class="glass-card surface-border grid gap-3 rounded-[2rem] p-5">
			<p class="text-xs font-black uppercase tracking-[0.2em] text-primary">Access</p>
			<div class="rounded-[1.5rem] bg-secondary/60 p-4">
				<p class="text-sm font-semibold text-foreground">
					{$session.isAnonymous ? 'Guest mode active' : 'Authenticated'}
				</p>
				<p class="mt-1 text-sm leading-6 text-muted-foreground">
					{$session.isAnonymous
						? 'Guests can join live rooms. Sign in from the header to create new ones.'
						: 'You can create rooms and join any active session from the lobby.'}
				</p>
			</div>
			<div class="grid gap-2 text-sm text-muted-foreground">
				<div class="rounded-[1.25rem] border border-border/70 px-4 py-3">Live roster updates stream from the backend.</div>
				<div class="rounded-[1.25rem] border border-border/70 px-4 py-3">The call route keeps auth, chat, screen share, and reconnect logic intact.</div>
			</div>
		</div>
	</div>

	<div id="rooms" class="glass-card surface-border grid gap-5 rounded-[2rem] p-6">
		<div class="flex flex-wrap items-end justify-between gap-3">
			<div class="grid gap-1">
				<p class="text-xs font-black uppercase tracking-[0.2em] text-primary">Live Lobby</p>
				<h2 class="text-3xl font-black text-foreground">Active Rooms</h2>
			</div>
			<a href="/call/new" class="rounded-full bg-card px-4 py-2 text-sm font-semibold text-foreground">
				New room
			</a>
		</div>

		{#if isLoading}
			<div class="grid gap-3">
				{#each [1, 2, 3] as item}
					<div class="h-16 animate-pulse rounded-[1.5rem] bg-secondary/70"></div>
				{/each}
			</div>
		{:else if rooms.length === 0}
			<div class="rounded-[1.75rem] border border-dashed border-border px-6 py-10 text-center">
				<p class="text-sm text-muted-foreground">No active rooms right now.</p>
			</div>
		{:else}
			<div class="grid gap-3">
				{#each rooms as room (room.id)}
					<a
						href={`/call/${encodeURIComponent(room.id)}`}
						class="group flex items-center justify-between rounded-[1.5rem] border border-border bg-card px-4 py-4 transition hover:-translate-y-0.5 hover:bg-secondary"
					>
						<div class="grid gap-1">
							<span class="text-base font-bold text-foreground">{room.id}</span>
							<span class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Join live room</span>
						</div>
						<div class="text-right">
							<p class="text-sm font-semibold text-foreground">{room.participantCount}</p>
							<p class="text-xs text-muted-foreground">participants</p>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</section>
