<script lang="ts">
	import { media } from '$lib/stores/media';
	import { participants } from '$lib/stores/participants';

	let { localDisplayName = 'You' } = $props<{ localDisplayName?: string }>();

	const remoteList = $derived(Object.values($participants));
</script>

<div class="flex h-full flex-col border-l border-border bg-card">
	<div class="border-b border-border px-4 py-3">
		<h3 class="text-sm font-semibold text-foreground">Participants ({remoteList.length + 1})</h3>
	</div>

	<div class="min-h-0 flex-1 overflow-y-auto px-2 py-2">
		<div class="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-accent/50">
			<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
				{localDisplayName.charAt(0).toUpperCase()}
			</div>
			<div class="min-w-0 flex-1">
				<div class="truncate text-sm font-medium text-foreground">{localDisplayName}</div>
			</div>
			<div class="flex items-center gap-1.5">
				{#if $media.isMicOn}
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true">
						<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
						<path d="M19 10v2a7 7 0 0 1-14 0v-2" />
						<line x1="12" x2="12" y1="19" y2="22" />
					</svg>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5 text-destructive" aria-hidden="true">
						<line x1="2" x2="22" y1="2" y2="22" />
						<path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
						<path d="M5 10v2a7 7 0 0 0 12 5.29" />
						<path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
						<path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
						<line x1="12" x2="12" y1="19" y2="22" />
					</svg>
				{/if}

				{#if $media.isCameraOn}
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true">
						<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
						<rect x="2" y="6" width="14" height="12" rx="2" />
					</svg>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5 text-destructive" aria-hidden="true">
						<path d="M10.66 6H14a2 2 0 0 1 2 2v2.5l5.248-3.062A.5.5 0 0 1 22 7.87v8.196" />
						<path d="M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2" />
						<line x1="2" x2="22" y1="2" y2="22" />
					</svg>
				{/if}
			</div>
		</div>

		{#each remoteList as participant (participant.id)}
			<div class="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-accent/50">
				<div class={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground ${participant.isSpeaking ? 'ring-2 ring-green-500' : ''}`}>
					{participant.displayName.charAt(0).toUpperCase()}
				</div>
				<div class="min-w-0 flex-1">
					<div class="truncate text-sm font-medium text-foreground">{participant.displayName}</div>
					{#if participant.connectionState !== 'connected'}
						<div class="text-xs text-muted-foreground">{participant.connectionState}</div>
					{/if}
				</div>
				<div class="flex items-center gap-1.5">
					{#if participant.networkQuality !== 'unknown' && participant.networkQuality !== 'good'}
						<span class={`h-2 w-2 rounded-full ${participant.networkQuality === 'fair' ? 'bg-yellow-500' : 'bg-destructive'}`} title={`Connection: ${participant.networkQuality}`}></span>
					{/if}
					{#if participant.audioEnabled}
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true">
							<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
							<path d="M19 10v2a7 7 0 0 1-14 0v-2" />
							<line x1="12" x2="12" y1="19" y2="22" />
						</svg>
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5 text-destructive" aria-hidden="true">
							<line x1="2" x2="22" y1="2" y2="22" />
							<path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
							<path d="M5 10v2a7 7 0 0 0 12 5.29" />
							<path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
							<path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
							<line x1="12" x2="12" y1="19" y2="22" />
						</svg>
					{/if}
					{#if participant.videoEnabled}
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true">
							<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
							<rect x="2" y="6" width="14" height="12" rx="2" />
						</svg>
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5 text-destructive" aria-hidden="true">
							<path d="M10.66 6H14a2 2 0 0 1 2 2v2.5l5.248-3.062A.5.5 0 0 1 22 7.87v8.196" />
							<path d="M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2" />
							<line x1="2" x2="22" y1="2" y2="22" />
						</svg>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>
