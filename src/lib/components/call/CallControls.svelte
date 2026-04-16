<script lang="ts">
	import Popover from '$lib/components/shared/Popover.svelte';
	import VoiceVideoSettingsDialog from '$lib/components/settings/VoiceVideoSettingsDialog.svelte';
	import { chat } from '$lib/stores/chat';
	import { layout, toggleChat, toggleLayoutMode, toggleRoster } from '$lib/stores/layout';
	import {
		media,
		setInputVolume,
		setOutputVolume,
		setSelectedAudioInput,
		setSelectedAudioOutput,
		setSelectedVideoInput,
		toggleCamera,
		toggleDeafen,
		toggleMic
	} from '$lib/stores/media';
	import { screenShare } from '$lib/stores/screen-share';
	import { startScreenShare, stopScreenShare } from '$lib/screen-share';

	let { onLeave = () => {} } = $props<{ onLeave?: () => void }>();

	let micPopoverOpen = $state(false);
	let cameraPopoverOpen = $state(false);
	let settingsOpen = $state(false);
	let showInputDevices = $state(false);
	let showOutputDevices = $state(false);
	let showCameraDevices = $state(false);

	function openSettings() {
		micPopoverOpen = false;
		cameraPopoverOpen = false;
		settingsOpen = true;
	}

	function currentInputLabel() {
		return $media.audioInputs.find((device) => device.deviceId === $media.selectedAudioInput)?.label ?? 'Default';
	}

	function currentOutputLabel() {
		return $media.audioOutputs.find((device) => device.deviceId === $media.selectedAudioOutput)?.label ?? 'Default';
	}

	function currentCameraLabel() {
		return $media.videoInputs.find((device) => device.deviceId === $media.selectedVideoInput)?.label ?? 'Default';
	}
</script>

<VoiceVideoSettingsDialog open={settingsOpen} onClose={() => (settingsOpen = false)} />

<div class="flex items-center justify-center gap-2">
	<div class="flex items-center gap-0.5 rounded-full bg-secondary px-1 py-1">
		<button
			type="button"
			class={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
				$media.isMicOn
					? 'text-muted-foreground hover:bg-accent hover:text-foreground'
					: 'bg-accent text-destructive'
			}`}
			onclick={toggleMic}
			aria-label={$media.isMicOn ? 'Mute' : 'Unmute'}
		>
			{#if $media.isMicOn}
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true">
					<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
					<path d="M19 10v2a7 7 0 0 1-14 0v-2" />
					<line x1="12" x2="12" y1="19" y2="22" />
				</svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true">
					<line x1="2" x2="22" y1="2" y2="22" />
					<path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
					<path d="M5 10v2a7 7 0 0 0 12 5.29" />
					<path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
					<path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
					<line x1="12" x2="12" y1="19" y2="22" />
				</svg>
			{/if}
		</button>

		<Popover open={micPopoverOpen} onOpenChange={(nextOpen) => (micPopoverOpen = nextOpen)} align="start">
			{#snippet trigger()}
				<button
					type="button"
					class="flex h-9 w-5 items-center justify-center rounded-r-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
					onclick={() => (micPopoverOpen = !micPopoverOpen)}
					aria-label="Audio settings"
				>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3" aria-hidden="true">
						<path d="m6 9 6 6 6-6" />
					</svg>
				</button>
			{/snippet}

			{#snippet children()}
				<div class="grid gap-0.5">
					<button
						type="button"
						class="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent"
						onclick={() => (showInputDevices = !showInputDevices)}
					>
						<div class="grid gap-0">
							<span class="text-sm font-semibold text-foreground">Input Device</span>
							<span class="text-xs text-muted-foreground">{currentInputLabel()}</span>
						</div>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 text-muted-foreground" aria-hidden="true">
							<path d="m9 18 6-6-6-6" />
						</svg>
					</button>
					{#if showInputDevices}
						<div class="ml-1 grid gap-0.5 border-l border-border pl-2">
							{#each $media.audioInputs as device}
								<button
									type="button"
									class={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
										device.deviceId === $media.selectedAudioInput
											? 'bg-accent text-foreground'
											: 'text-muted-foreground hover:bg-accent hover:text-foreground'
									}`}
									onclick={() => {
										setSelectedAudioInput(device.deviceId);
										showInputDevices = false;
									}}
								>
									<span class="truncate">{device.label}</span>
									{#if device.deviceId === $media.selectedAudioInput}
										<span class="ml-2 text-xs text-[var(--success)]">✓</span>
									{/if}
								</button>
							{/each}
						</div>
					{/if}

					<button
						type="button"
						class="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent"
						onclick={() => (showOutputDevices = !showOutputDevices)}
					>
						<div class="grid gap-0">
							<span class="text-sm font-semibold text-foreground">Output Device</span>
							<span class="text-xs text-muted-foreground">{currentOutputLabel()}</span>
						</div>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 text-muted-foreground" aria-hidden="true">
							<path d="m9 18 6-6-6-6" />
						</svg>
					</button>
					{#if showOutputDevices}
						<div class="ml-1 grid gap-0.5 border-l border-border pl-2">
							{#each $media.audioOutputs as device}
								<button
									type="button"
									class={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
										device.deviceId === $media.selectedAudioOutput
											? 'bg-accent text-foreground'
											: 'text-muted-foreground hover:bg-accent hover:text-foreground'
									}`}
									onclick={() => {
										setSelectedAudioOutput(device.deviceId);
										showOutputDevices = false;
									}}
								>
									<span class="truncate">{device.label}</span>
									{#if device.deviceId === $media.selectedAudioOutput}
										<span class="ml-2 text-xs text-[var(--success)]">✓</span>
									{/if}
								</button>
							{/each}
						</div>
					{/if}

					<div class="my-1.5 h-px bg-border"></div>

					<div class="grid gap-1.5 px-2 py-1">
						<span class="text-xs font-semibold text-foreground">Input Volume</span>
						<input
							type="range"
							min="0"
							max="200"
							value={$media.inputVolume}
							oninput={(event) => setInputVolume(Number((event.currentTarget as HTMLInputElement).value))}
							class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
						/>
					</div>

					<div class="grid gap-1.5 px-2 py-1">
						<span class="text-xs font-semibold text-foreground">Output Volume</span>
						<input
							type="range"
							min="0"
							max="200"
							value={$media.outputVolume}
							oninput={(event) => setOutputVolume(Number((event.currentTarget as HTMLInputElement).value))}
							class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
						/>
					</div>

					<div class="my-1.5 h-px bg-border"></div>

					<button
						type="button"
						class="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent"
						onclick={toggleDeafen}
					>
						<span class="text-sm font-semibold text-foreground">Deafen</span>
						<div class={`h-4 w-7 rounded-full transition-colors ${$media.isDeafened ? 'bg-primary' : 'bg-muted'}`}>
							<div
								class={`h-4 w-4 rounded-full border-2 transition-transform ${
									$media.isDeafened
										? 'translate-x-3 border-primary bg-white'
										: 'translate-x-0 border-muted bg-muted-foreground'
								}`}
							></div>
						</div>
					</button>

					<div class="my-1.5 h-px bg-border"></div>

					<button
						type="button"
						class="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent"
						onclick={openSettings}
					>
						<span class="text-sm font-semibold text-foreground">Voice Settings</span>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 text-muted-foreground" aria-hidden="true">
							<circle cx="12" cy="12" r="3" />
							<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 8.92 4.6H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c0 .66.39 1.26 1 1.51H21a2 2 0 0 1 0 4h-.09c-.61.25-1 .85-1 1.49Z" />
						</svg>
					</button>
				</div>
			{/snippet}
		</Popover>

		<div class="mx-0.5 h-5 w-px bg-border"></div>

		<button
			type="button"
			class={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
				$media.isCameraOn
					? 'text-muted-foreground hover:bg-accent hover:text-foreground'
					: 'bg-accent text-destructive'
			}`}
			onclick={toggleCamera}
			aria-label={$media.isCameraOn ? 'Turn off camera' : 'Turn on camera'}
		>
			{#if $media.isCameraOn}
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true">
					<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
					<rect x="2" y="6" width="14" height="12" rx="2" />
				</svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true">
					<path d="M10.66 6H14a2 2 0 0 1 2 2v2.5l5.248-3.062A.5.5 0 0 1 22 7.87v8.196" />
					<path d="M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2" />
					<line x1="2" x2="22" y1="2" y2="22" />
				</svg>
			{/if}
		</button>

		<Popover open={cameraPopoverOpen} onOpenChange={(nextOpen) => (cameraPopoverOpen = nextOpen)} align="start">
			{#snippet trigger()}
				<button
					type="button"
					class="flex h-9 w-5 items-center justify-center rounded-r-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
					onclick={() => (cameraPopoverOpen = !cameraPopoverOpen)}
					aria-label="Video settings"
				>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3" aria-hidden="true">
						<path d="m6 9 6 6 6-6" />
					</svg>
				</button>
			{/snippet}

			{#snippet children()}
				<div class="grid gap-0.5">
					<button
						type="button"
						class="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent"
						onclick={() => (showCameraDevices = !showCameraDevices)}
					>
						<div class="grid gap-0">
							<span class="text-sm font-semibold text-foreground">Camera</span>
							<span class="text-xs text-muted-foreground">{currentCameraLabel()}</span>
						</div>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 text-muted-foreground" aria-hidden="true">
							<path d="m9 18 6-6-6-6" />
						</svg>
					</button>
					{#if showCameraDevices}
						<div class="ml-1 grid gap-0.5 border-l border-border pl-2">
							{#each $media.videoInputs as device}
								<button
									type="button"
									class={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
										device.deviceId === $media.selectedVideoInput
											? 'bg-accent text-foreground'
											: 'text-muted-foreground hover:bg-accent hover:text-foreground'
									}`}
									onclick={() => {
										setSelectedVideoInput(device.deviceId);
										showCameraDevices = false;
									}}
								>
									<span class="truncate">{device.label}</span>
									{#if device.deviceId === $media.selectedVideoInput}
										<span class="ml-2 text-xs text-[var(--success)]">✓</span>
									{/if}
								</button>
							{/each}
						</div>
					{/if}

					<div class="my-1.5 h-px bg-border"></div>

					<button
						type="button"
						class="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent"
					>
						<span class="text-sm font-semibold text-foreground">Preview Camera</span>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 text-muted-foreground" aria-hidden="true">
							<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
							<circle cx="12" cy="12" r="3" />
						</svg>
					</button>

					<button
						type="button"
						class="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent"
						onclick={openSettings}
					>
						<span class="text-sm font-semibold text-foreground">Video Settings</span>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 text-muted-foreground" aria-hidden="true">
							<circle cx="12" cy="12" r="3" />
							<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 8.92 4.6H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c0 .66.39 1.26 1 1.51H21a2 2 0 0 1 0 4h-.09c-.61.25-1 .85-1 1.49Z" />
						</svg>
					</button>
				</div>
			{/snippet}
		</Popover>
	</div>

	<button
		type="button"
		class={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
			$screenShare.localActive
				? 'bg-accent text-destructive'
				: 'text-muted-foreground hover:bg-accent hover:text-foreground'
		}`}
		onclick={() => void ($screenShare.localActive ? stopScreenShare() : startScreenShare())}
		aria-label={$screenShare.localActive ? 'Stop sharing' : 'Share screen'}
	>
		{#if $screenShare.localActive}
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true">
				<path d="M13 3H4a2 2 0 0 0-2 2v6" />
				<path d="M22 8V5a2 2 0 0 0-2-2h-3" />
				<path d="M2 17v2a2 2 0 0 0 2 2h6" />
				<path d="M17 22h3a2 2 0 0 0 2-2v-3" />
				<path d="m2 2 20 20" />
				<path d="M7 7h8v6" />
			</svg>
		{:else}
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true">
				<path d="M13 3H4a2 2 0 0 0-2 2v6" />
				<path d="M22 8V5a2 2 0 0 0-2-2h-3" />
				<path d="M2 17v2a2 2 0 0 0 2 2h6" />
				<path d="M17 22h3a2 2 0 0 0 2-2v-3" />
				<path d="M7 7h10v10" />
			</svg>
		{/if}
	</button>

	<div class="relative">
		<button
			type="button"
			class={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
				$layout.chatOpen
					? 'bg-accent text-destructive'
					: 'text-muted-foreground hover:bg-accent hover:text-foreground'
			}`}
			onclick={toggleChat}
			aria-label="Toggle chat"
		>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true">
				<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
			</svg>
		</button>

		{#if $chat.unreadCount > 0}
			<span class="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
				{$chat.unreadCount > 99 ? '99+' : $chat.unreadCount}
			</span>
		{/if}
	</div>

	<button
		type="button"
		class={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
			$layout.rosterOpen
				? 'bg-accent text-destructive'
				: 'text-muted-foreground hover:bg-accent hover:text-foreground'
		}`}
		onclick={toggleRoster}
		aria-label="Toggle participants"
	>
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true">
			<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
			<circle cx="9" cy="7" r="4" />
			<path d="M22 21v-2a4 4 0 0 0-3-3.87" />
			<path d="M16 3.13a4 4 0 0 1 0 7.75" />
		</svg>
	</button>

	<button
		type="button"
		class="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
		onclick={toggleLayoutMode}
		aria-label={$layout.mode === 'gallery' ? 'Speaker view' : 'Gallery view'}
	>
		{#if $layout.mode === 'gallery'}
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true">
				<rect x="3" y="4" width="18" height="8" rx="2" />
				<path d="M5 20h6" />
				<path d="M13 20h6" />
				<path d="M5 16h6" />
				<path d="M13 16h6" />
			</svg>
		{:else}
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true">
				<rect x="3" y="3" width="7" height="7" rx="1" />
				<rect x="14" y="3" width="7" height="7" rx="1" />
				<rect x="14" y="14" width="7" height="7" rx="1" />
				<rect x="3" y="14" width="7" height="7" rx="1" />
			</svg>
		{/if}
	</button>

	<button
		type="button"
		class="flex h-9 items-center justify-center rounded-full bg-destructive px-5 transition-colors hover:bg-destructive/85"
		onclick={onLeave}
		aria-label="Leave call"
	>
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 text-destructive-foreground" aria-hidden="true">
			<path d="M10.76 5.23a16 16 0 0 0-7 5.5 2.1 2.1 0 0 0 .23 2.62l2 2a2 2 0 0 0 2.67.12l2.1-1.68a16 16 0 0 1 2.48 2.48l-1.68 2.1a2 2 0 0 0 .12 2.67l2 2a2.1 2.1 0 0 0 2.62.23 16 16 0 0 0 5.5-7" />
			<path d="m2 2 20 20" />
		</svg>
	</button>
</div>
