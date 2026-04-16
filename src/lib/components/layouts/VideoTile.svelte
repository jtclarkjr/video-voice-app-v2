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
		'relative aspect-video overflow-hidden rounded-xl bg-muted text-left transition-shadow',
		isSpeaking && 'ring-2 ring-green-500 shadow-[0_0_12px_rgba(34,197,94,0.3)]',
		isPinned && 'ring-2 ring-primary',
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
			<div class="flex h-16 w-16 items-center justify-center rounded-full bg-muted-foreground/20 text-2xl font-semibold text-muted-foreground">
				{label.charAt(0).toUpperCase()}
			</div>
		</div>
	{/if}

	<div class="absolute bottom-2 left-2 flex items-center gap-1.5">
		<span class="rounded-md bg-black/60 px-2 py-1 text-xs text-white">{label}</span>
		{#if qualityClass}
			<span class={`size-3 rounded-full ${qualityClass}`} title={`Connection: ${networkQuality}`}></span>
		{/if}
	</div>
</button>
