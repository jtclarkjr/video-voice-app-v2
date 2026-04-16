<script lang="ts">
	import VideoTile from '$lib/components/layouts/VideoTile.svelte';
	import type { Participant } from '$lib/types/participant';

	let {
		localStream = null,
		participants = {},
		isCameraOn = true,
		localDisplayName = 'You',
		localSpeaking = false,
		pinnedId = null,
		onPin = (_id: string) => {}
	} = $props<{
		localStream?: MediaStream | null;
		participants?: Record<string, Participant>;
		isCameraOn?: boolean;
		localDisplayName?: string;
		localSpeaking?: boolean;
		pinnedId?: string | null;
		onPin?: (id: string) => void;
	}>();

	const remoteParticipants = $derived(Object.values(participants));
	const total = $derived(remoteParticipants.length + 1);
	const cols = $derived.by(() => {
		if (total <= 1) {
			return 'grid-cols-1';
		}
		if (total <= 4) {
			return 'grid-cols-2';
		}
		if (total <= 9) {
			return 'grid-cols-3';
		}
		return 'grid-cols-4';
	});
</script>

<div class={`grid gap-3 ${cols}`}>
	<VideoTile
		stream={localStream}
		label={localDisplayName}
		muted
		mirrored
		cameraOff={!isCameraOn}
		isSpeaking={localSpeaking}
	/>
	{#each remoteParticipants as participant (participant.id)}
		<VideoTile
			stream={participant.stream}
			label={participant.displayName}
			cameraOff={!participant.videoEnabled}
			isSpeaking={participant.isSpeaking}
			networkQuality={participant.networkQuality}
			isPinned={pinnedId === participant.id}
			onPin={() => onPin(participant.id)}
		/>
	{/each}
</div>
