<script lang="ts">
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';
	import AuthDialog from '$lib/components/auth/AuthDialog.svelte';
	import MicLevelMeter from '$lib/components/prejoin/MicLevelMeter.svelte';
	import { getUserDisplayName, hasAuthenticatedSession } from '$lib/auth/session-service';
	import { enumerateDevices, media, setSelectedAudioInput, setSelectedAudioOutput, setSelectedVideoInput, toggleCamera, toggleMic } from '$lib/stores/media';
	import { fetchActiveRooms } from '$lib/rooms/client';
	import { session } from '$lib/stores/session';
	import type { AuthConfig } from '$lib/server/auth-config';

	let {
		authConfig,
		roomId,
		isCreateFlow = false,
		onJoin = (_displayName: string, _roomId?: string) => {}
	} = $props<{
		authConfig: AuthConfig;
		roomId: string;
		isCreateFlow?: boolean;
		onJoin?: (displayName: string, roomId?: string) => void;
	}>();

	type RoomState = 'loading' | 'exists' | 'missing' | 'unknown';

	let anonymousDisplayName = $state('');
	let pendingRoomName = $state('');
	let previewStream = $state<MediaStream | null>(null);
	let previewVideo = $state<HTMLVideoElement | null>(null);
	let permissionError = $state<string | null>(null);
	let roomState = $state<RoomState>('loading');
	let authDialogOpen = $state(false);

	const isAnonymous = $derived($session.isAnonymous);
	const resolvedDisplayName = $derived(
		isAnonymous ? anonymousDisplayName.trim() || getUserDisplayName(get(session).data?.user ?? null) : getUserDisplayName(get(session).data?.user ?? null)
	);

	$effect(() => {
		roomState = isCreateFlow ? 'missing' : 'loading';
	});

	$effect(() => {
		if (previewVideo) {
			previewVideo.srcObject = previewStream;
		}
	});

	onMount(() => {
		let cancelled = false;

		void (async () => {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
				if (!cancelled) {
					previewStream = stream;
				}
				await enumerateDevices();
			} catch {
				if (!cancelled) {
					permissionError = 'Could not access camera or microphone. Please check permissions.';
				}
			}
		})();

			if (!isCreateFlow) {
				void (async () => {
					try {
						const rooms = await fetchActiveRooms();
						if (!cancelled) {
							roomState = rooms.some((room) => room.id === roomId) ? 'exists' : 'missing';
						}
				} catch {
					if (!cancelled) {
						roomState = 'unknown';
					}
				}
			})();
		}

		return () => {
			cancelled = true;
			if (previewStream) {
				for (const track of previewStream.getTracks()) {
					track.stop();
				}
			}
		};
	});

	$effect(() => {
		if (!previewStream) {
			return;
		}
		for (const track of previewStream.getAudioTracks()) {
			track.enabled = $media.isMicOn;
		}
		for (const track of previewStream.getVideoTracks()) {
			track.enabled = $media.isCameraOn;
		}
	});

	function generateRoomId() {
		if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
			return crypto.randomUUID();
		}

		return `room-${Math.random().toString(36).slice(2, 10)}`;
	}

	function handleJoin() {
		if ($session.isPending) {
			return;
		}

		const nextRoomId = isCreateFlow ? pendingRoomName.trim() || generateRoomId() : roomId;
		if (!nextRoomId) {
			return;
		}

		if (
			(isCreateFlow && isAnonymous) ||
			(roomState === 'missing' && !isCreateFlow && !hasAuthenticatedSession($session.data?.session ?? null))
		) {
			authDialogOpen = true;
			return;
		}

		if (previewStream) {
			for (const track of previewStream.getTracks()) {
				track.stop();
			}
		}

		onJoin(resolvedDisplayName, nextRoomId);
	}

	const joinDisabled = $derived(
		$session.isPending ||
			(isAnonymous && anonymousDisplayName.trim() === '') ||
			(!isCreateFlow && roomState === 'loading') ||
			!!$session.error
	);
</script>

<div class="grid gap-6">
	<div class="grid gap-2">
		<p class="text-xs font-black uppercase tracking-[0.22em] text-primary">
			{isCreateFlow ? 'Create Room' : 'Join Room'}
		</p>
		<h1 class="text-4xl font-black tracking-tight text-foreground">
			{isCreateFlow ? 'Set the stage before you go live.' : roomId}
		</h1>
		<p class="max-w-2xl text-base leading-7 text-muted-foreground">
			{isCreateFlow
				? 'Pick your room name, test your devices, and then hand off into the live call route.'
				: 'Preview your setup, verify room availability, and join when you are ready.'}
		</p>
	</div>

	{#if permissionError}
		<div class="rounded-[2rem] border border-destructive/30 bg-destructive/10 px-6 py-10 text-center">
			<p class="text-sm text-destructive">{permissionError}</p>
		</div>
	{:else}
		<div class="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_24rem]">
			<div class="grid gap-3">
			<div class="glass-card surface-border relative aspect-video overflow-hidden rounded-[2rem]">
				<video bind:this={previewVideo} autoplay playsinline muted class={`h-full w-full object-cover ${previewStream ? 'scale-x-[-1]' : 'hidden'}`}></video>
				{#if !$media.isCameraOn}
					<div class="absolute inset-0 flex items-center justify-center">
						<div class="flex size-24 items-center justify-center rounded-full bg-black/10 text-4xl font-black text-muted-foreground">
							{resolvedDisplayName.charAt(0).toUpperCase()}
						</div>
					</div>
				{/if}
				<div class="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 bg-gradient-to-t from-black/70 via-black/10 to-transparent p-5">
					<button
						type="button"
						class={`flex size-11 items-center justify-center rounded-full transition ${$media.isMicOn ? 'bg-white/85 text-black' : 'bg-destructive text-destructive-foreground'}`}
						onclick={toggleMic}
						aria-label={$media.isMicOn ? 'Mute microphone' : 'Unmute microphone'}
						aria-pressed={$media.isMicOn}
						title={$media.isMicOn ? 'Mic on' : 'Mic off'}
					>
						{#if $media.isMicOn}
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
								<rect x="9" y="2" width="6" height="12" rx="3" />
								<path d="M19 10a7 7 0 0 1-14 0" />
								<line x1="12" x2="12" y1="19" y2="22" />
							</svg>
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
								<line x1="2" x2="22" y1="2" y2="22" />
								<path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
								<path d="M5 10v2a7 7 0 0 0 12 5" />
								<path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
								<path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
								<line x1="12" x2="12" y1="19" y2="22" />
							</svg>
						{/if}
					</button>
					<button
						type="button"
						class={`flex size-11 items-center justify-center rounded-full transition ${$media.isCameraOn ? 'bg-white/85 text-black' : 'bg-destructive text-destructive-foreground'}`}
						onclick={toggleCamera}
						aria-label={$media.isCameraOn ? 'Turn camera off' : 'Turn camera on'}
						aria-pressed={$media.isCameraOn}
						title={$media.isCameraOn ? 'Camera on' : 'Camera off'}
					>
						{#if $media.isCameraOn}
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
								<path d="m22 8-6 4 6 4V8Z" />
								<rect x="2" y="6" width="14" height="12" rx="2" />
							</svg>
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
								<path d="M10.66 6H14a2 2 0 0 1 2 2v2.34l1 1L22 8v8" />
								<path d="M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2l10 10Z" />
								<line x1="2" x2="22" y1="2" y2="22" />
							</svg>
						{/if}
					</button>
				</div>
			</div>
				{#if previewStream && $media.isMicOn}
					<MicLevelMeter stream={previewStream} />
				{/if}
			</div>

			<div class="glass-card surface-border grid gap-4 rounded-[2rem] p-5">
				<div class="grid gap-2">
					<label class="grid gap-2">
						<span class="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Display Name</span>
						<input
							bind:value={anonymousDisplayName}
							class="rounded-2xl border border-input bg-card px-4 py-3 outline-none focus:border-primary"
							disabled={!isAnonymous}
							placeholder={resolvedDisplayName}
						/>
					</label>
					{#if !isAnonymous}
						<p class="text-xs text-muted-foreground">Signed in as {resolvedDisplayName}</p>
					{/if}
				</div>

				{#if isCreateFlow}
					<div class="grid gap-2">
						<label class="grid gap-2">
							<span class="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Room Name</span>
							<input bind:value={pendingRoomName} class="rounded-2xl border border-input bg-card px-4 py-3 outline-none focus:border-primary" placeholder="team-sync" />
						</label>
					</div>
				{/if}

				<div class="grid gap-2 sm:grid-cols-3">
					<label class="grid min-w-0 gap-2">
						<span class="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Mic</span>
						<select class="w-full min-w-0 truncate rounded-2xl border border-input bg-card px-4 py-3" bind:value={$media.selectedAudioInput} onchange={(event) => setSelectedAudioInput((event.currentTarget as HTMLSelectElement).value)}>
							{#each $media.audioInputs.length > 0 ? $media.audioInputs : [{ deviceId: '', label: 'Default' }] as device}
								<option value={device.deviceId}>{device.label}</option>
							{/each}
						</select>
					</label>
					<label class="grid min-w-0 gap-2">
						<span class="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Speaker</span>
						<select class="w-full min-w-0 truncate rounded-2xl border border-input bg-card px-4 py-3" bind:value={$media.selectedAudioOutput} onchange={(event) => setSelectedAudioOutput((event.currentTarget as HTMLSelectElement).value)}>
							{#each $media.audioOutputs.length > 0 ? $media.audioOutputs : [{ deviceId: '', label: 'Default' }] as device}
								<option value={device.deviceId}>{device.label}</option>
							{/each}
						</select>
					</label>
					<label class="grid min-w-0 gap-2">
						<span class="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Camera</span>
						<select class="w-full min-w-0 truncate rounded-2xl border border-input bg-card px-4 py-3" bind:value={$media.selectedVideoInput} onchange={(event) => setSelectedVideoInput((event.currentTarget as HTMLSelectElement).value)}>
							{#each $media.videoInputs.length > 0 ? $media.videoInputs : [{ deviceId: '', label: 'Default' }] as device}
								<option value={device.deviceId}>{device.label}</option>
							{/each}
						</select>
					</label>
				</div>

				<div class="rounded-[1.5rem] bg-secondary/60 p-4 text-sm text-muted-foreground">
					{#if isCreateFlow}
						Authenticated users can create new rooms. Guests can still join existing rooms.
					{:else if roomState === 'loading'}
						Checking whether this room exists...
					{:else if roomState === 'exists'}
						This room is live and ready to join.
					{:else if roomState === 'missing'}
						This room does not exist yet. Signing in will let you create it from here.
					{:else}
						Room availability could not be confirmed. You can still try to continue.
					{/if}
				</div>

				{#if $session.error}
					<p class="text-sm text-destructive">{$session.error}</p>
				{/if}

				<button
					type="button"
					class="rounded-[1.5rem] bg-primary px-5 py-4 text-sm font-black uppercase tracking-[0.2em] text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
					disabled={joinDisabled}
					onclick={handleJoin}
				>
					{#if isCreateFlow}
						Create and Join
					{:else if roomState === 'missing' && !isAnonymous}
						Create and Join
					{:else}
						Join Call
					{/if}
				</button>
			</div>
		</div>
	{/if}
</div>

<AuthDialog open={authDialogOpen} {authConfig} onClose={() => (authDialogOpen = false)} />
