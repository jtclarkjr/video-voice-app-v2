<script lang="ts">
	import { media } from '$lib/stores/media';
	import { participants } from '$lib/stores/participants';

	let { localDisplayName = 'You' } = $props<{ localDisplayName?: string }>();

	const remoteList = $derived(Object.values($participants));
</script>

<div class="glass-card surface-border flex h-full flex-col rounded-[1.75rem]">
	<div class="border-b border-border px-4 py-3">
		<h3 class="text-sm font-semibold text-foreground">Participants ({remoteList.length + 1})</h3>
	</div>

	<div class="flex-1 space-y-2 overflow-y-auto px-3 py-3">
		<div class="flex items-center gap-3 rounded-2xl bg-secondary/70 px-3 py-2">
			<div class="flex size-10 items-center justify-center rounded-full bg-primary/15 font-bold text-primary">
				{localDisplayName.charAt(0).toUpperCase()}
			</div>
			<div class="min-w-0 flex-1">
				<p class="truncate text-sm font-semibold text-foreground">{localDisplayName}</p>
				<p class="text-xs text-muted-foreground">You</p>
			</div>
			<div class="text-xs text-muted-foreground">
				{$media.isMicOn ? 'Mic on' : 'Mic off'} · {$media.isCameraOn ? 'Cam on' : 'Cam off'}
			</div>
		</div>

		{#each remoteList as participant (participant.id)}
			<div class="flex items-center gap-3 rounded-2xl border border-border/70 px-3 py-2">
				<div class={`flex size-10 items-center justify-center rounded-full font-bold ${participant.isSpeaking ? 'bg-success/20 text-success' : 'bg-secondary text-secondary-foreground'}`}>
					{participant.displayName.charAt(0).toUpperCase()}
				</div>
				<div class="min-w-0 flex-1">
					<p class="truncate text-sm font-semibold text-foreground">{participant.displayName}</p>
					<p class="text-xs text-muted-foreground">{participant.connectionState}</p>
				</div>
				<div class="text-right text-xs text-muted-foreground">
					<p>{participant.audioEnabled ? 'Mic on' : 'Mic muted'}</p>
					<p>{participant.videoEnabled ? 'Video on' : 'Video off'}</p>
				</div>
			</div>
		{/each}
	</div>
</div>
