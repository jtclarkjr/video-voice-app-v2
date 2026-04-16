<script lang="ts">
	import { goto } from '$app/navigation';
	import CallRoom from '$lib/components/call/CallRoom.svelte';
	import PrejoinScreen from '$lib/components/prejoin/PrejoinScreen.svelte';
	import type { AuthConfig } from '$lib/server/auth-config';
	import { consumePendingJoin, savePendingJoin } from '$lib/stores/pending-join';
	import { media } from '$lib/stores/media';

	let {
		roomId: initialRoomId,
		isCreateFlow = false,
		authConfig
	} = $props<{
		roomId: string;
		isCreateFlow?: boolean;
		authConfig: AuthConfig;
	}>();

	let roomId = $state('');
	let joined = $state(false);
	let displayName = $state('Guest');
	let joinMediaState = $state({
		isMicOn: true,
		isCameraOn: true
	});

	$effect(() => {
		if (!joined) {
			roomId = initialRoomId;
		}
	});

	$effect(() => {
		if (!isCreateFlow && initialRoomId) {
			const pending = consumePendingJoin(initialRoomId);
			if (pending) {
				displayName = pending.displayName;
				joinMediaState = {
					isMicOn: pending.isMicOn,
					isCameraOn: pending.isCameraOn
				};
				joined = true;
			}
		}
	});

	function handleJoin(name: string, nextRoomId = roomId) {
		const currentMedia = $media;
		displayName = name;
		roomId = nextRoomId;
		joinMediaState = {
			isMicOn: currentMedia.isMicOn,
			isCameraOn: currentMedia.isCameraOn
		};

		if (isCreateFlow) {
			savePendingJoin({
				roomId: nextRoomId,
				displayName: name,
				isMicOn: currentMedia.isMicOn,
				isCameraOn: currentMedia.isCameraOn,
				createdAt: Date.now()
			});
			void goto(`/call/${encodeURIComponent(nextRoomId)}`);
			return;
		}

		if (typeof window !== 'undefined') {
			window.history.replaceState(null, '', `/call/${encodeURIComponent(nextRoomId)}`);
		}
		joined = true;
	}
</script>

{#if !joined}
	<PrejoinScreen {roomId} {isCreateFlow} {authConfig} onJoin={handleJoin} />
{:else}
	<CallRoom
		{roomId}
		{displayName}
		initialMicOn={joinMediaState.isMicOn}
		initialCameraOn={joinMediaState.isCameraOn}
	/>
{/if}
