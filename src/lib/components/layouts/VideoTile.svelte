<script lang="ts">
	import { cn } from '$lib/utils';
	import type { NetworkQuality } from '$lib/types/connection';

	let {
		stream = null,
		label,
		muted = false,
		mirrored = false,
		cameraOff = false,
		isSpeaking = false,
		networkQuality = 'unknown',
		isPinned = false,
		className = '',
		onPin = undefined as (() => void) | undefined
	} = $props<{
		stream?: MediaStream | null;
		label: string;
		muted?: boolean;
		mirrored?: boolean;
		cameraOff?: boolean;
		isSpeaking?: boolean;
		networkQuality?: NetworkQuality;
		isPinned?: boolean;
		className?: string;
		onPin?: () => void;
	}>();

	let videoElement = $state<HTMLVideoElement | null>(null);

	$effect(() => {
		if (videoElement) {
			videoElement.srcObject = stream ?? null;
		}
	});

	const qualityClass = $derived.by(() => {
		if (networkQuality === 'good') {
			return 'bg-success';
		}
		if (networkQuality === 'fair') {
			return 'bg-yellow-500';
		}
		if (networkQuality === 'poor') {
			return 'bg-destructive';
		}
		return '';
	});
</script>

<button
	type="button"
	class={cn(
		'relative aspect-video overflow-hidden rounded-[1.75rem] bg-muted text-left transition',
		isSpeaking && 'ring-2 ring-success shadow-[0_0_0_6px_rgba(45,147,108,0.12)]',
		isPinned && 'ring-2 ring-primary shadow-[0_0_0_6px_rgba(255,107,53,0.12)]',
		onPin && 'hover:-translate-y-0.5',
		className
	)}
	onclick={() => onPin?.()}
>
	<video
		bind:this={videoElement}
		autoplay
		playsinline
		{muted}
		class={cn('h-full w-full object-cover', mirrored && 'scale-x-[-1]', cameraOff && 'invisible')}
	></video>

	{#if cameraOff}
		<div class="absolute inset-0 flex items-center justify-center">
			<div class="flex size-20 items-center justify-center rounded-full bg-black/10 text-3xl font-black text-muted-foreground">
				{label.charAt(0).toUpperCase()}
			</div>
		</div>
	{/if}

	<div class="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/65 via-black/10 to-transparent p-3">
		<div class="grid gap-1">
			<span class="text-sm font-semibold text-white">{label}</span>
			{#if onPin}
				<span class="text-[11px] uppercase tracking-[0.2em] text-white/70">
					{isPinned ? 'Pinned' : 'Pin'}
				</span>
			{/if}
		</div>

		{#if qualityClass}
			<span class={`size-3 rounded-full ${qualityClass}`} title={`Connection: ${networkQuality}`}></span>
		{/if}
	</div>
</button>
