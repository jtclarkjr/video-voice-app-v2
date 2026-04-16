<script lang="ts">
	import { layout, toggleChat, toggleLayoutMode, toggleRoster } from '$lib/stores/layout';
	import { media, toggleCamera, toggleMic } from '$lib/stores/media';
	import { screenShare } from '$lib/stores/screen-share';
	import { startScreenShare, stopScreenShare } from '$lib/screen-share';
	import VoiceVideoSettingsDialog from '$lib/components/settings/VoiceVideoSettingsDialog.svelte';

	let { onLeave = () => {} } = $props<{ onLeave?: () => void }>();

	let settingsOpen = $state(false);

	async function toggleShare() {
		if ($screenShare.localActive) {
			await stopScreenShare();
		} else {
			await startScreenShare();
		}
	}
</script>

<div class="glass-card surface-border flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] p-3">
	<div class="flex flex-wrap items-center gap-2">
		<button type="button" class={`rounded-full px-4 py-2 text-sm font-semibold transition ${$media.isMicOn ? 'bg-secondary text-secondary-foreground' : 'bg-destructive text-destructive-foreground'}`} onclick={toggleMic}>
			{$media.isMicOn ? 'Mute mic' : 'Unmute mic'}
		</button>
		<button type="button" class={`rounded-full px-4 py-2 text-sm font-semibold transition ${$media.isCameraOn ? 'bg-secondary text-secondary-foreground' : 'bg-destructive text-destructive-foreground'}`} onclick={toggleCamera}>
			{$media.isCameraOn ? 'Camera on' : 'Camera off'}
		</button>
		<button type="button" class="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground" onclick={() => void toggleShare()}>
			{$screenShare.localActive ? 'Stop share' : 'Share screen'}
		</button>
		<button type="button" class="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground" onclick={toggleLayoutMode}>
			Layout: {$layout.mode}
		</button>
	</div>

	<div class="flex flex-wrap items-center gap-2">
		<button type="button" class={`rounded-full px-4 py-2 text-sm font-semibold transition ${$layout.chatOpen ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`} onclick={toggleChat}>
			Chat
		</button>
		<button type="button" class={`rounded-full px-4 py-2 text-sm font-semibold transition ${$layout.rosterOpen ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`} onclick={toggleRoster}>
			Roster
		</button>
		<button type="button" class="rounded-full bg-card px-4 py-2 text-sm font-semibold" onclick={() => (settingsOpen = true)}>
			Settings
		</button>
		<button type="button" class="rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground" onclick={onLeave}>
			Leave
		</button>
	</div>
</div>

<VoiceVideoSettingsDialog open={settingsOpen} onClose={() => (settingsOpen = false)} />
